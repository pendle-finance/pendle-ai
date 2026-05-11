# Changelog

## [1.0.0] - 2026-05-11

### Added

- Initial release of the `pendle-boros` plugin.
- 3 skills: `boros-trading`, `boros-data`, `boros-portfolio-account`.
- 1 advisor agent: `boros-advisor`.
- MCP server config (`.mcp.json`) launching `@pendle/boros-mcp` over stdio.
- 44 tools registered, covering trading (with `mode: "simulate"` → `"execute"`), AMM LP, market data, portfolio, account, agent setup, deposits/withdrawals, vaults, and incentives.
