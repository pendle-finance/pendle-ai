# pendle-boros

Boros plugin for the `pendle-ai` marketplace. Provides **44 MCP tools**, **3 skills**, and **1 advisor agent** for AI agents to trade interest-rate derivatives on [Boros](https://boros.finance) — Pendle's funding-rate-swap platform on Arbitrum.

Tools connect to a locally launched stdio MCP server (`@pendle/boros-mcp`), which handles delegated-agent signing for trades and serves a browser-wallet handshake page for deposits, withdrawals, and agent setup.

## Skills

| Skill | Description |
|-------|-------------|
| `boros-trading` | Place / cancel / close orders, AMM LP, gas, pre-trade checks |
| `boros-data` | Markets, OHLCV, indicators, order book, funding-rate symbols, strategies, leaderboard, TVL, AMM info |
| `boros-portfolio-account` | Positions, PnL, history, deposits / withdrawals, agent setup, cross↔isolated transfers, vault, incentives |

## Agent

| Agent | Description |
|-------|-------------|
| `boros-advisor` | Open-ended strategy + market-picking advisor. Read-only; hands off to `boros-trading` for execution. |

## MCP tools (44, grouped)

- **Trading (10)**: `place_order`, `place_orders`, `cancel_orders`, `close_position`, `add_liquidity`, `remove_liquidity`, `enter_exit_markets`, `get_orderbook`, `pay_gas`, `get_gas_info`
- **Account / Auth / Wallet (12)**: `setup_agent`, `revoke_agent`, `agent_status`, `deposit`, `withdraw`, `cancel_withdraw`, `cash_transfer`, `vault_pay_treasury`, `get_assets`, `get_collateral`, `get_entered_markets`, `get_orders`
- **Markets / AMM (8)**: `get_markets`, `get_market_ohlcv`, `get_market_indicators`, `get_market_trades`, `get_funding_rate_symbols`, `get_amm_info`, `get_tvl`, `get_strategies`
- **Portfolio (5)**: `get_positions`, `get_portfolio_summary`, `get_pnl_history`, `get_pnl_by_market`, `get_settlement_summary`
- **History / Events (3)**: `get_transaction_history`, `get_transfer_logs`, `get_on_chain_events`
- **Incentives / Risk (4)**: `get_amm_user_rewards`, `get_maker_incentives`, `get_liquidation_events`, `get_leaderboard`
- **Other (2)**: `get_vault_info`, `boros_glossary`

## Configuration

The MCP server is launched locally on demand via `.mcp.json`:

```json
{
  "mcpServers": {
    "boros": {
      "command": "npx",
      "args": ["-y", "@pendle/boros-mcp"]
    }
  }
}
```

Requires Node ≥ 18. The first activation will fetch `@pendle/boros-mcp` from npm.

## Docs

Boros developer docs: <https://docs.pendle.finance/boros-dev>

## License

MIT
