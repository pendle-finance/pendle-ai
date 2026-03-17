import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { hashTypedData } from 'viem';
import { z } from 'zod';
import { jsonResult, pendleApi } from '../api-client.js';
import { CHAIN_ID_DESC } from '../constants.js';
import { structuredErrorContent } from '../errors.js';
import type { GenerateLimitOrderDataResponse } from '../openapi/api.js';
import { getMarketIdentity } from './market-cache.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const ORDER_TYPE_MAP: Record<string, number> = {
  TOKEN_FOR_PT: 0,
  PT_FOR_TOKEN: 1,
  TOKEN_FOR_YT: 2,
  YT_FOR_TOKEN: 3,
};

/**
 * Pendle Limit Router address — same CREATE2 address on all chains.
 * Used as EIP-712 verifyingContract in the Limit Order domain.
 */
const LIMIT_ROUTER = '0x000000000000c9B3E2C3Ec88B1B4c0cD853f4321' as const;

/** EIP-712 domain for Pendle Limit Order Protocol */
function limitOrderDomain(chainId: number) {
  return {
    name: 'Pendle Limit Order Protocol',
    version: '1',
    chainId,
    verifyingContract: LIMIT_ROUTER,
  } as const;
}

/** EIP-712 types for Pendle limit orders */
const LIMIT_ORDER_TYPES = {
  Order: [
    { name: 'salt', type: 'uint256' },
    { name: 'expiry', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'orderType', type: 'uint8' },
    { name: 'token', type: 'address' },
    { name: 'YT', type: 'address' },
    { name: 'maker', type: 'address' },
    { name: 'receiver', type: 'address' },
    { name: 'makingAmount', type: 'uint256' },
    { name: 'lnImpliedRate', type: 'uint256' },
    { name: 'failSafeRate', type: 'uint256' },
    { name: 'permit', type: 'bytes' },
  ],
} as const;

/** Alias for the generated type returned by the generate-limit-order-data endpoint. */
type RawLimitOrder = GenerateLimitOrderDataResponse;

/**
 * Compute the EIP-712 hash for a Pendle limit order.
 * The API returns a flat order struct — we hash it locally so the caller
 * can sign the hash and then submit.
 */
function hashLimitOrder(order: RawLimitOrder): `0x${string}` {
  return hashTypedData({
    domain: limitOrderDomain(order.chainId),
    types: LIMIT_ORDER_TYPES,
    primaryType: 'Order',
    message: {
      salt: BigInt(order.salt),
      expiry: BigInt(order.expiry),
      nonce: BigInt(order.nonce),
      orderType: order.orderType,
      token: order.token as `0x${string}`,
      YT: order.YT as `0x${string}`,
      maker: order.maker as `0x${string}`,
      receiver: order.receiver as `0x${string}`,
      makingAmount: BigInt(order.makingAmount),
      // lnImpliedRate is a bigint string at runtime despite the spec typing it as number
      lnImpliedRate: BigInt(String(order.lnImpliedRate)),
      failSafeRate: BigInt(order.failSafeRate),
      permit: order.permit as `0x${string}`,
    },
  });
}

function fillCondition(orderType: string, targetApy: number): string {
  const pct = (targetApy * 100).toFixed(2);
  switch (orderType) {
    case 'TOKEN_FOR_PT':
    case 'YT_FOR_TOKEN':
      return `This order fills when implied APY >= ${pct}%`;
    case 'PT_FOR_TOKEN':
    case 'TOKEN_FOR_YT':
      return `This order fills when implied APY <= ${pct}%`;
    default:
      return `This order fills when implied APY reaches ${pct}%`;
  }
}

// ── Registration ─────────────────────────────────────────────────────────────

export function registerLimitOrderTools(server: McpServer) {
  // 1. create_limit_order
  server.registerTool(
    'create_limit_order',
    {
      description:
        "Generate a Pendle limit order. Returns an EIP-712 hash to sign. The order fills when the market's implied APY reaches your target. TOKEN_FOR_XX order types accept the same tokens as the market's tokensIn; XX_FOR_TOKEN order types accept the same tokens as the market's tokensOut. Use get_market to find valid tokens.",
      inputSchema: {
        chainId: z.number().describe(CHAIN_ID_DESC),
        market: z.string().describe('Market address (YT is resolved automatically)'),
        orderType: z
          .enum(['TOKEN_FOR_PT', 'PT_FOR_TOKEN', 'TOKEN_FOR_YT', 'YT_FOR_TOKEN'])
          .describe('TOKEN_FOR_XX accepts market tokensIn; XX_FOR_TOKEN accepts market tokensOut'),
        token: z
          .string()
          .describe(
            'Token address — must be a valid tokensIn (for TOKEN_FOR_XX) or tokensOut (for XX_FOR_TOKEN) of the market',
          ),
        maker: z.string().describe('Maker wallet address'),
        amount: z.string().describe('Making amount in wei'),
        targetApy: z.number().describe('Target implied APY as decimal (0.09 = 9%)'),
        expiry: z.string().describe('Order expiry as Unix timestamp in seconds'),
      },
    },
    async (args) => {
      try {
        const { yt } = await getMarketIdentity(args.chainId, args.market);
        const typeNum = ORDER_TYPE_MAP[args.orderType];

        // The API returns a flat order struct (not {hash, order}).
        // We compute the EIP-712 hash locally from the flat struct.
        const order = await pendleApi.limitOrders.generateLimitOrderData({
          chainId: args.chainId,
          YT: yt,
          orderType: typeNum as 0 | 1 | 2 | 3,
          token: args.token,
          maker: args.maker,
          makingAmount: args.amount,
          impliedApy: args.targetApy,
          expiry: args.expiry,
        });

        const hash = hashLimitOrder(order);

        return jsonResult({
          hash,
          order,
          instructions: {
            step1: 'Sign the hash above with your wallet (e.g. account.sign({ hash }))',
            step2: 'Call submit_limit_order with the signature + all order fields from above',
          },
          fillCondition: fillCondition(args.orderType, args.targetApy),
        });
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 2. submit_limit_order
  server.registerTool(
    'submit_limit_order',
    {
      description:
        'Submit a signed limit order to the Pendle order book. Call after create_limit_order and signing the hash.',
      inputSchema: {
        chainId: z.number().describe('Chain ID'),
        signature: z.string().describe('EIP-712 signature of the order hash'),
        salt: z.string().describe('Order salt from create_limit_order'),
        expiry: z.string().describe('Order expiry from create_limit_order'),
        nonce: z.string().describe('Order nonce from create_limit_order'),
        orderType: z
          .number()
          .describe('Order type (0-3) — matches create_limit_order output field'),
        token: z.string().describe('Token address'),
        YT: z.string().describe('YT address — matches create_limit_order output field'),
        maker: z.string().describe('Maker wallet address'),
        receiver: z.string().describe('Receiver wallet address'),
        makingAmount: z.string().describe('Making amount in wei'),
        lnImpliedRate: z.string().describe('ln(implied rate) from create_limit_order'),
        failSafeRate: z.string().describe('Fail-safe rate from create_limit_order'),
        permit: z.string().describe('Permit data from create_limit_order'),
      },
    },
    async (args) => {
      try {
        const data = await pendleApi.limitOrders.createOrder({
          chainId: args.chainId,
          signature: args.signature,
          salt: args.salt,
          expiry: args.expiry,
          nonce: args.nonce,
          type: args.orderType as 0 | 1 | 2 | 3,
          token: args.token,
          yt: args.YT,
          maker: args.maker,
          receiver: args.receiver,
          makingAmount: args.makingAmount,
          lnImpliedRate: args.lnImpliedRate,
          failSafeRate: args.failSafeRate,
          permit: args.permit,
        });
        return jsonResult(data);
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 3. get_my_orders
  server.registerTool(
    'get_my_orders',
    {
      description:
        'Get all active limit orders for a specific maker wallet. Returns order details including type, token, amount, expiry, and fill status.',
      inputSchema: {
        chainId: z.number().describe('Chain ID'),
        maker: z.string().describe('Maker wallet address'),
      },
    },
    async (args) => {
      try {
        const data = await pendleApi.limitOrders.getMakerLimitOrder({
          chainId: args.chainId,
          maker: args.maker,
          isActive: true,
          limit: 100,
        });
        return jsonResult(data);
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  // 4. cancel_limit_orders
  server.registerTool(
    'cancel_limit_orders',
    {
      description:
        'Cancel ALL Pendle limit orders for a maker. Returns an on-chain transaction that costs gas — the user must sign and submit it. Single-order cancellation is not supported — cancel all and re-create the ones you want to keep.',
      inputSchema: {
        chainId: z.number().describe('Chain ID'),
        maker: z.string().describe('Maker wallet address'),
      },
    },
    async (args) => {
      try {
        const data = await pendleApi.sdk.cancelAllLimitOrders(args.chainId, {
          userAddress: args.maker,
        });
        return jsonResult({
          ...(data as unknown as Record<string, unknown>),
          note: 'This is an on-chain transaction that costs gas. The user must sign and submit it to cancel orders.',
        });
      } catch (err) {
        return structuredErrorContent(err);
      }
    },
  );

  console.error('Registered 5 semantic limit order tools');
}
