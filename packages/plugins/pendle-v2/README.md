# pendle-v2

Pendle V2 plugin for the pendle-ai marketplace. Provides **25 MCP tools** and **4 skills** for AI agents to interact with the [Pendle](https://pendle.finance) DeFi protocol. Market data is stored in an in-memory SQLite database synced every 5 minutes.

## Skills

| Skill | Description |
|-------|-------------|
| `pendle-swap` | Trade execution + LP — buy/sell PT/YT, mint/redeem SY, ERC20 swaps, add/remove liquidity, claim rewards |
| `pendle-data` | Market data — SQL-backed filtering, APY analytics, asset lookup, yield strategy insights |
| `pendle-portfolio` | Portfolio overview — positions, maturity alerts, P&L |
| `pendle-order` | Limit orders — create, sign, submit, cancel |

## MCP Tools

- **9 Action Tools**: buy/sell PT/YT, add/remove liquidity, mint/redeem, swap, claim rewards
- **11 Query Tools**: get_markets, get_asset, get_chains, get_market, get_prices, get_portfolio, get_order_book, get_history, resolve_token, preview_trade, pendle_router
- **5 Limit Order Tools**: create/submit/cancel limit orders, get_my_orders, get_order_book

## Building

```bash
nx run pendle-v2-mcp-server:build
```

## Running

```bash
node mcp-server/dist/index.js
```
