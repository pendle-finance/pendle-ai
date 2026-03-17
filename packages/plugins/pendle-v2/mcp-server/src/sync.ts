import type Database from 'better-sqlite3';
import { pendleApi } from './api-client.js';
import { upsertAssets, upsertChains, upsertExternalProtocols, upsertMarkets } from './storage.js';

/**
 * Sync all markets, assets, and chains from Pendle API into SQLite.
 * Fetches all endpoints in parallel and upserts into the database.
 */
async function fetchAllMarkets() {
  const PAGE = 100;
  const first = await pendleApi.markets.getAllMarketsV2({ limit: PAGE, skip: 0 });
  const all = [...first.results];
  const total = first.total;

  const remaining = total - all.length;
  if (remaining > 0) {
    const pages = Math.ceil(remaining / PAGE);
    const rest = await Promise.all(
      Array.from({ length: pages }, (_, i) =>
        pendleApi.markets.getAllMarketsV2({ limit: PAGE, skip: (i + 1) * PAGE }),
      ),
    );
    for (const page of rest) all.push(...page.results);
  }

  return all;
}

export async function syncAll(db: Database.Database): Promise<void> {
  const [markets, assetsRes, chainsRes] = await Promise.all([
    fetchAllMarkets(),
    pendleApi.assets.getPendleAssetsMetadata(),
    pendleApi.chains.getSupportedChainIds(),
  ]);

  upsertMarkets(db, markets);
  upsertExternalProtocols(db, markets);
  upsertAssets(db, assetsRes.assets);
  upsertChains(db, chainsRes.chainIds);

  console.error(
    `[pendle-mcp-v2] Synced ${markets.length} markets, ${assetsRes.assets.length} assets, ${chainsRes.chainIds.length} chains`,
  );
}

/**
 * Start background sync loop that refreshes data every `intervalMs` milliseconds.
 * Returns the interval handle for cleanup.
 */
export function startSyncLoop(
  db: Database.Database,
  intervalMs = 300_000,
): ReturnType<typeof setInterval> {
  return setInterval(async () => {
    try {
      await syncAll(db);
    } catch (err) {
      console.error('[pendle-mcp-v2] Sync loop error:', err);
    }
  }, intervalMs);
}
