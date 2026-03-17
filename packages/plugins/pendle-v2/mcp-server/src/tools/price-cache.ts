import { pendleApi } from '../api-client.js';
import { extractAddress } from './market-cache.js';

// ── Asset metadata cache (1-week TTL) ───────────────────────────────────────
// Caches decimals, name, symbol per token from GET /v1/{chainId}/assets/all.
// This chain-scoped endpoint returns BOTH Pendle tokens (PT, YT, SY, LP) AND
// standard ERC-20s (USDC, WETH, etc.) — unlike the cross-chain /v1/assets/all
// which only has Pendle-specific tokens.
// Each asset also includes price.usd, which we use to warm the price cache.
// Costs 1 CU per call.
//
// Note: /v1/{chainId}/assets/all is not in the OpenAPI spec, so we call it via
// pendleApi.request() to route through the same rate-limited fetch.

const ASSET_META_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

interface AssetMeta {
  decimals: number;
  name: string;
  symbol: string;
}

interface AssetMetaCacheEntry {
  /** Map of lowercase address → AssetMeta */
  assets: Map<string, AssetMeta>;
  fetchedAt: number;
}

/** Keyed by chainId */
const assetMetaCache = new Map<number, AssetMetaCacheEntry>();

/** In-flight fetch promises for deduplication (prevents cache stampede). */
const assetMetaInFlight = new Map<number, Promise<AssetMetaCacheEntry>>();

/** Raw asset shape from the chain-scoped /v1/{chainId}/assets/all endpoint. */
interface ChainAsset {
  address: string;
  decimals: number;
  name: string;
  symbol: string;
  price?: { usd?: number };
}

/**
 * Fetch and cache all asset metadata for a chain.
 *
 * Uses the chain-scoped endpoint `/v1/{chainId}/assets/all` which includes:
 * - Pendle tokens (PT, YT, SY, LP) — for market operations
 * - Standard ERC-20s (USDC, WETH, DAI, etc.) — for swap/buy inputs
 * - USD price per token — warms the price cache as a side-effect
 *
 * Throws on API failure — callers must handle.
 */
async function ensureAssetMeta(chainId: number): Promise<AssetMetaCacheEntry> {
  const existing = assetMetaCache.get(chainId);
  if (existing && Date.now() - existing.fetchedAt < ASSET_META_TTL_MS) {
    return existing;
  }

  // Deduplicate concurrent requests for the same chainId
  const inFlight = assetMetaInFlight.get(chainId);
  if (inFlight) return inFlight;

  const promise = (async () => {
    // /v1/{chainId}/assets/all is not in the OpenAPI spec — call via request() directly
    // to route through the same customFetch (rate-limited + auth).
    const data = await pendleApi.request<ChainAsset[] | { assets?: ChainAsset[] }>({
      path: `/v1/${chainId}/assets/all`,
      method: 'GET',
      format: 'json',
    });
    const rawAssets: ChainAsset[] = Array.isArray(data) ? data : (data.assets ?? []);

    const assets = new Map<string, AssetMeta>();
    const prices = new Map<string, number>();

    for (const a of rawAssets) {
      const addr = a.address.toLowerCase();
      assets.set(addr, {
        decimals: a.decimals,
        name: a.name ?? '',
        symbol: a.symbol ?? '',
      });

      // Warm price cache from asset data (price.usd is included in the response)
      if (a.price?.usd != null) {
        prices.set(addr, a.price.usd);
      }
    }

    // Side-effect: seed the price cache so estimateUsdValue() often needs 0 extra API calls.
    // Use a short TTL since these prices may be slightly stale compared to the dedicated price endpoint.
    if (prices.size > 0) {
      const existingPrices = priceCache.get(chainId);
      const isFresh = existingPrices && Date.now() - existingPrices.fetchedAt < PRICE_TTL_MS;
      if (!isFresh) {
        priceCache.set(chainId, { prices, fetchedAt: Date.now() });
      }
    }

    const entry: AssetMetaCacheEntry = { assets, fetchedAt: Date.now() };
    assetMetaCache.set(chainId, entry);
    return entry;
  })();

  assetMetaInFlight.set(chainId, promise);
  try {
    return await promise;
  } finally {
    assetMetaInFlight.delete(chainId);
  }
}

/**
 * Get metadata (symbol, decimals, name) for a token.
 * Returns null if the token is not found (no throw — callers can gracefully degrade).
 */
export async function getTokenMeta(
  chainId: number,
  tokenAddress: string,
): Promise<AssetMeta | null> {
  try {
    const entry = await ensureAssetMeta(chainId);
    return entry.assets.get(tokenAddress.toLowerCase()) ?? null;
  } catch {
    return null;
  }
}

/**
 * Enrich an array of { token, amount } outputs with symbol, decimals, and humanAmount.
 * Best-effort: if metadata lookup fails for a token, raw fields are preserved as-is.
 */
export async function enrichOutputs(
  chainId: number,
  outputs: Array<{ token: string; amount: string }>,
): Promise<
  Array<{ token: string; amount: string; symbol?: string; decimals?: number; humanAmount?: string }>
> {
  const metas = await Promise.all(outputs.map((o) => getTokenMeta(chainId, o.token)));
  return outputs.map((o, i) => {
    const meta = metas[i];
    if (!meta) return o;
    const divisor = 10 ** meta.decimals;
    const human = (Number((BigInt(o.amount) * BigInt(1e6)) / BigInt(divisor)) / 1e6).toString();
    return {
      ...o,
      symbol: meta.symbol,
      decimals: meta.decimals,
      humanAmount: human,
    };
  });
}

/**
 * Enrich a single approval entry with symbol and human-readable amount.
 */
export async function enrichApprovals(
  chainId: number,
  approvals: Array<{ token: string; amount: string; spender: string; instruction: string }>,
): Promise<
  Array<{
    token: string;
    amount: string;
    spender: string;
    instruction: string;
    symbol?: string;
    humanAmount?: string;
  }>
> {
  const metas = await Promise.all(approvals.map((a) => getTokenMeta(chainId, a.token)));
  return approvals.map((a, i) => {
    const meta = metas[i];
    if (!meta) return a;
    const divisor = 10 ** meta.decimals;
    const human = (Number((BigInt(a.amount) * BigInt(1e6)) / BigInt(divisor)) / 1e6).toString();
    return {
      ...a,
      symbol: meta.symbol,
      humanAmount: human,
      instruction: `Approve ${human} ${meta.symbol} (${a.token}) to spender ${a.spender}`,
    };
  });
}

/**
 * Get the decimals for a token.
 * Throws if the API call fails or if the token is not found in the asset list.
 */
export async function getTokenDecimals(chainId: number, tokenAddress: string): Promise<number> {
  const entry = await ensureAssetMeta(chainId);
  const meta = entry.assets.get(tokenAddress.toLowerCase());
  if (meta == null) {
    throw new Error(
      `Token ${tokenAddress} not found in asset metadata for chain ${chainId}. ` +
        `Cannot determine decimals — provide explicit slippage.`,
    );
  }
  return meta.decimals;
}

/**
 * Search asset metadata by symbol or name (case-insensitive substring match).
 *
 * Returns matching tokens with address, symbol, name, and decimals.
 * Costs 0 CU if the asset metadata is already cached, 1 CU on cache miss.
 * Throws if the API call fails.
 */
export async function searchAssets(
  chainId: number,
  query: string,
): Promise<Array<{ address: string; symbol: string; name: string; decimals: number }>> {
  if (query.trim().length < 2) {
    throw new Error('Search query must be at least 2 characters.');
  }
  const entry = await ensureAssetMeta(chainId);
  const q = query.toLowerCase().trim();
  const results: Array<{ address: string; symbol: string; name: string; decimals: number }> = [];

  for (const [address, meta] of entry.assets) {
    if (meta.symbol.toLowerCase().includes(q) || meta.name.toLowerCase().includes(q)) {
      results.push({ address, symbol: meta.symbol, name: meta.name, decimals: meta.decimals });
    }
  }

  // Sort: exact symbol match first, then by symbol length (shorter = more relevant)
  results.sort((a, b) => {
    const aExact = a.symbol.toLowerCase() === q ? 0 : 1;
    const bExact = b.symbol.toLowerCase() === q ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return a.symbol.length - b.symbol.length;
  });

  return results;
}

// ── Price cache (5-minute TTL) ──────────────────────────────────────────────
// Caches USD prices for tokens from GET /v1/prices/assets.
// Prices are per 1 whole token (not per wei).
// Used by action tools to determine if a trade is "small" (< $100 USD)
// so we can apply wider slippage tolerance on small trades.
// Costs 1 CU per call.

const PRICE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface PriceCacheEntry {
  /** Map of lowercase address → USD price per 1 whole token */
  prices: Map<string, number>;
  fetchedAt: number;
}

/** Keyed by chainId */
const priceCache = new Map<number, PriceCacheEntry>();

/** In-flight price fetch promises: keyed by "chainId-address" */
const priceInFlight = new Map<string, Promise<number>>();

/**
 * Get the USD price for a single token.
 * Throws if the API call fails or if the token has no price.
 */
export async function getTokenPriceUsd(chainId: number, tokenAddress: string): Promise<number> {
  const addr = tokenAddress.toLowerCase();

  // Check cache first
  const entry = priceCache.get(chainId);
  if (entry && Date.now() - entry.fetchedAt < PRICE_TTL_MS) {
    const cached = entry.prices.get(addr);
    if (cached != null) return cached;
    // Not in cache — fall through to fetch
  }

  // Deduplicate concurrent requests for the same token
  const dedupKey = `${chainId}-${addr}`;
  const inFlight = priceInFlight.get(dedupKey);
  if (inFlight) return inFlight;

  const promise = (async () => {
    const id = `${chainId}-${tokenAddress}`;
    const data = await pendleApi.assets.getAllAssetPricesByAddressesCrossChains({ ids: id });

    // Merge into existing cache (don't discard other prices).
    // Preserve the original fetchedAt so we don't extend TTL for stale entries.
    const existing = priceCache.get(chainId);
    const isFresh = existing && Date.now() - existing.fetchedAt < PRICE_TTL_MS;
    const prices = isFresh ? existing.prices : new Map<string, number>();

    for (const [key, price] of Object.entries(data.prices)) {
      prices.set(extractAddress(key).toLowerCase(), price);
    }

    priceCache.set(chainId, { prices, fetchedAt: isFresh ? existing.fetchedAt : Date.now() });

    const result = prices.get(addr);
    if (result == null) {
      throw new Error(
        `No USD price available for token ${tokenAddress} on chain ${chainId}. ` +
          `Cannot determine trade value — provide explicit slippage.`,
      );
    }
    return result;
  })();

  priceInFlight.set(dedupKey, promise);
  try {
    return await promise;
  } finally {
    priceInFlight.delete(dedupKey);
  }
}

/**
 * Estimate the USD value of a token amount.
 *
 * 1. Looks up token decimals from the asset metadata cache (1-week TTL).
 * 2. Looks up USD price from the price cache (5-min TTL).
 * 3. Computes: usdValue = (amountWei / 10^decimals) * pricePerToken.
 *
 * Throws if either lookup fails — no silent fallback.
 */
export async function estimateUsdValue(
  chainId: number,
  tokenAddress: string,
  amountWei: string,
): Promise<number> {
  const [decimals, price] = await Promise.all([
    getTokenDecimals(chainId, tokenAddress),
    getTokenPriceUsd(chainId, tokenAddress),
  ]);

  // Use BigInt exponentiation to avoid float precision loss for large amounts
  const divisor = BigInt(10) ** BigInt(decimals);
  const amount = Number((BigInt(amountWei) * BigInt(1e9)) / divisor) / 1e9;
  return amount * price;
}
