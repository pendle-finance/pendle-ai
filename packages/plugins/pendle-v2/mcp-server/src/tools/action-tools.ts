import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { jsonResult, pendleApi } from '../api-client.js';
import {
  CHAIN_ID_DESC,
  DEFAULT_AGGREGATORS,
  SLIPPAGE_DEFAULT,
  SLIPPAGE_SMALL_TRADE,
  SMALL_TRADE_USD,
} from '../constants.js';
import { structuredErrorContent } from '../errors.js';
import type { MultiRouteConvertResponse, TokenAmountDto } from '../openapi/api.js';
import { getMarketIdentity, isPostMaturity } from './market-cache.js';
import {
  enrichApprovals,
  enrichOutputs,
  estimateUsdValue,
  getTokenDecimals,
} from './price-cache.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolve the effective slippage for a trade.
 *
 * Rules:
 * 1. If the user explicitly provides slippage, use that — no further logic.
 * 2. Otherwise, estimate USD value of the input (using asset metadata for
 *    correct decimals + price cache for USD price):
 *    - < $100 → 0.5% (small trades are more sensitive to rounding)
 *    - >= $100 → 0.1%
 * 3. If we can't determine USD value (unknown token, API failure) → fall back
 *    to 0.5% (SLIPPAGE_SMALL_TRADE) to avoid hard failures.
 */
/** Validate explicit slippage is within bounds [0, 0.5]. */
function validateSlippage(value: number): number {
  if (value < 0 || value > 0.5) {
    throw new Error(`Slippage must be between 0 and 0.5 (50%). Got: ${value}`);
  }
  return value;
}

/** Pick slippage tier based on USD value: higher slippage for small trades. */
function slippageTier(usdValue: number): number {
  return usdValue < SMALL_TRADE_USD ? SLIPPAGE_SMALL_TRADE : SLIPPAGE_DEFAULT;
}

export async function resolveSlippage(
  explicitSlippage: number | undefined,
  chainId: number,
  tokenAddress: string,
  amountWei: string,
): Promise<number> {
  if (explicitSlippage !== undefined) return validateSlippage(explicitSlippage);

  try {
    return slippageTier(await estimateUsdValue(chainId, tokenAddress, amountWei));
  } catch {
    console.error(
      `[resolveSlippage] Could not fetch price for ${tokenAddress} on chain ${chainId} — using ${SLIPPAGE_SMALL_TRADE} (0.5%) fallback`,
    );
    return SLIPPAGE_SMALL_TRADE;
  }
}

/**
 * Resolve slippage for trades with multiple input tokens (e.g. redeem-py pre-maturity).
 * Sums the USD value of all inputs in parallel to determine the trade size tier.
 * Falls back to 0.5% if price lookup fails.
 */
export async function resolveSlippageMulti(
  explicitSlippage: number | undefined,
  chainId: number,
  tokens: Array<{ address: string; amountWei: string }>,
): Promise<number> {
  if (explicitSlippage !== undefined) return validateSlippage(explicitSlippage);

  try {
    const usdValues = await Promise.all(
      tokens.map((t) => estimateUsdValue(chainId, t.address, t.amountWei)),
    );
    return slippageTier(usdValues.reduce((sum, v) => sum + v, 0));
  } catch {
    console.error(
      `[resolveSlippageMulti] Could not fetch prices on chain ${chainId} — using ${SLIPPAGE_SMALL_TRADE} (0.5%) fallback`,
    );
    return SLIPPAGE_SMALL_TRADE;
  }
}

export async function callConvert(
  chainId: number,
  inputs: TokenAmountDto[],
  outputs: string[],
  opts: { receiver: string; slippage?: number; enableAggregator?: boolean },
): Promise<MultiRouteConvertResponse> {
  const enableAggregator = opts.enableAggregator ?? true;
  return pendleApi.sdk.convertV3(chainId, {
    slippage: opts.slippage ?? SLIPPAGE_DEFAULT,
    enableAggregator,
    aggregators: enableAggregator ? DEFAULT_AGGREGATORS : undefined,
    inputs,
    outputs,
    // Always include receiver — critical for MCP to ensure funds go to the right address.
    receiver: opts.receiver,
  });
}

async function formatResult(raw: MultiRouteConvertResponse, chainId: number) {
  const route = raw.routes[0];
  if (!route) {
    throw new Error(
      'Convert API returned no routes — the token pair may not be supported or liquidity is insufficient.',
    );
  }
  const rawApprovals = raw.requiredApprovals ?? [];
  const rawOutputs = route.outputs.map((o) => ({ token: o.token, amount: o.amount }));
  const rawApprovalEntries = rawApprovals.map((a) => ({
    token: a.token,
    amount: a.amount,
    spender: route.tx.to,
    instruction: `Approve ${a.token} for ${a.amount} to spender ${route.tx.to}`,
  }));

  // Enrich outputs and approvals with symbol/decimals/humanAmount (best-effort)
  const [outputs, approvals] = await Promise.all([
    enrichOutputs(chainId, rawOutputs),
    enrichApprovals(chainId, rawApprovalEntries),
  ]);

  return {
    action: raw.action,
    outputs,
    priceImpact: route.data.priceImpact,
    transaction: {
      to: route.tx.to,
      data: route.tx.data,
      value: route.tx.value,
    },
    approvals,
    // requiredApprovals doesn't lie — if empty, allowance IS sufficient. Don't auto-approve.
    note:
      rawApprovals.length === 0
        ? 'No approvals needed — on-chain allowance is already sufficient.'
        : undefined,
  };
}

/**
 * Resolve the effective amount in wei.
 * If `amount` (wei string) is provided, use it directly.
 * If `humanAmount` is provided instead, convert to wei using token decimals.
 * Exactly one of `amount` or `humanAmount` must be provided.
 */
export async function resolveAmount(
  chainId: number,
  tokenAddress: string,
  amount: string | undefined,
  humanAmount: number | undefined,
): Promise<string> {
  if (amount && humanAmount != null) {
    throw new Error('Provide either amount (wei) or humanAmount, not both.');
  }
  if (amount) return amount;
  if (humanAmount == null) throw new Error('Either amount (wei) or humanAmount must be provided.');

  const decimals = await getTokenDecimals(chainId, tokenAddress);
  // Convert human amount to wei: multiply by 10^decimals
  // Use string math to avoid float precision issues
  const parts = humanAmount.toString().split('.');
  const whole = parts[0];
  const frac = (parts[1] ?? '').padEnd(decimals, '0').slice(0, decimals);
  const wei = BigInt(whole + frac);
  return wei.toString();
}

const SLIPPAGE_DESC = `Slippage tolerance (default ${SLIPPAGE_DEFAULT}; auto-widens to ${SLIPPAGE_SMALL_TRADE} for trades < $${SMALL_TRADE_USD} or when price is unavailable)`;

// ── Tool registration ───────────────────────────────────────────────────────

export function registerActionTools(server: McpServer) {
  // 1. buy_pt
  server.registerTool(
    'buy_pt',
    {
      description:
        "Buy PT (Principal Token) to lock in a fixed yield. Swaps your input token into the market's PT. Only available before market maturity.",
      inputSchema: {
        chainId: z.number().describe(CHAIN_ID_DESC),
        market: z.string().describe('Market address'),
        tokenIn: z.string().describe('Input token address'),
        amount: z.string().optional().describe('Input amount in wei (provide this OR humanAmount)'),
        humanAmount: z
          .number()
          .optional()
          .describe(
            'Input amount in human units, e.g. 100.5 for 100.5 USDC (provide this OR amount)',
          ),
        receiver: z.string().describe('Receiver wallet address'),
        slippage: z.number().optional().describe(SLIPPAGE_DESC),
      },
    },
    async (args) => {
      try {
        const amountWei = await resolveAmount(
          args.chainId,
          args.tokenIn,
          args.amount,
          args.humanAmount,
        );
        const identity = await getMarketIdentity(args.chainId, args.market);
        if (isPostMaturity(identity)) {
          return structuredErrorContent(
            new Error(
              `Cannot buy PT post-maturity — market ${args.market} expired at ${identity.expiry}. ` +
                `PT already trades at 1:1 with underlying. Use sell_pt to redeem your existing PT instead.`,
            ),
          );
        }
        const slippage = await resolveSlippage(
          args.slippage,
          args.chainId,
          args.tokenIn,
          amountWei,
        );
        const raw = await callConvert(
          args.chainId,
          [{ token: args.tokenIn, amount: amountWei }],
          [identity.pt],
          { receiver: args.receiver, slippage },
        );
        return jsonResult(await formatResult(raw, args.chainId));
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 2. sell_pt
  server.registerTool(
    'sell_pt',
    {
      description:
        'Sell PT back to a token. Use to exit a fixed yield position early, or redeem at/after maturity.',
      inputSchema: {
        chainId: z.number().describe('Chain ID'),
        market: z.string().describe('Market address'),
        tokenOut: z.string().describe('Output token address'),
        amount: z.string().optional().describe('PT amount in wei (provide this OR humanAmount)'),
        humanAmount: z
          .number()
          .optional()
          .describe('PT amount in human units (provide this OR amount)'),
        receiver: z.string().describe('Receiver wallet address'),
        slippage: z.number().optional().describe(SLIPPAGE_DESC),
      },
    },
    async (args) => {
      try {
        const { pt } = await getMarketIdentity(args.chainId, args.market);
        const amountWei = await resolveAmount(args.chainId, pt, args.amount, args.humanAmount);
        const slippage = await resolveSlippage(args.slippage, args.chainId, pt, amountWei);
        const raw = await callConvert(
          args.chainId,
          [{ token: pt, amount: amountWei }],
          [args.tokenOut],
          { receiver: args.receiver, slippage },
        );
        return jsonResult(await formatResult(raw, args.chainId));
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 3. buy_yt
  server.registerTool(
    'buy_yt',
    {
      description:
        'Buy YT (Yield Token) for leveraged variable yield exposure. Profitable when underlying APY stays above implied APY. Only available before market maturity.',
      inputSchema: {
        chainId: z.number().describe('Chain ID'),
        market: z.string().describe('Market address'),
        tokenIn: z.string().describe('Input token address'),
        amount: z.string().optional().describe('Input amount in wei (provide this OR humanAmount)'),
        humanAmount: z
          .number()
          .optional()
          .describe('Input amount in human units (provide this OR amount)'),
        receiver: z.string().describe('Receiver wallet address'),
        slippage: z.number().optional().describe(SLIPPAGE_DESC),
      },
    },
    async (args) => {
      try {
        const amountWei = await resolveAmount(
          args.chainId,
          args.tokenIn,
          args.amount,
          args.humanAmount,
        );
        const identity = await getMarketIdentity(args.chainId, args.market);
        if (isPostMaturity(identity)) {
          return structuredErrorContent(
            new Error(
              `Cannot buy YT post-maturity — YT is worthless after expiry. Market ${args.market} expired at ${identity.expiry}.`,
            ),
          );
        }
        const slippage = await resolveSlippage(
          args.slippage,
          args.chainId,
          args.tokenIn,
          amountWei,
        );
        const raw = await callConvert(
          args.chainId,
          [{ token: args.tokenIn, amount: amountWei }],
          [identity.yt],
          { receiver: args.receiver, slippage },
        );
        return jsonResult(await formatResult(raw, args.chainId));
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 4. sell_yt
  server.registerTool(
    'sell_yt',
    {
      description: 'Sell YT back to a token. YT decays to zero at maturity — exit before expiry.',
      inputSchema: {
        chainId: z.number().describe('Chain ID'),
        market: z.string().describe('Market address'),
        tokenOut: z.string().describe('Output token address'),
        amount: z.string().optional().describe('YT amount in wei (provide this OR humanAmount)'),
        humanAmount: z
          .number()
          .optional()
          .describe('YT amount in human units (provide this OR amount)'),
        receiver: z.string().describe('Receiver wallet address'),
        slippage: z.number().optional().describe(SLIPPAGE_DESC),
      },
    },
    async (args) => {
      try {
        const identity = await getMarketIdentity(args.chainId, args.market);
        if (isPostMaturity(identity)) {
          return structuredErrorContent(
            new Error(
              `Cannot sell YT post-maturity — YT is worthless ($0) after expiry. Market ${args.market} expired at ${identity.expiry}. ` +
                `There is nothing to sell. Use redeem-py with PT to recover your underlying.`,
            ),
          );
        }
        const amountWei = await resolveAmount(
          args.chainId,
          identity.yt,
          args.amount,
          args.humanAmount,
        );
        const slippage = await resolveSlippage(args.slippage, args.chainId, identity.yt, amountWei);
        const raw = await callConvert(
          args.chainId,
          [{ token: identity.yt, amount: amountWei }],
          [args.tokenOut],
          { receiver: args.receiver, slippage },
        );
        return jsonResult(await formatResult(raw, args.chainId));
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 5. add_liquidity
  server.registerTool(
    'add_liquidity',
    {
      description:
        "Add liquidity to a Pendle market. Returns LP tokens. Mode: 'single' (default, one token zap-in), 'zpi' (keep YT exposure).",
      inputSchema: {
        chainId: z.number().describe('Chain ID'),
        market: z.string().describe('Market address'),
        tokenIn: z.string().describe('Input token address'),
        amount: z.string().optional().describe('Input amount in wei (provide this OR humanAmount)'),
        humanAmount: z
          .number()
          .optional()
          .describe('Input amount in human units (provide this OR amount)'),
        receiver: z.string().describe('Receiver wallet address'),
        slippage: z.number().optional().describe(SLIPPAGE_DESC),
        mode: z
          .enum(['single', 'zpi'])
          .optional()
          .default('single')
          .describe("Liquidity mode: 'single' (default) or 'zpi' (keep YT exposure)."),
      },
    },
    async (args) => {
      try {
        const mode = args.mode ?? 'single';
        const amountWei = await resolveAmount(
          args.chainId,
          args.tokenIn,
          args.amount,
          args.humanAmount,
        );

        const identity = await getMarketIdentity(args.chainId, args.market);
        if (isPostMaturity(identity)) {
          return structuredErrorContent(
            new Error(
              `Cannot add liquidity post-maturity — market ${args.market} expired at ${identity.expiry}. ` +
                `The pool no longer generates swap fees. Use remove_liquidity to exit, then redeem-py to recover underlying.`,
            ),
          );
        }
        const slippage = await resolveSlippage(
          args.slippage,
          args.chainId,
          args.tokenIn,
          amountWei,
        );

        let inputs: TokenAmountDto[];
        let outputs: string[];

        switch (mode) {
          case 'single':
            inputs = [{ token: args.tokenIn, amount: amountWei }];
            outputs = [args.market];
            break;
          case 'zpi':
            inputs = [{ token: args.tokenIn, amount: amountWei }];
            outputs = [args.market, identity.yt];
            break;
        }

        const raw = await callConvert(args.chainId, inputs, outputs, {
          receiver: args.receiver,
          slippage,
        });
        return jsonResult(await formatResult(raw, args.chainId));
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 6. remove_liquidity
  server.registerTool(
    'remove_liquidity',
    {
      description:
        'Remove liquidity from a Pendle market. Burns LP tokens and returns your chosen token.',
      inputSchema: {
        chainId: z.number().describe('Chain ID'),
        market: z.string().describe('Market address (also the LP token address)'),
        tokenOut: z.string().describe('Output token address'),
        amount: z.string().optional().describe('LP amount in wei (provide this OR humanAmount)'),
        humanAmount: z
          .number()
          .optional()
          .describe('LP amount in human units (provide this OR amount)'),
        receiver: z.string().describe('Receiver wallet address'),
        slippage: z.number().optional().describe(SLIPPAGE_DESC),
      },
    },
    async (args) => {
      try {
        const amountWei = await resolveAmount(
          args.chainId,
          args.market,
          args.amount,
          args.humanAmount,
        );
        const slippage = await resolveSlippage(args.slippage, args.chainId, args.market, amountWei);
        const raw = await callConvert(
          args.chainId,
          [{ token: args.market, amount: amountWei }],
          [args.tokenOut],
          { receiver: args.receiver, slippage },
        );
        return jsonResult(await formatResult(raw, args.chainId));
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 7. mint_redeem
  server.registerTool(
    'mint_redeem',
    {
      description: [
        'Mint or redeem Pendle tokens.',
        "Actions: 'mint-sy' (wrap to SY, available anytime), 'redeem-sy' (unwrap SY, available anytime),",
        "'mint-py' (split into PT+YT, only before maturity), 'redeem-py' (burn PT+YT to underlying — post-maturity only PT is required, YT is worthless).",
      ].join(' '),
      inputSchema: {
        chainId: z.number().describe('Chain ID'),
        market: z.string().describe('Market address (used to resolve PT/YT/SY addresses)'),
        action: z
          .enum(['mint-sy', 'redeem-sy', 'mint-py', 'redeem-py'])
          .describe('Mint/redeem action'),
        token: z.string().describe('Token address: input token for mint, output token for redeem'),
        amount: z.string().optional().describe('Amount in wei (provide this OR humanAmount)'),
        humanAmount: z
          .number()
          .optional()
          .describe('Amount in human units (provide this OR amount)'),
        receiver: z.string().describe('Receiver wallet address'),
        slippage: z.number().optional().describe(SLIPPAGE_DESC),
      },
    },
    async (args) => {
      try {
        const identity = await getMarketIdentity(args.chainId, args.market);

        // Resolve the amount token: for mint actions it's the user-specified token,
        // for redeem actions it depends on action type
        const amountToken =
          args.action === 'mint-sy' || args.action === 'mint-py'
            ? args.token
            : args.action === 'redeem-sy'
              ? identity.sy
              : identity.pt; // redeem-py: PT is the amount token
        const amountWei = await resolveAmount(
          args.chainId,
          amountToken,
          args.amount,
          args.humanAmount,
        );

        // Determine the slippage based on total input value.
        // For redeem-py pre-maturity, both PT and YT are inputs — sum their USD values.
        let slippage: number;
        if (args.action === 'redeem-py' && !isPostMaturity(identity)) {
          slippage = await resolveSlippageMulti(args.slippage, args.chainId, [
            { address: identity.pt, amountWei },
            { address: identity.yt, amountWei },
          ]);
        } else {
          slippage = await resolveSlippage(args.slippage, args.chainId, amountToken, amountWei);
        }

        let inputs: TokenAmountDto[];
        let outputs: string[];

        switch (args.action) {
          case 'mint-sy':
            // Available at all times — wraps a token into SY
            inputs = [{ token: args.token, amount: amountWei }];
            outputs = [identity.sy];
            break;
          case 'redeem-sy':
            // Available at all times — unwraps SY to a token
            inputs = [{ token: identity.sy, amount: amountWei }];
            outputs = [args.token];
            break;
          case 'mint-py':
            // Only available BEFORE maturity — splits into PT + YT
            if (isPostMaturity(identity)) {
              return structuredErrorContent(
                new Error(
                  `mint-py is not available post-maturity. Market ${args.market} expired at ${identity.expiry}.`,
                ),
              );
            }
            inputs = [{ token: args.token, amount: amountWei }];
            outputs = [identity.pt, identity.yt];
            break;
          case 'redeem-py':
            // Post-maturity: only PT is required (YT is worthless at $0).
            // Pre-maturity: both PT and YT are required in equal amounts.
            if (isPostMaturity(identity)) {
              inputs = [{ token: identity.pt, amount: amountWei }];
            } else {
              inputs = [
                { token: identity.pt, amount: amountWei },
                { token: identity.yt, amount: amountWei },
              ];
            }
            outputs = [args.token];
            break;
        }

        const raw = await callConvert(args.chainId, inputs, outputs, {
          receiver: args.receiver,
          slippage,
        });
        return jsonResult(await formatResult(raw, args.chainId));
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 8. pendle_swap (arbitrary ERC20-to-ERC20 via Pendle aggregator)
  server.registerTool(
    'pendle_swap',
    {
      description:
        "Swap standard ERC-20 tokens (e.g. USDC to WETH) via Pendle's aggregator. Does NOT handle PT, YT, SY, or LP tokens — use buy_pt/sell_pt/buy_yt/sell_yt/add_liquidity/remove_liquidity/mint_redeem for those. No market address required.",
      inputSchema: {
        chainId: z.number().describe(CHAIN_ID_DESC),
        tokenIn: z.string().describe('Input token address'),
        tokenOut: z.string().describe('Output token address'),
        amount: z.string().optional().describe('Input amount in wei (provide this OR humanAmount)'),
        humanAmount: z
          .number()
          .optional()
          .describe(
            'Input amount in human units, e.g. 100.5 for 100.5 USDC (provide this OR amount)',
          ),
        receiver: z.string().describe('Receiver wallet address'),
        slippage: z.number().optional().describe(SLIPPAGE_DESC),
      },
    },
    async (args) => {
      try {
        const amountWei = await resolveAmount(
          args.chainId,
          args.tokenIn,
          args.amount,
          args.humanAmount,
        );
        const slippage = await resolveSlippage(
          args.slippage,
          args.chainId,
          args.tokenIn,
          amountWei,
        );
        const raw = await callConvert(
          args.chainId,
          [{ token: args.tokenIn, amount: amountWei }],
          [args.tokenOut],
          { receiver: args.receiver, slippage },
        );
        return jsonResult(await formatResult(raw, args.chainId));
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 9. claim_rewards
  server.registerTool(
    'claim_rewards',
    {
      description:
        'Claim accrued PENDLE emissions (from LP), YT interest, and SY yield. No token approval needed.',
      inputSchema: {
        chainId: z.number().describe('Chain ID'),
        receiver: z.string().describe('Wallet address that owns the positions'),
        markets: z
          .string()
          .optional()
          .describe('Comma-separated LP/market addresses for PENDLE emissions'),
        yts: z.string().optional().describe('Comma-separated YT addresses for accrued interest'),
        sys: z.string().optional().describe('Comma-separated SY addresses for yield redemption'),
      },
    },
    async (args) => {
      try {
        if (!args.markets && !args.yts && !args.sys) {
          return structuredErrorContent(
            new Error(
              'At least one of markets, yts, or sys must be provided. ' +
                'Use get_portfolio to find your claimable positions first.',
            ),
          );
        }

        const result = await pendleApi.sdk.redeemInterestsAndRewards(args.chainId, {
          receiver: args.receiver,
          sys: args.sys,
          yts: args.yts,
          markets: args.markets,
        });
        return jsonResult({
          ...result,
          note: 'No ERC-20 approval needed. Transaction will succeed even if no rewards are pending.',
        });
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  console.error('Registered 9 semantic action tools');
}
