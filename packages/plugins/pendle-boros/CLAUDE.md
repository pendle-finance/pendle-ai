# Pendle Boros Plugin — Maintainer Notes

> **Scope:** This file is maintainer-facing documentation for contributors to the plugin. It is **not** auto-loaded into the user's Claude Code context at install time. Runtime rules that the user's agent must follow at all times are duplicated inside each `skills/*/SKILL.md` and `agents/*.md` body, which Claude Code loads on skill activation / agent invocation. Edit the skill bodies, not this file, when changing runtime behavior.

## Overview

This plugin provides 44 semantic MCP tools and 3 domain-expert skills (plus 1 advisor agent) for interacting with **Boros** — Pendle's interest-rate-derivatives platform on Arbitrum. It enables AI agents to trade funding-rate swaps (long/short YU), manage cross- and isolated-margin accounts, provide AMM liquidity, and query market data. Tools connect to a locally launched stdio MCP server (`@pendle/boros-mcp`).

## Skills

- `boros-trading` — place / cancel / close orders, AMM LP, gas, pre-trade checks.
- `boros-data` — markets, OHLCV, indicators, order book, funding-rate symbols, strategies, leaderboard, TVL, AMM info.
- `boros-portfolio-account` — positions, PnL, history, deposits / withdrawals, agent setup, cross↔isolated transfers, vault, incentives.

## Domain primer

Boros markets let users **long or short the floating funding rate** of an underlying perp venue (Binance, Hyperliquid, etc.) against an **implied APR** set by the order book and AMM. Positions are denominated in **YU (Yield Units)**: long YU pays the fixed APR locked at entry and receives the floating underlying APR; short YU is the opposite. Settlement happens in the collateral token. Each position lives in either a **cross-margin** bucket (one per (account, token), shared across every market entered for that token) or an **isolated-margin** bucket (one per (account, token, market)).

## Delegated agent rule

Trading on Boros uses a **delegated agent keypair**: an ephemeral key approved on-chain by the user wallet (via the Pendle Boros Router contract) for 30 days. The trading tools sign with this key — no browser prompt per trade. The plugin:

- Never logs, prints, or persists the agent private key.
- Treats `agent_status` as a precondition. If no agent is set up, run `setup_agent` first (see wallet-op rule).
- Stops trading and re-runs `setup_agent` if the agent has expired or been revoked.

## Wallet-op rule (browser-wallet-signed tools)

`deposit`, `withdraw`, `cancel_withdraw`, `setup_agent`, `revoke_agent`, `vault_pay_treasury` return a localhost URL that opens a wallet-handshake page. The agent:

1. Calls the tool.
2. Summarizes what the user is about to sign — chain, token, amount, spender contract — using only fields the tool returned.
3. Hands the user the URL.

The user's browser wallet is the final gate. **Do not add a second confirm prompt on the agent side** — the wallet itself confirms.

`pay_gas` is NOT in this set. It is signed by the agent key and deducts from the user's margin account.

## Trading rule (simulate → confirm → execute)

These trading tools accept a `mode` field with values `"simulate"` and `"execute"`: `place_order`, `close_position`, `add_liquidity`, `remove_liquidity`, `cash_transfer`, `deposit`. For each:

1. Call `mode: "simulate"`.
2. Show the simulated result (fill, slippage, IMR impact, post-trade margin, liquidation APR).
3. Ask the user to confirm.
4. Call `mode: "execute"`.

Tools with **no** simulate mode and therefore **no** automatic preview step:

- `place_orders` (bulk) — documented "no per-entry simulation"; agent must present the batch summary and explicitly warn the user before submitting.
- `cancel_orders`, `enter_exit_markets`, `pay_gas` — agent-key-signed, no browser prompt; still confirm intent with the user before execution.
- `withdraw`, `cancel_withdraw`, `setup_agent`, `revoke_agent`, `vault_pay_treasury` — browser-wallet-signed; wallet is the gate.

## Secrets

- **NEVER print API keys, private keys, agent private keys, or raw signatures.** They live in the MCP runtime and never leave it.
- API keys live in `.env` files only (gitignored). Reference them by variable name, never by value.

## Testing policy (inherits repo rules)

- Run tests only — do NOT auto-fix bugs. Raise failures to the user.
- A 429 is a test failure. Surface it immediately.

## Approvals

- `requiredApprovals` doesn't lie. If the API returns empty `requiredApprovals`, the on-chain allowance IS sufficient. Do NOT auto-approve beyond what the response says.

## When unsure — read the docs

Use `WebFetch` for the relevant URL under `https://docs.pendle.finance/boros-dev`. The full map lives in each skill's "When unsure — read the docs" section. The slug layout under `boros-dev/` may strip numeric prefixes from `Backend/` filenames; if a fetch 404s, drop the prefix and retry, or fall back to the `boros-dev` index.
