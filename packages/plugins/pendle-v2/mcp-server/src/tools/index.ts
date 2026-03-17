import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type Database from 'better-sqlite3';
import { registerActionTools } from './action-tools.js';
import { registerLimitOrderTools } from './limit-order-tools.js';
import { registerQueryTools } from './query-tools.js';

export function registerTools(server: McpServer, db: Database.Database) {
  registerActionTools(server); // 9 tools: buy/sell PT/YT, add/remove liquidity, mint/redeem, swap, claim
  registerQueryTools(server, db); // 11 tools: get_markets, get_asset, get_chains, get_market, get_prices, get_portfolio, get_order_book, get_history, resolve_token, preview_trade, pendle_router
  registerLimitOrderTools(server); // 5 tools: create/submit/cancel limit orders, get_my_orders
  console.error('Registered 25 semantic tools');
}
