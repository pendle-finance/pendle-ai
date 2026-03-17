import Database from 'better-sqlite3';

// ── Schema ───────────────────────────────────────────────────────────────────

const CREATE_MARKETS_TABLE = `
CREATE TABLE IF NOT EXISTS markets (
  address       TEXT    NOT NULL,
  chainId       INTEGER NOT NULL,
  name          TEXT,
  expiry        TEXT,
  pt            TEXT,
  yt            TEXT,
  sy            TEXT,
  underlyingAsset TEXT,
  isNew         INTEGER,
  isPrime       INTEGER,
  timestamp     TEXT,
  lpWrapper     TEXT,
  categoryIds   TEXT,
  isVolatile    INTEGER,
  details_liquidity       REAL,
  details_totalTvl        REAL,
  details_tradingVolume   REAL,
  details_underlyingApy   REAL,
  details_swapFeeApy      REAL,
  details_pendleApy       REAL,
  details_impliedApy      REAL,
  details_feeRate         REAL,
  details_yieldRange_min  REAL,
  details_yieldRange_max  REAL,
  details_aggregatedApy   REAL,
  details_maxBoostedApy   REAL,
  details_totalPt         REAL,
  details_totalSy         REAL,
  details_totalSupply     REAL,
  details_totalActiveSupply REAL,
  points            TEXT,
  externalProtocols TEXT,
  PRIMARY KEY (chainId, address)
);
`;

const CREATE_ASSETS_TABLE = `
CREATE TABLE IF NOT EXISTS assets (
  address   TEXT    NOT NULL,
  chainId   INTEGER NOT NULL,
  name      TEXT,
  symbol    TEXT,
  decimals  INTEGER,
  tags      TEXT,
  expiry    TEXT,
  proIcon   TEXT,
  PRIMARY KEY (chainId, address)
);
`;

const CREATE_CHAINS_TABLE = `
CREATE TABLE IF NOT EXISTS chains (
  chainId   INTEGER PRIMARY KEY
);
`;

const CREATE_EXTERNAL_PROTOCOLS_TABLE = `
CREATE TABLE IF NOT EXISTS market_external_protocols (
  chainId           INTEGER NOT NULL,
  market            TEXT    NOT NULL,
  slot              TEXT    NOT NULL,
  protocol_id       TEXT    NOT NULL,
  protocol_name     TEXT,
  protocol_category TEXT,
  protocol_url      TEXT,
  integrationUrl    TEXT,
  description       TEXT,
  liquidity         REAL,
  borrowApy         REAL,
  supplyApy         REAL,
  totalSupply       REAL,
  supplyCap         REAL,
  maxLtv            REAL,
  curatorAddress    TEXT,
  subtitle          TEXT,
  spokeAddress      TEXT,
  PRIMARY KEY (chainId, market, slot, protocol_id)
);
`;

// ── Init ─────────────────────────────────────────────────────────────────────

export function initDatabase(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.exec(CREATE_MARKETS_TABLE);
  db.exec(CREATE_ASSETS_TABLE);
  db.exec(CREATE_CHAINS_TABLE);
  db.exec(CREATE_EXTERNAL_PROTOCOLS_TABLE);
  return db;
}

// ── Market types ─────────────────────────────────────────────────────────────

/** Flat market row as stored in SQLite. */
export interface MarketRow {
  address: string;
  chainId: number;
  name: string | null;
  expiry: string | null;
  pt: string | null;
  yt: string | null;
  sy: string | null;
  underlyingAsset: string | null;
  isNew: number | null;
  isPrime: number | null;
  timestamp: string | null;
  lpWrapper: string | null;
  categoryIds: string | null;
  isVolatile: number | null;
  details_liquidity: number | null;
  details_totalTvl: number | null;
  details_tradingVolume: number | null;
  details_underlyingApy: number | null;
  details_swapFeeApy: number | null;
  details_pendleApy: number | null;
  details_impliedApy: number | null;
  details_feeRate: number | null;
  details_yieldRange_min: number | null;
  details_yieldRange_max: number | null;
  details_aggregatedApy: number | null;
  details_maxBoostedApy: number | null;
  details_totalPt: number | null;
  details_totalSy: number | null;
  details_totalSupply: number | null;
  details_totalActiveSupply: number | null;
  /** JSON-serialized PointMetadataEntity[] */
  points: string | null;
  /** JSON-serialized MarketExternalProtocolsEntity */
  externalProtocols: string | null;
}

/** Flat external protocol row as stored in market_external_protocols. */
export interface ExternalProtocolRow {
  chainId: number;
  /** Market address */
  market: string;
  /** Token slot: 'pt' | 'yt' | 'lp' | 'crossPt' */
  slot: string;
  protocol_id: string;
  protocol_name: string | null;
  protocol_category: string | null;
  protocol_url: string | null;
  integrationUrl: string | null;
  description: string | null;
  liquidity: number | null;
  borrowApy: number | null;
  supplyApy: number | null;
  totalSupply: number | null;
  supplyCap: number | null;
  maxLtv: number | null;
  curatorAddress: string | null;
  subtitle: string | null;
  spokeAddress: string | null;
}

/** Flat asset row as stored in SQLite. */
export interface AssetRow {
  address: string;
  chainId: number;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  tags: string | null;
  expiry: string | null;
  proIcon: string | null;
}

// ── Upsert helpers ───────────────────────────────────────────────────────────

import type { AssetDataCrossChain, MarketCrossChainDataV2 } from './openapi/api.js';

export function upsertMarkets(db: Database.Database, markets: MarketCrossChainDataV2[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO markets (
      address, chainId, name, expiry, pt, yt, sy, underlyingAsset,
      isNew, isPrime, timestamp, lpWrapper, categoryIds, isVolatile,
      details_liquidity, details_totalTvl, details_tradingVolume,
      details_underlyingApy, details_swapFeeApy, details_pendleApy,
      details_impliedApy, details_feeRate, details_yieldRange_min,
      details_yieldRange_max, details_aggregatedApy, details_maxBoostedApy,
      details_totalPt, details_totalSy, details_totalSupply,
      details_totalActiveSupply, points, externalProtocols
    ) VALUES (
      @address, @chainId, @name, @expiry, @pt, @yt, @sy, @underlyingAsset,
      @isNew, @isPrime, @timestamp, @lpWrapper, @categoryIds, @isVolatile,
      @details_liquidity, @details_totalTvl, @details_tradingVolume,
      @details_underlyingApy, @details_swapFeeApy, @details_pendleApy,
      @details_impliedApy, @details_feeRate, @details_yieldRange_min,
      @details_yieldRange_max, @details_aggregatedApy, @details_maxBoostedApy,
      @details_totalPt, @details_totalSy, @details_totalSupply,
      @details_totalActiveSupply, @points, @externalProtocols
    )
  `);

  const insertMany = db.transaction((rows: MarketCrossChainDataV2[]) => {
    for (const m of rows) {
      stmt.run({
        address: m.address,
        chainId: m.chainId,
        name: m.name,
        expiry: m.expiry,
        pt: m.pt,
        yt: m.yt,
        sy: m.sy,
        underlyingAsset: m.underlyingAsset,
        isNew: m.isNew ? 1 : 0,
        isPrime: m.isPrime ? 1 : 0,
        timestamp: m.timestamp,
        lpWrapper: m.lpWrapper ?? null,
        categoryIds: m.categoryIds ? JSON.stringify(m.categoryIds) : null,
        isVolatile: m.isVolatile != null ? (m.isVolatile ? 1 : 0) : null,
        details_liquidity: m.details.liquidity,
        details_totalTvl: m.details.totalTvl,
        details_tradingVolume: m.details.tradingVolume,
        details_underlyingApy: m.details.underlyingApy,
        details_swapFeeApy: m.details.swapFeeApy,
        details_pendleApy: m.details.pendleApy,
        details_impliedApy: m.details.impliedApy,
        details_feeRate: m.details.feeRate,
        details_yieldRange_min: m.details.yieldRange.min,
        details_yieldRange_max: m.details.yieldRange.max,
        details_aggregatedApy: m.details.aggregatedApy,
        details_maxBoostedApy: m.details.maxBoostedApy,
        details_totalPt: m.details.totalPt,
        details_totalSy: m.details.totalSy,
        details_totalSupply: m.details.totalSupply,
        details_totalActiveSupply: m.details.totalActiveSupply,
        points: m.points ? JSON.stringify(m.points) : null,
        externalProtocols: m.externalProtocols ? JSON.stringify(m.externalProtocols) : null,
      });
    }
  });

  insertMany(markets);
}

export function upsertAssets(db: Database.Database, assets: AssetDataCrossChain[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO assets (
      address, chainId, name, symbol, decimals, tags, expiry, proIcon
    ) VALUES (
      @address, @chainId, @name, @symbol, @decimals, @tags, @expiry, @proIcon
    )
  `);

  const insertMany = db.transaction((rows: AssetDataCrossChain[]) => {
    for (const a of rows) {
      stmt.run({
        address: a.address,
        chainId: a.chainId,
        name: a.name,
        symbol: a.symbol,
        decimals: a.decimals,
        tags: JSON.stringify(a.tags),
        expiry: a.expiry,
        proIcon: a.proIcon,
      });
    }
  });

  insertMany(assets);
}

export function upsertChains(db: Database.Database, chainIds: number[]): void {
  const stmt = db.prepare('INSERT OR REPLACE INTO chains (chainId) VALUES (@chainId)');
  const insertMany = db.transaction((ids: number[]) => {
    for (const chainId of ids) {
      stmt.run({ chainId });
    }
  });
  insertMany(chainIds);
}

export function upsertExternalProtocols(
  db: Database.Database,
  markets: MarketCrossChainDataV2[],
): void {
  const deleteStmt = db.prepare(
    'DELETE FROM market_external_protocols WHERE chainId = @chainId AND market = @market',
  );
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO market_external_protocols (
      chainId, market, slot, protocol_id, protocol_name, protocol_category,
      protocol_url, integrationUrl, description, liquidity, borrowApy,
      supplyApy, totalSupply, supplyCap, maxLtv, curatorAddress, subtitle, spokeAddress
    ) VALUES (
      @chainId, @market, @slot, @protocol_id, @protocol_name, @protocol_category,
      @protocol_url, @integrationUrl, @description, @liquidity, @borrowApy,
      @supplyApy, @totalSupply, @supplyCap, @maxLtv, @curatorAddress, @subtitle, @spokeAddress
    )
  `);

  const upsertAll = db.transaction((rows: MarketCrossChainDataV2[]) => {
    for (const m of rows) {
      deleteStmt.run({ chainId: m.chainId, market: m.address });

      if (!m.externalProtocols) continue;
      const slots = [
        ['pt', m.externalProtocols.pt],
        ['yt', m.externalProtocols.yt],
        ['lp', m.externalProtocols.lp],
        ['crossPt', m.externalProtocols.crossPt],
      ] as const;

      for (const [slot, entries] of slots) {
        for (const e of entries) {
          insertStmt.run({
            chainId: m.chainId,
            market: m.address,
            slot,
            protocol_id: e.protocol.id,
            protocol_name: e.protocol.name,
            protocol_category: e.protocol.category,
            protocol_url: e.protocol.url,
            integrationUrl: e.integrationUrl,
            description: e.description,
            liquidity: e.liquidity ?? null,
            borrowApy: e.borrowApy ?? null,
            supplyApy: e.supplyApy ?? null,
            totalSupply: e.totalSupply ?? null,
            supplyCap: e.supplyCap ?? null,
            maxLtv: e.maxLtv ?? null,
            curatorAddress: e.curatorAddress ?? null,
            subtitle: e.subtitle ?? null,
            spokeAddress: e.spokeAddress ?? null,
          });
        }
      }
    }
  });

  upsertAll(markets);
}

export function getChains(db: Database.Database): number[] {
  const rows = db.prepare('SELECT chainId FROM chains ORDER BY chainId').all() as Array<{
    chainId: number;
  }>;
  return rows.map((r) => r.chainId);
}

// ── Query helpers ────────────────────────────────────────────────────────────

/** Allowed column names for market queries (prevents SQL injection). */
const MARKET_COLUMNS = new Set<string>([
  'address',
  'chainId',
  'name',
  'expiry',
  'pt',
  'yt',
  'sy',
  'underlyingAsset',
  'isNew',
  'isPrime',
  'timestamp',
  'lpWrapper',
  'categoryIds',
  'isVolatile',
  'details_liquidity',
  'details_totalTvl',
  'details_tradingVolume',
  'details_underlyingApy',
  'details_swapFeeApy',
  'details_pendleApy',
  'details_impliedApy',
  'details_feeRate',
  'details_yieldRange_min',
  'details_yieldRange_max',
  'details_aggregatedApy',
  'details_maxBoostedApy',
  'details_totalPt',
  'details_totalSy',
  'details_totalSupply',
  'details_totalActiveSupply',
]);

/** Supported filter operators. */
const VALID_OPS = new Set(['=', '!=', '>', '<', '>=', '<=', 'LIKE']);

export interface MarketFilter {
  field: string;
  op: string;
  value: string | number;
}

export interface MarketSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryMarketsOpts {
  filter?: MarketFilter[];
  sort?: MarketSort;
  limit?: number;
  skip?: number;
  one?: boolean;
}

export function queryMarkets(
  db: Database.Database,
  opts: QueryMarketsOpts = {},
): MarketRow[] | MarketRow | null {
  const clauses: string[] = [];
  const params: Record<string, string | number> = {};

  if (opts.filter) {
    for (let i = 0; i < opts.filter.length; i++) {
      const f = opts.filter[i];
      const op = f.op.toUpperCase();
      if (!MARKET_COLUMNS.has(f.field)) {
        throw new Error(`Invalid filter field: ${f.field}`);
      }
      if (!VALID_OPS.has(op)) {
        throw new Error(`Invalid filter operator: ${f.op}`);
      }
      const paramName = `f${i}`;
      clauses.push(`${f.field} ${op} @${paramName}`);
      params[paramName] = f.value;
    }
  }

  let sql = 'SELECT * FROM markets';
  if (clauses.length > 0) {
    sql += ` WHERE ${clauses.join(' AND ')}`;
  }

  if (opts.sort) {
    if (!MARKET_COLUMNS.has(opts.sort.field)) {
      throw new Error(`Invalid sort field: ${opts.sort.field}`);
    }
    const dir = opts.sort.direction === 'desc' ? 'DESC' : 'ASC';
    sql += ` ORDER BY ${opts.sort.field} ${dir}`;
  }

  const limit = opts.one ? 1 : Math.min(opts.limit ?? 20, 100);
  sql += ` LIMIT ${limit}`;

  if (opts.skip && opts.skip > 0) {
    sql += ` OFFSET ${opts.skip}`;
  }

  const rows = db.prepare(sql).all(params) as MarketRow[];

  if (opts.one) {
    return rows[0] ?? null;
  }
  return rows;
}

// ── External protocol query ───────────────────────────────────────────────────

/** Columns on market_external_protocols that support direct filtering. */
const PROTOCOL_COLUMNS = new Set<string>([
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
]);

export interface ExternalProtocolFilter {
  field: string;
  op: string;
  value: string | number;
}

export interface QueryExternalProtocolsOpts {
  filter?: ExternalProtocolFilter[];
  /** Sort by a protocol column */
  sort?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  skip?: number;
  /** When true, JOIN markets table and include market name, expiry, impliedApy, underlyingApy */
  includeMarket?: boolean;
}

export type ExternalProtocolWithMarket = ExternalProtocolRow & {
  market_name: string | null;
  market_expiry: string | null;
  details_impliedApy: number | null;
  details_underlyingApy: number | null;
  details_aggregatedApy: number | null;
};

export function queryExternalProtocols(
  db: Database.Database,
  opts: QueryExternalProtocolsOpts = {},
): (ExternalProtocolRow | ExternalProtocolWithMarket)[] {
  const clauses: string[] = [];
  const params: Record<string, string | number> = {};

  const prefix = opts.includeMarket ? 'p.' : '';

  if (opts.filter) {
    for (let i = 0; i < opts.filter.length; i++) {
      const f = opts.filter[i];
      const op = f.op.toUpperCase();
      if (!PROTOCOL_COLUMNS.has(f.field)) {
        throw new Error(`Invalid filter field: ${f.field}`);
      }
      if (!VALID_OPS.has(op)) {
        throw new Error(`Invalid filter operator: ${f.op}`);
      }
      const paramName = `f${i}`;
      clauses.push(`${prefix}${f.field} ${op} @${paramName}`);
      params[paramName] = f.value;
    }
  }

  let sql: string;
  if (opts.includeMarket) {
    sql = `
      SELECT p.*,
             m.name  AS market_name,
             m.expiry AS market_expiry,
             m.details_impliedApy,
             m.details_underlyingApy,
             m.details_aggregatedApy
      FROM market_external_protocols p
      LEFT JOIN markets m ON m.chainId = p.chainId AND m.address = p.market
    `;
  } else {
    sql = 'SELECT * FROM market_external_protocols p';
  }

  if (clauses.length > 0) {
    sql += ` WHERE ${clauses.join(' AND ')}`;
  }

  if (opts.sort) {
    const sortCol = opts.sort.field;
    const isMarketCol = ['market_name', 'market_expiry', 'details_impliedApy', 'details_underlyingApy', 'details_aggregatedApy'].includes(sortCol);
    if (!PROTOCOL_COLUMNS.has(sortCol) && !isMarketCol) {
      throw new Error(`Invalid sort field: ${sortCol}`);
    }
    const dir = opts.sort.direction === 'desc' ? 'DESC' : 'ASC';
    sql += ` ORDER BY ${sortCol} ${dir}`;
  }

  const limit = Math.min(opts.limit ?? 20, 100);
  sql += ` LIMIT ${limit}`;
  if (opts.skip && opts.skip > 0) sql += ` OFFSET ${opts.skip}`;

  return db.prepare(sql).all(params) as (ExternalProtocolRow | ExternalProtocolWithMarket)[];
}

// ── Asset lookup ─────────────────────────────────────────────────────────────

export function getAsset(db: Database.Database, chainId: number, address: string): AssetRow | null {
  return (
    (db
      .prepare('SELECT * FROM assets WHERE chainId = @chainId AND address = @address')
      .get({ chainId, address: address.toLowerCase() }) as AssetRow | undefined) ?? null
  );
}
