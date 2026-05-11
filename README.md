# pendle-ai

> **Beta** — This project is under active development.

AI plugins for [Pendle Finance](https://pendle.finance) — trade yield tokens, manage LP positions, place limit orders, and query DeFi market data across 7 EVM chains.

## Quick Start

```bash
# Claude Code Marketplace
/plugin marketplace add pendle-finance/pendle-ai

# Install individual plugins
/plugin install pendle-v2        # Pendle V2 DeFi protocol
/plugin install pendle-boros     # Boros — interest-rate derivatives (Arbitrum)
```

## MCP Servers

Two MCP servers ship with this marketplace. Use the plugin install above to get tools **plus** skills and the advisor agent; use the raw MCP configs below if you only want the tools.

### Pendle V2 — remote HTTP

Hosted at `https://api-v2.pendle.finance/core/mcp`. Streamable HTTP, no install.

### Boros — local stdio

Runs locally via `npx -y @pendle/boros-mcp` (Node ≥ 18). Required to be local because Boros wallet operations broker browser-wallet signatures via a `127.0.0.1` callback — a remote HTTP MCP cannot do that. See [packages/plugins/pendle-boros/README.md](packages/plugins/pendle-boros/README.md) for the full approval-flow + security-model writeup.

---

## Pendle V2 MCP install

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

---

## Boros MCP install

**Package:** `@pendle/boros-mcp` (stdio, npm). Node ≥ 18.

### Claude Code

```bash
claude mcp add boros -- npx -y @pendle/boros-mcp
```

Add `--scope user` for global (all projects) instead of the default project scope. Verify with `claude mcp list`.

### Claude Desktop

Edit `claude_desktop_config.json`:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

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

Restart the app to load the server.

### Codex CLI

Edit `~/.codex/config.toml`:

```toml
[mcp_servers.boros]
command = "npx"
args = ["-y", "@pendle/boros-mcp"]
```

### Gemini CLI

Edit `~/.gemini/settings.json`:

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

### OpenCode

Edit `~/.config/opencode/opencode.json` (or `opencode.json` at the project root):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "boros": {
      "type": "local",
      "command": ["npx", "-y", "@pendle/boros-mcp"],
      "enabled": true
    }
  }
}
```

### Built from source

Replace the `command`/`args` block in any of the configs above with:

```json
"command": "node",
"args": ["/absolute/path/to/boros-mcp/dist/index.js"]
```

> **Sandbox warning:** Wallet ops (`setup_agent`, `deposit`, `withdraw`, `cancel_withdraw`, `revoke_agent`, `vault_pay_treasury`) need a browser the user can reach to sign + loopback access between the MCP child process and that browser. Sandboxed / remote-container clients should run `setup_agent` and deposits from a local machine first, then copy `~/.boros-mcp/agent.enc` over for trading-only flows.

---

## Plugins

| Plugin | Description | Skills | MCP Tools |
|--------|-------------|--------|-----------|
| [pendle-v2](packages/plugins/pendle-v2/) | Pendle V2 DeFi protocol — swap, LP, limit orders, market data | 4 | 25 |
| [pendle-boros](packages/plugins/pendle-boros/) | Boros — interest-rate derivatives on Arbitrum: long/short funding rates, AMM LP, cross/isolated margin | 3 (+1 advisor) | 44 |

## Contributing

See [CLAUDE.md](./CLAUDE.md) for development setup and contribution guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.
