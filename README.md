# pendle-ai

> **Beta** — This project is under active development.

AI plugins for [Pendle Finance](https://pendle.finance) — trade yield tokens, manage LP positions, place limit orders, and query DeFi market data across 7 EVM chains.

## Quick Start

```bash
# Claude Code Marketplace
/plugin marketplace add pendle-finance/pendle-ai

# Install individual plugins
/plugin install pendle-v2    # Pendle V2 DeFi protocol
```

## MCP Server

If you only need the MCP tools (without skills or agents), you can add the Pendle MCP server directly to your AI tool of choice.

**Server URL:** `https://api-v2.pendle.finance/core/mcp`

### Claude Code

```bash
claude mcp add pendle-v2 --transport http https://api-v2.pendle.finance/core/mcp
```

### Claude Desktop

1. Open **Settings** > **Connectors**
2. Click **Add Connector**
3. Enter the URL: `https://api-v2.pendle.finance/core/mcp`

### OpenCode

Use OpenCode CLI to interactively add the MCP:

```bash
opencode mcp add
```

### GitHub Copilot (VS Code)

Add to your `.vscode/mcp.json`:

```json
{
  "servers": {
		"pendle-v2": {
			"url": "https://api-v2.pendle.finance/core/mcp",
			"type": "http"
		}
	}
}
```

### Codex CLI

```bash
codex mcp add pendle-v2 --url https://api-v2.pendle.finance/core/mcp
```

### Gemini CLI

> Note: There is some unknown issue with the built-in HTTP Streamable MCP mode in Gemini which prevents us from accessing the MCP. We propose using mcp-remote as an alternative.

Add to your `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "pendle-v2": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://api-v2.pendle.finance/core/mcp"
      ]
    }
  }
}
```

## Plugins

| Plugin | Description | Skills | MCP Tools |
|--------|-------------|--------|-----------|
| [pendle-v2](packages/plugins/pendle-v2/) | Pendle V2 DeFi protocol — swap, LP, limit orders, market data | 4 | 25 |

## Contributing

See [CLAUDE.md](./CLAUDE.md) for development setup and contribution guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.
