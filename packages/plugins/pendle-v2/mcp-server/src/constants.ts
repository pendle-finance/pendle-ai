// ── Slippage ────────────────────────────────────────────────────────────────
// All action tools default to SLIPPAGE_DEFAULT (0.1%).
// For small trades (< SMALL_TRADE_USD), wider slippage is used to avoid
// rounding failures. If price lookup fails, falls back to SLIPPAGE_SMALL_TRADE (0.5%).
// Override per-call via the `slippage` tool parameter.

/** Default slippage for all action tools. */
export const SLIPPAGE_DEFAULT = 0.001; // 0.1%

/** Wider slippage for small trades (input value < SMALL_TRADE_USD). */
export const SLIPPAGE_SMALL_TRADE = 0.005; // 0.5%

/** USD threshold below which SLIPPAGE_SMALL_TRADE applies. */
export const SMALL_TRADE_USD = 100;

// ── Aggregators ─────────────────────────────────────────────────────────────
// Comma-separated list of aggregator names passed to the Convert API.
// Fewer aggregators = lower CU cost (each aggregator adds 5-15 CU).
// Supported: kyberswap, odos, okx, paraswap
// Override via PENDLE_AGGREGATORS env var (e.g. "kyberswap,odos").

export const DEFAULT_AGGREGATORS = (process.env.PENDLE_AGGREGATORS ?? 'kyberswap')
  .split(',')
  .map((s) => s.trim());

// ── API Key ─────────────────────────────────────────────────────────────────
// Pendle API key for higher CU tiers. Set via PENDLE_API_KEY env var.
// Free tier: 100 CU/min, 200,000 CU/week.
// Paid tiers: $10/week = 500 CU/min + 1,000,000 CU/week (stackable).
// Get a key at: https://api-v2.pendle.finance/dashboard

export const PENDLE_API_KEY = process.env.PENDLE_API_KEY ?? '';

// ── Price Impact Thresholds ─────────────────────────────────────────────────
// Used by preview_trade to add warnings about high price impact.

/** Price impact above this triggers a high-impact warning. */
export const PRICE_IMPACT_HIGH = 0.03; // 3%

/** Price impact above this triggers a moderate-impact note. */
export const PRICE_IMPACT_WARN = 0.01; // 1%

/** Trades above this USD value get a large-trade slippage reminder. */
export const LARGE_TRADE_USD = 10_000;

// ── Supported Chains ────────────────────────────────────────────────────────
// All chains where Pendle has deployed markets.
// Used in tool descriptions so the AI agent knows valid chain IDs.

export const SUPPORTED_CHAINS: Record<number, string> = {
  1: 'Ethereum',
  42161: 'Arbitrum',
  10: 'Optimism',
  56: 'BNB Chain',
  8453: 'Base',
  5000: 'Mantle',
  // Add new chains here as Pendle deploys to them
};

/** Human-readable chain list for tool descriptions. */
export const CHAIN_ID_DESC =
  'Chain ID: ' +
  Object.entries(SUPPORTED_CHAINS)
    .map(([id, name]) => `${id}=${name}`)
    .join(', ');

// ── Retry Timing ────────────────────────────────────────────────────────────

export const RETRY_BUFFER_MS = 500;
export const RETRY_FALLBACK_MS = 60_000;
export const RETRY_MAX_WAIT_MS = 90_000;
