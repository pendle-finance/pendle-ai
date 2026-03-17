import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type Database from 'better-sqlite3';
import { z } from 'zod';
import { jsonResult, pendleApi } from '../api-client.js';
import {
  CHAIN_ID_DESC,
  LARGE_TRADE_USD,
  PRICE_IMPACT_HIGH,
  PRICE_IMPACT_WARN,
} from '../constants.js';
import { structuredErrorContent } from '../errors.js';
import {
  getAsset,
  getChains,
  type ExternalProtocolFilter,
  type MarketFilter,
  type MarketSort,
  queryExternalProtocols,
  queryMarkets,
} from '../storage.js';
import {
  callConvert,
  resolveAmount,
  resolveSlippage,
  resolveSlippageMulti,
} from './action-tools.js';
import { getMarketIdentity, isPostMaturity, type MarketIdentity } from './market-cache.js';
import { enrichOutputs, estimateUsdValue, searchAssets } from './price-cache.js';

/** Actions that require a market address. Hoisted for reuse and to avoid per-call allocation. */
const NEEDS_MARKET = new Set([
  'buy_pt',
  'sell_pt',
  'buy_yt',
  'sell_yt',
  'add_liquidity',
  'remove_liquidity',
  'mint-sy',
  'redeem-sy',
  'mint-py',
  'redeem-py',
]);

/** Actions that map to mint_redeem tool. */
const MINT_REDEEM_ACTIONS = new Set(['mint-sy', 'redeem-sy', 'mint-py', 'redeem-py']);

// ── Registration ─────────────────────────────────────────────────────────────

export function registerQueryTools(server: McpServer, db: Database.Database) {
  // 1. get_markets — SQL-backed market query (replaces find_markets)
  server.registerTool(
    'get_markets',
    {
      description:
        'Query Pendle markets from local database (synced every 5 min). ' +
        'Supports structured filters, sorting, and pagination. ' +
        'Column names use flat "details_" prefix (e.g. details_impliedApy, details_liquidity). ' +
        'Returns flat market rows.',
      inputSchema: {
        filter: z
          .array(
            z.object({
              field: z
                .string()
                .describe('Column name (e.g. "chainId", "details_impliedApy", "name")'),
              op: z.string().describe('Operator: =, !=, >, <, >=, <=, LIKE'),
              value: z.union([z.string(), z.number()]).describe('Value to compare against'),
            }),
          )
          .optional()
          .describe('Array of filters (AND-combined)'),
        sort: z
          .object({
            field: z.string().describe('Column to sort by'),
            direction: z.enum(['asc', 'desc']).describe('Sort direction'),
          })
          .optional()
          .describe('Sort order'),
        limit: z.number().optional().describe('Max rows to return (default 20, max 100)'),
        skip: z.number().optional().describe('Rows to skip for pagination'),
        one: z.boolean().optional().describe('Return single row instead of array'),
      },
    },
    async (args) => {
      try {
        const result = queryMarkets(db, {
          filter: args.filter as MarketFilter[] | undefined,
          sort: args.sort as MarketSort | undefined,
          limit: args.limit,
          skip: args.skip,
          one: args.one,
        });
        return jsonResult(result);
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 1b. get_asset — single Pendle asset lookup from local DB
  server.registerTool(
    'get_asset',
    {
      description:
        'Look up a Pendle token (PT, YT, SY, LP) by chainId and address from local database. ' +
        'Returns metadata: name, symbol, decimals, tags, expiry. ' +
        'For standard ERC-20s (USDC, WETH), use resolve_token instead.',
      inputSchema: {
        chainId: z.number().describe('Chain ID'),
        address: z.string().describe('Token address'),
      },
    },
    async (args) => {
      try {
        const asset = getAsset(db, args.chainId, args.address);
        if (!asset) {
          return structuredErrorContent(
            new Error(
              `Asset ${args.address} not found on chain ${args.chainId}. ` +
                'This table only contains Pendle tokens (PT, YT, SY, LP). ' +
                'For standard ERC-20s, use resolve_token instead.',
            ),
          );
        }
        return jsonResult(asset);
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 1c. get_chains — list supported chain IDs from local DB
  server.registerTool(
    'get_chains',
    {
      description:
        'List all blockchain networks supported by Pendle. ' +
        'Returns chain IDs from local database (synced every 5 min). ' +
        'Call this instead of guessing chain IDs — the list updates as Pendle deploys to new chains.',
      inputSchema: {},
    },
    async () => {
      try {
        const chainIds = getChains(db);
        return jsonResult({ chainIds });
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 2. get_market
  server.registerTool(
    'get_market',
    {
      description:
        'Get complete market data — APY breakdown, pool metrics, token addresses, and accepted input/output tokens in one call.',
      inputSchema: {
        chainId: z.number().describe('Chain ID'),
        market: z.string().describe('Market address'),
      },
    },
    async (args) => {
      try {
        const [marketRes, tokens] = await Promise.all([
          pendleApi.markets.getAllMarketsV2({ ids: `${args.chainId}-${args.market}` }),
          pendleApi.sdk.getMarketTokens(args.chainId, args.market),
        ]);

        const market = marketRes.results[0] ?? {};

        return jsonResult({ market, tokens });
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 3. get_prices
  // API: GET /v1/prices/assets — all params optional ("leave blank to fetch all tokens")
  server.registerTool(
    'get_prices',
    {
      description:
        'Get USD prices for Pendle tokens. Omit addresses to fetch all prices for a chain. Omit chainId for all chains.',
      inputSchema: {
        chainId: z.number().optional().describe('Chain ID (omit for all chains)'),
        addresses: z
          .string()
          .optional()
          .describe(
            'Comma-separated token addresses in "chainId-address" format, e.g. "42161-0xaf88..." (omit for all tokens, up to 20)',
          ),
      },
    },
    async (args) => {
      try {
        let ids: string | undefined;
        if (args.addresses && args.chainId) {
          // Format addresses as chainId-address (skip if already prefixed)
          ids = args.addresses
            .split(',')
            .map((addr: string) => {
              const trimmed = addr.trim();
              return trimmed.includes('-') ? trimmed : `${args.chainId}-${trimmed}`;
            })
            .join(',');
        } else if (args.addresses) {
          // Addresses without chainId — pass as-is (caller must use chainId-address format)
          ids = args.addresses;
        }

        const data = await pendleApi.assets.getAllAssetPricesByAddressesCrossChains({
          ids,
          chainId: ids ? undefined : args.chainId,
        });
        return jsonResult(data);
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 4. get_portfolio
  server.registerTool(
    'get_portfolio',
    {
      description:
        'Get all Pendle positions for a wallet across all chains — PT, YT, LP holdings with USD valuations and claimable rewards.',
      inputSchema: {
        user: z.string().describe('Wallet address'),
      },
    },
    async (args) => {
      try {
        const raw = await pendleApi.dashboard.getUserPositions(args.user.toLowerCase());

        // The API returns per-chain objects with nested openPositions/closedPositions/syPositions.
        // Each position has marketId + nested pt/yt/lp objects with valuation and balance.
        // Flatten into a single array of individual positions for the AI agent.
        const rawObj = raw as unknown as Record<string, unknown>;
        const chainEntries = Array.isArray(rawObj)
          ? rawObj
          : Array.isArray((rawObj as { positions?: unknown }).positions)
            ? (rawObj as { positions: unknown[] }).positions
            : null;

        if (!chainEntries) {
          return jsonResult(raw);
        }

        interface TokenPos {
          valuation?: number;
          balance?: string;
          activeBalance?: string;
          claimTokenAmounts?: Array<{ token: string; amount: string }>;
        }
        interface MarketPos {
          marketId?: string;
          pt?: TokenPos;
          yt?: TokenPos;
          lp?: TokenPos;
        }
        interface SyPos {
          syId?: string;
          balance?: string;
        }
        interface ChainEntry {
          chainId?: number;
          openPositions?: MarketPos[];
          closedPositions?: MarketPos[];
          syPositions?: SyPos[];
        }

        const shaped: Array<Record<string, unknown>> = [];

        for (const chain of chainEntries as ChainEntry[]) {
          const chainId = chain.chainId;
          const allMarketPositions = [
            ...(chain.openPositions ?? []),
            ...(chain.closedPositions ?? []),
          ];

          for (const pos of allMarketPositions) {
            const marketId = pos.marketId ?? '';
            // Extract address from "chainId-address" format
            const marketAddress = marketId.includes('-')
              ? marketId.split('-').slice(1).join('-')
              : marketId;

            for (const type of ['pt', 'yt', 'lp'] as const) {
              const t = pos[type];
              if (!t || (t.balance === '0' && (t.valuation === 0 || t.valuation == null))) continue;
              shaped.push({
                chainId,
                market: marketAddress,
                type,
                balance: t.balance,
                balanceUsd: t.valuation,
                ...(type === 'lp' && t.activeBalance ? { activeBalance: t.activeBalance } : {}),
                ...(t.claimTokenAmounts && t.claimTokenAmounts.length > 0
                  ? { claimable: t.claimTokenAmounts }
                  : {}),
              });
            }
          }

          for (const sy of chain.syPositions ?? []) {
            if (sy.balance === '0') continue;
            const syId = sy.syId ?? '';
            const syAddress = syId.includes('-') ? syId.split('-').slice(1).join('-') : syId;
            shaped.push({
              chainId,
              token: syAddress,
              type: 'sy',
              balance: sy.balance,
            });
          }
        }

        return jsonResult({
          positions: shaped,
          totalPositions: shaped.length,
        });
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 5. get_order_book
  server.registerTool(
    'get_order_book',
    {
      description:
        'Get the consolidated order book for a Pendle market — limit orders + AMM depth.',
      inputSchema: {
        chainId: z.number().describe('Chain ID'),
        market: z.string().describe('Market address'),
        precisionDecimal: z
          .number()
          .optional()
          .describe('Decimal precision for APY buckets (0-3). Default: 2'),
      },
    },
    async (args) => {
      try {
        const data = await pendleApi.limitOrders.getLimitOrderBookV2(args.chainId, {
          market: args.market,
          precisionDecimal: args.precisionDecimal ?? 2,
        });
        return jsonResult(data);
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 6. get_history
  server.registerTool(
    'get_history',
    {
      description:
        "Get time-series data for a market. Use 'all' for everything, or pick specific fields to reduce payload size.",
      inputSchema: {
        chainId: z.number().describe('Chain ID'),
        market: z.string().describe('Market address'),
        fields: z
          .string()
          .optional()
          .describe(
            "Comma-separated fields or 'all'. Valid fields: " +
              'timestamp, impliedApy, underlyingApy, tvl, ptPrice, ytPrice, lpPrice, ' +
              'ptDiscount, ptToAssetRate, syToAssetRate, underlyingPrice, ' +
              'volume24h, totalVolume, swapFee, pendleApy, aggregatedApy, ptExchangeRate',
          ),
        timeFrame: z
          .enum(['hour', 'day', 'week'])
          .optional()
          .describe('Time frame granularity. Default: day'),
      },
    },
    async (args) => {
      try {
        const data = await pendleApi.markets.marketHistoricalDataV2(args.chainId, args.market, {
          fields: args.fields,
          time_frame: args.timeFrame,
        });
        return jsonResult(data);
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 7. resolve_token
  server.registerTool(
    'resolve_token',
    {
      description:
        'Resolve a token symbol or name to its address on a given chain. ' +
        "Searches Pendle's asset registry (cached, 0 CU if warm). " +
        'Use this when you have a symbol like "USDC" or "stETH" but need the 0x address.',
      inputSchema: {
        chainId: z.number().describe(CHAIN_ID_DESC),
        query: z.string().describe('Token symbol or name to search (e.g. "USDC", "stETH", "Lido")'),
      },
    },
    async (args) => {
      try {
        const results = await searchAssets(args.chainId, args.query);

        if (results.length === 0) {
          return jsonResult({
            ok: true,
            matches: [],
            hint: `No tokens matching "${args.query}" found on chain ${args.chainId}. Try a different spelling or check the chain ID.`,
          });
        }

        return jsonResult({
          ok: true,
          matches: results.slice(0, 20), // Cap at 20 for readability
          total: results.length,
        });
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 8. preview_trade
  server.registerTool(
    'preview_trade',
    {
      description:
        'Preview a trade before execution — returns expected output, price impact, and required approvals WITHOUT the transaction calldata. ' +
        'Use this to show the user what will happen before calling an action tool. Same API cost as the real trade.',
      inputSchema: {
        chainId: z.number().describe(CHAIN_ID_DESC),
        action: z
          .enum([
            'buy_pt',
            'sell_pt',
            'buy_yt',
            'sell_yt',
            'add_liquidity',
            'remove_liquidity',
            'pendle_swap',
            'mint-sy',
            'redeem-sy',
            'mint-py',
            'redeem-py',
          ])
          .describe('The action to preview'),
        market: z.string().optional().describe('Market address (required for all except swap)'),
        tokenIn: z
          .string()
          .optional()
          .describe('Input token address (also used as the token param for mint/redeem)'),
        tokenOut: z
          .string()
          .optional()
          .describe('Output token address (for sell/remove/swap; also used as output for redeem)'),
        amount: z.string().optional().describe('Input amount in wei (provide this OR humanAmount)'),
        humanAmount: z
          .number()
          .optional()
          .describe('Input amount in human units (provide this OR amount)'),
        receiver: z.string().describe('Receiver wallet address'),
        slippage: z.number().optional().describe('Slippage tolerance (auto-determined if omitted)'),
        mode: z
          .enum(['single', 'zpi'])
          .optional()
          .describe('Liquidity mode (only for add_liquidity)'),
      },
    },
    async (args) => {
      try {
        // ── Validate required params per action ──────────────────────────
        if (NEEDS_MARKET.has(args.action) && !args.market) {
          return structuredErrorContent(new Error(`market is required for ${args.action}`));
        }

        // ── Resolve market identity if needed ────────────────────────────
        const market = args.market ?? '';
        let identity: MarketIdentity | null = null;
        if (market) {
          identity = await getMarketIdentity(args.chainId, market);
        }

        // ── Resolve humanAmount → wei if needed ─────────────────────────
        // Determine which token's decimals to use for conversion
        let amountResolveToken: string | undefined;
        if (args.humanAmount != null && !args.amount) {
          switch (args.action) {
            case 'buy_pt':
            case 'buy_yt':
            case 'add_liquidity':
            case 'mint-sy':
            case 'mint-py':
              amountResolveToken = args.tokenIn;
              break;
            case 'sell_pt':
              amountResolveToken = identity?.pt;
              break;
            case 'sell_yt':
              amountResolveToken = identity?.yt;
              break;
            case 'remove_liquidity':
              amountResolveToken = args.market;
              break;
            case 'pendle_swap':
              amountResolveToken = args.tokenIn;
              break;
            case 'redeem-sy':
              amountResolveToken = identity?.sy;
              break;
            case 'redeem-py':
              amountResolveToken = identity?.pt;
              break;
          }
          if (!amountResolveToken) {
            return structuredErrorContent(
              new Error(`Cannot resolve humanAmount — missing token context for ${args.action}`),
            );
          }
        }
        const resolvedAmount = await resolveAmount(
          args.chainId,
          amountResolveToken ?? args.tokenIn ?? identity?.pt ?? '',
          args.amount,
          args.humanAmount,
        );

        // ── Determine slippage token & build inputs/outputs ──────────────
        let slippageToken: string | null = null; // null when using multi-token slippage
        let slippageMultiTokens: Array<{ address: string; amountWei: string }> | null = null;
        let inputs: Array<{ token: string; amount: string }>;
        let outputs: string[];

        // Actions other than pendle_swap require market identity
        if (!identity && args.action !== 'pendle_swap') {
          return structuredErrorContent(
            new Error(`Market identity is required for ${args.action} — provide a market address.`),
          );
        }
        // Narrow type: identity is non-null for all branches except pendle_swap
        const id = identity as MarketIdentity;

        switch (args.action) {
          case 'buy_pt':
            if (!args.tokenIn)
              return structuredErrorContent(new Error('tokenIn is required for buy_pt'));
            if (isPostMaturity(id)) {
              return structuredErrorContent(
                new Error(
                  `Cannot buy PT post-maturity — market expired at ${id.expiry}. PT already trades at 1:1 with underlying. Use sell_pt to redeem.`,
                ),
              );
            }
            slippageToken = args.tokenIn;
            inputs = [{ token: args.tokenIn, amount: resolvedAmount }];
            outputs = [id.pt];
            break;

          case 'sell_pt':
            if (!args.tokenOut)
              return structuredErrorContent(new Error('tokenOut is required for sell_pt'));
            slippageToken = id.pt;
            inputs = [{ token: id.pt, amount: resolvedAmount }];
            outputs = [args.tokenOut];
            break;

          case 'buy_yt':
            if (!args.tokenIn)
              return structuredErrorContent(new Error('tokenIn is required for buy_yt'));
            if (isPostMaturity(id)) {
              return structuredErrorContent(
                new Error(
                  `Cannot buy YT post-maturity — YT is worthless after expiry. Market expired at ${id.expiry}.`,
                ),
              );
            }
            slippageToken = args.tokenIn;
            inputs = [{ token: args.tokenIn, amount: resolvedAmount }];
            outputs = [id.yt];
            break;

          case 'sell_yt':
            if (!args.tokenOut)
              return structuredErrorContent(new Error('tokenOut is required for sell_yt'));
            if (isPostMaturity(id)) {
              return structuredErrorContent(
                new Error(
                  `Cannot sell YT post-maturity — YT is worthless ($0) after expiry. Market expired at ${id.expiry}.`,
                ),
              );
            }
            slippageToken = id.yt;
            inputs = [{ token: id.yt, amount: resolvedAmount }];
            outputs = [args.tokenOut];
            break;

          case 'add_liquidity': {
            if (!args.tokenIn)
              return structuredErrorContent(new Error('tokenIn is required for add_liquidity'));
            if (isPostMaturity(id)) {
              return structuredErrorContent(
                new Error(
                  `Cannot add liquidity post-maturity — market expired at ${id.expiry}. The pool no longer generates swap fees.`,
                ),
              );
            }
            slippageToken = args.tokenIn;
            const mode = args.mode ?? 'single';
            if (mode === 'zpi') {
              inputs = [{ token: args.tokenIn, amount: resolvedAmount }];
              outputs = [market, id.yt];
            } else {
              inputs = [{ token: args.tokenIn, amount: resolvedAmount }];
              outputs = [market];
            }
            break;
          }

          case 'remove_liquidity':
            if (!args.tokenOut)
              return structuredErrorContent(new Error('tokenOut is required for remove_liquidity'));
            slippageToken = market;
            inputs = [{ token: market, amount: resolvedAmount }];
            outputs = [args.tokenOut];
            break;

          case 'pendle_swap':
            if (!args.tokenIn)
              return structuredErrorContent(new Error('tokenIn is required for pendle_swap'));
            if (!args.tokenOut)
              return structuredErrorContent(new Error('tokenOut is required for pendle_swap'));
            slippageToken = args.tokenIn;
            inputs = [{ token: args.tokenIn, amount: resolvedAmount }];
            outputs = [args.tokenOut];
            break;

          case 'mint-sy':
            if (!args.tokenIn)
              return structuredErrorContent(new Error('tokenIn is required for mint-sy'));
            slippageToken = args.tokenIn;
            inputs = [{ token: args.tokenIn, amount: resolvedAmount }];
            outputs = [id.sy];
            break;

          case 'redeem-sy':
            if (!args.tokenOut)
              return structuredErrorContent(new Error('tokenOut is required for redeem-sy'));
            slippageToken = id.sy;
            inputs = [{ token: id.sy, amount: resolvedAmount }];
            outputs = [args.tokenOut];
            break;

          case 'mint-py':
            if (!args.tokenIn)
              return structuredErrorContent(new Error('tokenIn is required for mint-py'));
            if (isPostMaturity(id)) {
              return structuredErrorContent(
                new Error(
                  `mint-py is not available post-maturity. Market expired at ${id.expiry}.`,
                ),
              );
            }
            slippageToken = args.tokenIn;
            inputs = [{ token: args.tokenIn, amount: resolvedAmount }];
            outputs = [id.pt, id.yt];
            break;

          case 'redeem-py':
            if (!args.tokenOut)
              return structuredErrorContent(new Error('tokenOut is required for redeem-py'));
            if (isPostMaturity(id)) {
              slippageToken = id.pt;
              inputs = [{ token: id.pt, amount: resolvedAmount }];
            } else {
              // Pre-maturity: both PT and YT are inputs — sum their values for slippage
              slippageMultiTokens = [
                { address: id.pt, amountWei: resolvedAmount },
                { address: id.yt, amountWei: resolvedAmount },
              ];
              inputs = [
                { token: id.pt, amount: resolvedAmount },
                { token: id.yt, amount: resolvedAmount },
              ];
            }
            outputs = [args.tokenOut];
            break;
        }

        // ── Resolve slippage (reuses shared helpers from action-tools) ─
        const slippage = slippageMultiTokens
          ? await resolveSlippageMulti(args.slippage, args.chainId, slippageMultiTokens)
          : await resolveSlippage(args.slippage, args.chainId, slippageToken ?? '', resolvedAmount);

        // ── Call Convert API (reuses shared callConvert from action-tools) ─
        const raw = await callConvert(args.chainId, inputs, outputs, {
          receiver: args.receiver,
          slippage,
        });
        const route = raw.routes[0];
        if (!route) {
          throw new Error(
            'Convert API returned no routes — the token pair may not be supported or liquidity is insufficient.',
          );
        }

        // ── Build preview (no tx.data) ───────────────────────────────────
        const priceImpactPct = route.data.priceImpact * 100;
        const warnings: string[] = [];

        if (Math.abs(route.data.priceImpact) > PRICE_IMPACT_HIGH) {
          warnings.push(
            `⚠️ High price impact (${priceImpactPct.toFixed(2)}%) — consider a smaller amount or splitting trades.`,
          );
        } else if (Math.abs(route.data.priceImpact) > PRICE_IMPACT_WARN) {
          warnings.push(
            `Price impact is ${priceImpactPct.toFixed(2)}% — note this before proceeding.`,
          );
        }
        if (id && isPostMaturity(id)) {
          warnings.push(
            `⚠️ This market has expired (${id.expiry}). Some operations (buy_yt, mint-py) are not available post-maturity.`,
          );
        }

        // USD value for large trade warning (estimateUsdValue is cached, no extra API call)
        try {
          const usdValue: number = slippageToken
            ? await estimateUsdValue(args.chainId, slippageToken, resolvedAmount)
            : await Promise.all(
                (slippageMultiTokens ?? []).map((t) =>
                  estimateUsdValue(args.chainId, t.address, t.amountWei),
                ),
              ).then((vals) => vals.reduce((a, b) => a + b, 0));
          if (usdValue > LARGE_TRADE_USD) {
            warnings.push(
              `⚠️ Large trade (~$${usdValue.toFixed(0)}) — double-check all parameters.`,
            );
          }
        } catch {
          // Non-critical — skip USD warning if estimation fails
        }

        return jsonResult({
          ok: true,
          preview: {
            action: raw.action,
            expectedOutputs: await enrichOutputs(
              args.chainId,
              route.outputs.map((o) => ({ token: o.token, amount: o.amount })),
            ),
            priceImpact: route.data.priceImpact,
            priceImpactPct: `${priceImpactPct.toFixed(4)}%`,
            impliedApy: route.data.impliedApy,
            slippageUsed: slippage,
            routerAddress: route.tx.to,
            approvals: (raw.requiredApprovals ?? []).map((a) => ({
              token: a.token,
              amount: a.amount,
              spender: route.tx.to,
              instruction: `Approve ${a.token} for ${a.amount} to spender ${route.tx.to}`,
            })),
            approvalsNote:
              (raw.requiredApprovals ?? []).length === 0
                ? 'Current on-chain allowance is sufficient.'
                : `${(raw.requiredApprovals ?? []).length} approval(s) needed before execution.`,
          },
          warnings: warnings.length > 0 ? warnings : undefined,
          // Structured next-step: tool name + pre-filled params for the AI agent to call
          nextTool: MINT_REDEEM_ACTIONS.has(args.action)
            ? {
                tool: 'mint_redeem',
                params: {
                  chainId: args.chainId,
                  market: args.market,
                  action: args.action,
                  token: args.action.startsWith('mint') ? args.tokenIn : args.tokenOut,
                  amount: resolvedAmount,
                  receiver: args.receiver,
                  slippage: args.slippage,
                },
                instruction:
                  'If the user confirms, call the tool above with these params to get the full transaction calldata.',
              }
            : {
                tool: args.action,
                params: {
                  chainId: args.chainId,
                  market: args.market,
                  tokenIn: args.tokenIn,
                  tokenOut: args.tokenOut,
                  amount: resolvedAmount,
                  receiver: args.receiver,
                  slippage: args.slippage,
                  mode: args.mode,
                },
                instruction:
                  'If the user confirms, call the tool above with these params to get the full transaction calldata.',
              },
        });
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 9. pendle_router — start-here tool for ambiguous intents
  server.registerTool(
    'pendle_router',
    {
      description:
        'Start here when unsure which Pendle tool to use. Describes all available tools and suggests the best one for a given intent. ' +
        'Call this with a plain-English description of what the user wants to do.',
      inputSchema: {
        intent: z
          .string()
          .describe(
            'What the user wants to do, e.g. "earn fixed yield on ETH", "check my positions", "swap USDC to WETH"',
          ),
      },
    },
    async (args) => {
      const q = args.intent.toLowerCase();
      const suggestions: Array<{ tool: string; when: string }> = [];

      // Fixed yield / PT
      if (q.includes('fixed') || q.includes('lock') || q.includes('buy pt'))
        suggestions.push({
          tool: 'buy_pt',
          when: 'Buy PT to lock in a fixed yield until maturity',
        });
      if (q.includes('sell pt') || q.includes('exit fixed') || q.includes('redeem pt'))
        suggestions.push({ tool: 'sell_pt', when: 'Sell PT to exit a fixed yield position' });

      // Variable yield / YT
      if (
        q.includes('variable') ||
        q.includes('leverag') ||
        q.includes('buy yt') ||
        q.includes('yield token')
      )
        suggestions.push({ tool: 'buy_yt', when: 'Buy YT for leveraged variable yield exposure' });
      if (q.includes('sell yt') || q.includes('exit yt'))
        suggestions.push({ tool: 'sell_yt', when: 'Sell YT to exit variable yield position' });

      // Liquidity
      if (q.includes('liquidity') || q.includes('lp') || q.includes('provide'))
        suggestions.push(
          { tool: 'add_liquidity', when: 'Add liquidity to earn swap fees + PENDLE emissions' },
          { tool: 'remove_liquidity', when: 'Remove liquidity and get back your tokens' },
        );

      // Swap
      if (q.includes('swap') || q.includes('convert') || q.includes('exchange'))
        suggestions.push({
          tool: 'pendle_swap',
          when: 'Swap standard ERC-20 tokens (not PT/YT/SY)',
        });

      // Mint/redeem
      if (q.includes('mint') || q.includes('redeem') || q.includes('wrap') || q.includes('unwrap'))
        suggestions.push({
          tool: 'mint_redeem',
          when: 'Mint SY/PT+YT or redeem back to underlying',
        });

      // Portfolio / positions
      if (
        q.includes('portfolio') ||
        q.includes('position') ||
        q.includes('balance') ||
        q.includes('holding')
      )
        suggestions.push({
          tool: 'get_portfolio',
          when: 'View all Pendle positions across chains',
        });

      // Market discovery
      if (
        q.includes('find') ||
        q.includes('search') ||
        q.includes('discover') ||
        q.includes('market') ||
        q.includes('apy') ||
        q.includes('yield')
      )
        suggestions.push({
          tool: 'get_markets',
          when: 'Query Pendle markets by chain, status, APY, or any column',
        });
      if (q.includes('detail') || q.includes('info') || q.includes('data'))
        suggestions.push({
          tool: 'get_market',
          when: 'Get detailed market data, APY breakdown, and accepted tokens',
        });

      // Chains
      if (q.includes('chain') || q.includes('network') || q.includes('supported'))
        suggestions.push({
          tool: 'get_chains',
          when: 'List all blockchain networks supported by Pendle',
        });

      // Prices
      if (q.includes('price') || q.includes('value'))
        suggestions.push({ tool: 'get_prices', when: 'Get USD prices for Pendle tokens' });

      // Limit orders
      if (q.includes('limit') || q.includes('order'))
        suggestions.push(
          { tool: 'create_limit_order', when: 'Create a limit order at a target implied APY' },
          { tool: 'get_my_orders', when: 'View your active limit orders' },
          { tool: 'get_order_book', when: 'View the consolidated order book for a market' },
        );

      // Claims
      if (
        q.includes('claim') ||
        q.includes('reward') ||
        q.includes('emission') ||
        q.includes('interest')
      )
        suggestions.push({
          tool: 'claim_rewards',
          when: 'Claim PENDLE emissions, YT interest, and SY yield',
        });

      // Token resolution
      if (q.includes('token') || q.includes('address') || q.includes('resolve'))
        suggestions.push({
          tool: 'resolve_token',
          when: 'Resolve a token symbol (e.g. "USDC") to its 0x address',
        });

      // History
      if (q.includes('history') || q.includes('chart') || q.includes('time series'))
        suggestions.push({
          tool: 'get_history',
          when: 'Get historical APY, TVL, and price data for a market',
        });

      // Preview
      if (q.includes('preview') || q.includes('simulate') || q.includes('estimate'))
        suggestions.push({ tool: 'preview_trade', when: 'Preview any trade before executing it' });

      // If nothing matched, return the full tool catalog
      if (suggestions.length === 0) {
        suggestions.push(
          { tool: 'get_markets', when: 'Discover Pendle markets and yields' },
          { tool: 'get_market', when: 'Get detailed market data' },
          { tool: 'get_portfolio', when: 'View wallet positions' },
          { tool: 'preview_trade', when: 'Preview any trade' },
          { tool: 'buy_pt', when: 'Lock in fixed yield (buy PT)' },
          { tool: 'buy_yt', when: 'Leveraged variable yield (buy YT)' },
          { tool: 'add_liquidity', when: 'Provide liquidity for swap fees + PENDLE' },
          { tool: 'pendle_swap', when: 'Swap standard ERC-20 tokens' },
          { tool: 'mint_redeem', when: 'Mint/redeem SY or PT+YT' },
          { tool: 'claim_rewards', when: 'Claim rewards and interest' },
          { tool: 'create_limit_order', when: 'Place a limit order at target APY' },
          { tool: 'resolve_token', when: 'Look up token address by symbol' },
        );
      }

      return jsonResult({
        intent: args.intent,
        suggestions,
        tip: 'Call the suggested tool directly. Use preview_trade first if you want to check the outcome before executing.',
      });
    },
  );

  // 12. get_external_protocols
  server.registerTool(
    'get_external_protocols',
    {
      description:
        'Query external protocol integrations for Pendle markets — lending protocols (Aave, Morpho, Euler), restaking, and cross-chain PT integrations. ' +
        'Filter by protocol, token slot (pt/yt/lp/crossPt), APY range, or chain. ' +
        'Set includeMarket=true to JOIN market data (name, expiry, impliedApy) into results.',
      inputSchema: {
        filter: z
          .array(
            z.object({
              field: z
                .enum([
                  'chainId',
                  'market',
                  'slot',
                  'protocol_id',
                  'protocol_name',
                  'protocol_category',
                  'liquidity',
                  'borrowApy',
                  'supplyApy',
                  'totalSupply',
                  'supplyCap',
                  'maxLtv',
                ])
                .describe('Column to filter on'),
              op: z
                .enum(['=', '!=', '>', '<', '>=', '<=', 'LIKE'])
                .describe('Filter operator'),
              value: z.union([z.string(), z.number()]).describe('Filter value'),
            }),
          )
          .optional()
          .describe('Filter conditions (AND-combined)'),
        sort: z
          .object({
            field: z
              .enum([
                'chainId',
                'market',
                'slot',
                'protocol_id',
                'protocol_name',
                'protocol_category',
                'liquidity',
                'borrowApy',
                'supplyApy',
                'totalSupply',
                'supplyCap',
                'maxLtv',
                'market_name',
                'market_expiry',
                'details_impliedApy',
                'details_underlyingApy',
                'details_aggregatedApy',
              ])
              .describe('Column to sort by'),
            direction: z.enum(['asc', 'desc']).describe('Sort direction'),
          })
          .optional()
          .describe('Sort order (market_* and details_* fields require includeMarket=true)'),
        limit: z.number().optional().describe('Max results (default 20, max 100)'),
        skip: z.number().optional().describe('Results to skip for pagination'),
        includeMarket: z
          .boolean()
          .optional()
          .describe(
            'JOIN the markets table to include market_name, market_expiry, details_impliedApy, details_underlyingApy, details_aggregatedApy',
          ),
      },
    },
    async (args) => {
      try {
        const rows = queryExternalProtocols(db, {
          filter: args.filter as ExternalProtocolFilter[] | undefined,
          sort: args.sort,
          limit: args.limit,
          skip: args.skip,
          includeMarket: args.includeMarket,
        });
        return jsonResult({ total: rows.length, results: rows });
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  console.error('Registered 12 semantic query tools');
}
