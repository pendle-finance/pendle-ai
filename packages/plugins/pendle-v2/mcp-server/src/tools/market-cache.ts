import { pendleApi } from '../api-client.js';

// ── Types ───────────────────────────────────────────────────────────────────

/** PT/YT/SY addresses + expiry — immutable for a given market, cached indefinitely. */
export interface MarketIdentity {
  pt: string;
  yt: string;
  sy: string;
  /** ISO 8601 expiry date string (e.g. "2025-06-26T00:00:00.000Z"). */
  expiry: string;
}

// ── Caches ──────────────────────────────────────────────────────────────────

/** PT/YT/SY are deterministic from the market contract — never change. No TTL needed. */
const identityCache = new Map<string, MarketIdentity>();

/** In-flight identity fetch promises for deduplication. */
const identityInFlight = new Map<string, Promise<MarketIdentity>>();

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Extract the address part from a "chainId-address" string, or return as-is. */
export function extractAddress(raw: string): string {
  const idx = raw.indexOf('-');
  return idx !== -1 ? raw.slice(idx + 1) : raw;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Resolve market → PT/YT/SY addresses + expiry.
 * These are immutable for a given market contract, so cached indefinitely (no TTL).
 * Makes 1 API call on first access, then serves from memory forever.
 */
export async function getMarketIdentity(chainId: number, market: string): Promise<MarketIdentity> {
  const key = `${chainId}-${market.toLowerCase()}`;
  const cached = identityCache.get(key);
  if (cached) return cached;

  // Deduplicate concurrent requests for the same market
  const inFlight = identityInFlight.get(key);
  if (inFlight) return inFlight;

  const promise = (async () => {
    const res = await pendleApi.markets.getAllMarketsV2({
      ids: `${chainId}-${market}`,
    });

    const info = res.results[0];
    if (!info) {
      throw new Error(`Market ${market} not found on chain ${chainId}`);
    }

    const result: MarketIdentity = {
      pt: extractAddress(info.pt),
      yt: extractAddress(info.yt),
      sy: extractAddress(info.sy),
      expiry: info.expiry,
    };

    identityCache.set(key, result);
    return result;
  })();

  identityInFlight.set(key, promise);
  try {
    return await promise;
  } finally {
    identityInFlight.delete(key);
  }
}

/**
 * Check if a market has passed its maturity date.
 */
export function isPostMaturity(identity: MarketIdentity): boolean {
  return new Date(identity.expiry).getTime() <= Date.now();
}
