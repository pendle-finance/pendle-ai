import {
  PENDLE_API_KEY,
  RETRY_BUFFER_MS,
  RETRY_FALLBACK_MS,
  RETRY_MAX_WAIT_MS,
} from './constants.js';
import { PendleApi } from './openapi/api.js';

// ── CU budget tracking ──────────────────────────────────────────────────────
// Pendle uses Computing Units (CU) for rate limiting.
// Free tier: 100 CU/min, 200,000 CU/week.
// Paid tiers: $10/week = +500 CU/min + 1,000,000 CU/week (stackable up to $40/week).
// Upgrade at: https://api-v2.pendle.finance/dashboard
// Every response includes headers telling us our remaining budget.

interface RateLimitInfo {
  /** CU cost of the most recent request */
  lastRequestCU: number;
  /** CU remaining in the current minute window */
  minuteRemaining: number;
  /** CU limit per minute */
  minuteLimit: number;
  /** Unix timestamp (seconds) when the minute window resets */
  minuteReset: number;
  /** CU remaining in the current week window */
  weeklyRemaining: number;
  /** CU limit per week */
  weeklyLimit: number;
  /** Unix timestamp (seconds) when the weekly window resets */
  weeklyReset: number;
}

/** Latest rate limit info from the most recent API response. */
let _rateLimitInfo: RateLimitInfo | null = null;

/** Get the latest rate limit info (null if no API calls have been made yet). */
export function getRateLimitInfo(): RateLimitInfo | null {
  return _rateLimitInfo;
}

function updateRateLimitInfo(headers: Headers): void {
  const cu = headers.get('x-computing-unit');
  const minuteRemaining = headers.get('x-ratelimit-remaining');
  const minuteLimit = headers.get('x-ratelimit-limit');
  const minuteReset = headers.get('x-ratelimit-reset');
  const weeklyRemaining = headers.get('x-ratelimit-weekly-remaining');
  const weeklyLimit = headers.get('x-ratelimit-weekly-limit');
  const weeklyReset = headers.get('x-ratelimit-weekly-reset');

  // Only update if headers are present (some error responses may not include them)
  if (minuteRemaining != null) {
    _rateLimitInfo = {
      lastRequestCU: cu ? parseInt(cu, 10) : 0,
      minuteRemaining: parseInt(minuteRemaining, 10),
      minuteLimit: minuteLimit ? parseInt(minuteLimit, 10) : 100,
      minuteReset: minuteReset ? parseInt(minuteReset, 10) : 0,
      weeklyRemaining: weeklyRemaining ? parseInt(weeklyRemaining, 10) : 0,
      weeklyLimit: weeklyLimit ? parseInt(weeklyLimit, 10) : 200_000,
      weeklyReset: weeklyReset ? parseInt(weeklyReset, 10) : 0,
    };
  }
}

// ── Fetch with rate-limit-aware retry ───────────────────────────────────────

/**
 * Fetch with CU-aware retry on 429.
 *
 * On 429:
 *   - Reads X-RateLimit-Reset to know exactly when the minute window resets.
 *   - If it's a minute limit: waits until reset (typically <60s), then retries once.
 *   - If weekly budget is exhausted (weekly remaining = 0): does NOT retry.
 *   - Falls back to Retry-After header if X-RateLimit-Reset is missing.
 */
export async function fetchWithRetry(
  url: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(url, init);
  updateRateLimitInfo(res.headers);

  if (res.status !== 429) return res;

  // Parse rate limit headers from the 429 response
  const weeklyRemaining = res.headers.get('x-ratelimit-weekly-remaining');
  if (weeklyRemaining != null && parseInt(weeklyRemaining, 10) <= 0) {
    // Weekly budget exhausted — retrying won't help
    const weeklyReset = res.headers.get('x-ratelimit-weekly-reset');
    const resetDate = weeklyReset
      ? new Date(parseInt(weeklyReset, 10) * 1000).toISOString()
      : 'unknown';
    console.error(
      `[pendle-mcp-v2] 429 — weekly CU budget exhausted. Resets at ${resetDate}. Not retrying.`,
    );
    return res;
  }

  // Minute limit hit — wait until the reset timestamp
  const resetHeader = res.headers.get('x-ratelimit-reset');
  const retryAfterHeader = res.headers.get('Retry-After');

  let waitMs: number;
  if (resetHeader) {
    const resetEpoch = parseInt(resetHeader, 10);
    waitMs = Math.max(0, resetEpoch * 1000 - Date.now()) + RETRY_BUFFER_MS;
  } else if (retryAfterHeader) {
    const parsed = parseInt(retryAfterHeader, 10);
    // Retry-After can be seconds (integer) or HTTP-date string — handle both
    waitMs = Number.isNaN(parsed)
      ? Math.max(0, new Date(retryAfterHeader).getTime() - Date.now()) + RETRY_BUFFER_MS
      : parsed * 1000;
  } else {
    // No headers — conservative 60s wait (full minute window)
    waitMs = RETRY_FALLBACK_MS;
  }

  // Cap wait — if somehow we'd wait longer, just fail
  if (waitMs > RETRY_MAX_WAIT_MS) {
    console.error(
      `[pendle-mcp-v2] 429 — would need to wait ${Math.round(waitMs / 1000)}s, too long. Not retrying.`,
    );
    return res;
  }

  console.error(
    `[pendle-mcp-v2] 429 — minute CU limit hit. Waiting ${Math.round(waitMs / 1000)}s until reset...`,
  );
  await new Promise((r) => setTimeout(r, waitMs));

  // Single retry after waiting for reset
  // Single retry after waiting for reset — use string URL to keep consistent with first attempt
  const retryRes = await fetch(url, init);
  updateRateLimitInfo(retryRes.headers);
  return retryRes;
}

// ── PendleApi singleton ──────────────────────────────────────────────────────

/**
 * Fully-typed Pendle API client generated from the OpenAPI spec.
 * All requests go through `fetchWithRetry` for CU-aware rate limit handling.
 * Auth header is injected via `baseApiParams` when PENDLE_API_KEY is set.
 *
 * Re-generate the client after API spec updates:
 *   npm run generate:api
 */
export const pendleApi = new PendleApi({
  customFetch: fetchWithRetry,
  baseApiParams: {
    headers: PENDLE_API_KEY ? { Authorization: `Bearer ${PENDLE_API_KEY}` } : {},
  },
});

// ── Utilities ────────────────────────────────────────────────────────────────

/** Return JSON as a pretty-printed text content block */
export function jsonResult(data: unknown): { content: Array<{ type: 'text'; text: string }> } {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}
