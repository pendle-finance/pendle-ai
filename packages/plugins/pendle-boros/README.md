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

## How approvals work — read this first

Boros MCP is **not** a pure JSON-RPC MCP. Alongside the stdio MCP channel it spins up a small HTTP server on `127.0.0.1:<ephemeral-port>` to broker browser-side wallet signatures. Necessary because Boros wallet operations require signatures from your **real** wallet, which lives in the browser, not in the LLM.

### Two classes of action

| Class | Tools | Signing key | Browser involved? |
|---|---|---|---|
| **Trading & AMM** | `place_order`, `place_orders`, `close_position`, `cancel_orders`, `add_liquidity`, `remove_liquidity`, `cash_transfer`, `enter_exit_markets`, `pay_gas` | **Agent key** (delegated, on-disk) | No — fully autonomous |
| **Wallet & agent lifecycle** | `setup_agent`, `revoke_agent`, `deposit`, `withdraw`, `cancel_withdraw`, `vault_pay_treasury` | **Your main wallet** | Yes — browser callback |

### Localhost callback flow

When the agent calls a wallet tool (e.g. *"deposit 100 USDC into Boros"*):

1. Tool returns a localhost URL with a one-time token: `http://127.0.0.1:<ephemeral-port>/deposit?token=<uuid>`. Server auto-opens it; URL is also echoed to stderr (`[boros-mcp] Opening browser: …`) so you can paste manually.
2. Page prompts your browser wallet (MetaMask, Rabby, …) to sign and broadcast the tx. Private key never leaves the browser.
3. After confirmation, page POSTs `txHash` back to the same localhost port.
4. Server **verifies the receipt on-chain**: tx hit `ROUTER_ADDRESS`, function selector is in the per-action allowlist, signed-from address matches your registered wallet. Only then does the tool call resolve success to the LLM.

If verification fails (wrong contract, wrong selector, wrong signer), the tool call errors and nothing further happens.

### First-run agent setup

On first use, ask the agent *"set up a Boros agent"* (this is the `boros-portfolio-account` skill's onboarding sub-flow). The server:

1. Generates a fresh Ethereum keypair (the **agent key**) in-process.
2. Opens an `/approve-agent` page where you connect your real wallet and **sign one EIP-712 typed message** (not a transaction — no gas paid; the Pendle relayer broadcasts the approval on-chain).
3. Once the relay tx confirms, encrypts the agent key with AES-256-GCM (scrypt-derived KDF, optional password) and stores it at `~/.boros-mcp/agent.enc`.

Subsequent trades are signed locally by the delegated agent — no browser, no popups. Wallet operations always re-prompt the browser. The agent is bounded on-chain to ~12 trading/AMM router selectors — it **cannot** withdraw, transfer to other wallets, change account managers, or approve other agents. Default expiry 30 days; revoke at any time via *"revoke my Boros agent"* (a wallet-flow action).

### Why this matters for client config

- The MCP server **must run as a long-lived child process** of the MCP client (Claude Code's `.mcp.json` config above does this — do not invoke `boros-mcp` as a one-shot RPC). The in-memory `pendingActions` map (token → action lookup with TTL) is what makes the localhost callback safe.
- **Port is ephemeral** (OS-assigned per startup). Do not firewall a fixed port; do not expose. Server only binds `127.0.0.1`.
- If your MCP client is sandboxed without browser / loopback access (e.g. remote container), wallet-signing tools will not work. Trading-only flows still function once an agent is provisioned from a non-sandboxed environment.

## Environment variables

All optional. Set in the shell that launches Claude Code (the plugin's `.mcp.json` does not currently set env; export at the user level if needed).

| Variable | Default | Purpose |
|---|---|---|
| `ARBITRUM_RPC` | `https://arb1.arbitrum.io/rpc` | Arbitrum RPC endpoint |
| `BOROS_MCP_PRETTY` | unset | Set to `1` to pretty-print JSON tool responses (debug; ~30–40% more tokens) |

## Security model

- Agent key lives **only** on your machine, encrypted at rest under a scrypt-derived key (optional password, AES-256-GCM) at `~/.boros-mcp/agent.enc`.
- Wallet operations (deposit / withdraw / agent setup / revoke / vault treasury) **never** use the agent key — they always re-prompt your real wallet via the localhost callback.
- Trade calldata is verified against the simulated parameters before signing (selector allowlist + intent verification).
- Browser-callback transactions are verified on-chain after submission: receipt status, target contract (`ROUTER_ADDRESS`), function selector, and signer address must all match. A malicious page cannot resolve a deposit by pointing at an unrelated successful tx.
- HTTP server only listens on `127.0.0.1`, on an OS-assigned ephemeral port chosen fresh each launch (no stable port to bookmark or expose).
- One-time tokens scope each pending action to a single browser callback. Tokens kept in memory only, invalidated on use or process exit.

## Sandbox / headless environments

The wallet-callback flow needs:

- A browser the user can reach to sign.
- Loopback (`127.0.0.1`) network access between the MCP child process and that browser.

If you run Claude Code inside a remote container or VM with no browser forwarding, `setup_agent`, `deposit`, `withdraw`, `cancel_withdraw`, `revoke_agent`, and `vault_pay_treasury` will hang on the callback. Workaround: run the one-time `setup_agent` and any deposits from a local machine; once `~/.boros-mcp/agent.enc` exists, copy it to the sandbox and run trading-only flows there (still subject to local network policy).

## Docs

Boros developer docs: <https://docs.pendle.finance/boros-dev>

## License

MIT
