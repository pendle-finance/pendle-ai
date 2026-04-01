# Pendle V2 Plugin

## Overview

This plugin provides 25 semantic MCP tools and 4 domain-expert skills for interacting with the Pendle V2 DeFi protocol. It enables AI agents to trade yield tokens (PT/YT), manage LP positions, place limit orders, and query market data across multiple EVM chains. Tools connect to the Pendle backend MCP endpoint via StreamableHTTP.

## Structure

```text
pendle-v2/
├── .claude-plugin/plugin.json   # Plugin manifest
├── .mcp.json                    # MCP server config (remote StreamableHTTP endpoint)
├── skills/                      # 4 domain-expert skills
│   ├── pendle-swap/SKILL.md     # Trading + LP management
│   ├── pendle-data/SKILL.md     # Market data, filtering, analytics
│   ├── pendle-portfolio/SKILL.md
│   └── pendle-order/SKILL.md
├── agents/
│   └── advisor.md               # Trade advisor agent
└── references/                  # Shared reference documents
```

## Testing Policy

- When running tests: **only run tests, do NOT auto-fix bugs**.
- If a test fails or a bug is found, **raise it to the user**.
- **Do NOT tolerate 429 errors** in tests.

## Approvals

- **`requiredApprovals` doesn't lie.** If the API returns empty `requiredApprovals`, the on-chain allowance IS sufficient.

## Limit Orders

- `TOKEN_FOR_PT` / `TOKEN_FOR_YT` order types accept the same tokens as the market's `inputTokens`
- `PT_FOR_TOKEN` / `YT_FOR_TOKEN` order types accept the same tokens as the market's `outputTokens`

## Secrets & API Keys

- **NEVER print API keys, private keys, or secrets** in documentation, code comments, or commit messages.
- API keys live in `.env` files only (gitignored).
