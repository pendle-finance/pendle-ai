# Changelog

## [1.0.2] - 2026-04-15

- Updated to parity with MCP 1.0.2
- MCP: revert: `get_external_protocols` returns only the protocols.
- MCP: feat: Improve market queries with integration support.
- MCP: feat: Add LO incentive data to `get_markets` and `get_order_book` for enhanced market insights.
- MCP: feat: Add cross chain PT info and integration info to `get_markets`.

## [1.0.1] - 2026-04-13

- Updated to parity with MCP 1.0.1
- MCP: feat: `get_markets` filter expired markets by default.
- MCP: fix: `get_external_protocols` should return list of integrations, not just the protocol.

## [1.0.0] - Initial official release

### Added

- 25 semantic MCP tools for interacting with Pendle V2 protocol
- 4 domain-expert skills:
  - **pendle-swap** — trade yield tokens (buy/sell PT & YT), add/remove liquidity, mint/redeem SY, claim rewards
  - **pendle-data** — query markets, assets, APY analytics, and yield strategy insights
  - **pendle-portfolio** — view and analyze portfolio positions across markets
  - **pendle-order** — create, submit, and cancel limit orders with EIP-712 signing
- Trade advisor agent for market analysis and yield recommendations
- Remote MCP server via StreamableHTTP (replaces local MCP server from beta)
- Multi-chain support across EVM networks

### Breaking Changes

- Local MCP server (`mcp-server/`) has been removed — all tools now connect to the Pendle backend endpoint

## [1.0.0-beta] - Initial beta release
