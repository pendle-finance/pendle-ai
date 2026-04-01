# pendle-v2

Pendle V2 plugin for the pendle-ai marketplace. Provides **25 MCP tools** and **4 skills** for AI agents to interact with the [Pendle](https://pendle.finance) DeFi protocol. Tools connect to the Pendle backend via StreamableHTTP MCP endpoint.

## Skills

| Skill | Description |
|-------|-------------|
| `pendle-swap` | Trade execution + LP — buy/sell PT/YT, mint/redeem SY, ERC20 swaps, add/remove liquidity, claim rewards |
| `pendle-data` | Market data — filtering, APY analytics, asset lookup, yield strategy insights |
| `pendle-portfolio` | Portfolio overview — positions, maturity alerts, P&L |
| `pendle-order` | Limit orders — create, sign, submit, cancel |

## MCP Tools

- **9 Action Tools**: buy/sell PT/YT, add/remove liquidity, mint/redeem, swap, claim rewards
- **5 Market Query Tools**: get_chains, get_markets, get_market, get_history, get_external_protocols
- **3 Asset Query Tools**: get_asset, get_prices, resolve_token
- **1 Router Tool**: pendle_router
- **2 Portfolio Tools**: get_portfolio, get_order_book
- **4 Limit Order Tools**: create/submit/cancel limit orders, get_my_orders
- **1 Preview Tool**: preview_trade

## Configuration

The MCP server endpoint is configured in `.mcp.json` pointing to `http://api-v2.pendle.finance/core/mcp`.
