# CLAUDE.md - Pendle AI Project Guidelines

## Overview

This is the **pendle-ai** monorepo — a marketplace of AI plugins for Pendle Finance products. Each plugin provides skills, MCP tools, and domain expertise for AI agents (Claude, Cursor, Windsurf, etc.) to interact with Pendle DeFi protocol.

## Core Requirements

### Toolchain

- **Package manager**: npm
- **Monorepo orchestration**: Turborepo — all tasks run through `turbo`
- **Linting & formatting**: Biome — replaces ESLint + Prettier
- **TypeScript**: 5.9.x with strict mode

### Package Structure

- All packages must have a `package.json` with appropriate scripts
- Use Turborepo's pipeline (`turbo.json`) for task dependencies and caching
- Follow workspace conventions for monorepo organization

### Development Workflow

- Use `turbo run <task>` for all operations (build, typecheck, lint, eval, etc.)
- Maintain proper inter-package dependencies through workspaces
- Turborepo automatically handles task ordering and caching

### Code Quality Enforcement

After making any code changes, Claude Code MUST:

1. **Format the code**: Run `npx biome format --write .` to format all files
2. **Lint the code**: Run `npx biome check .` to check for linting errors
3. **Typecheck the code**: Run `turbo run typecheck` to typecheck affected projects

## Package Scopes

| Type    | Scope     | npm | Marketplace                   |
| ------- | --------- | --- | ----------------------------- |
| Plugins | `@pendle` | No  | Yes (Claude Code Marketplace) |

## Repository Structure

```text
pendle-ai/
├── .claude-plugin/
│   └── marketplace.json     # Claude Code marketplace config
├── .claude/
│   └── rules/               # Agent rules
├── packages/
│   └── plugins/             # Claude Code plugins
│       └── pendle-v2/       # Pendle V2 DeFi protocol plugin
├── evals/                   # AI tool evaluations (Promptfoo)
│   ├── scripts/             # Custom providers and utilities
│   ├── rubrics/             # Shared evaluation rubrics
│   ├── suites/              # Per-skill eval suites
│   └── templates/           # Templates for new suites
├── scripts/                 # Build/validation scripts
├── turbo.json               # Turborepo pipeline config
├── biome.json               # Biome linter/formatter config
├── package.json
├── tsconfig.base.json
├── CLAUDE.md                # This file
├── AGENTS.md -> CLAUDE.md   # Symlink for agent-agnostic access
└── README.md
```

### Plugin Architecture

Plugins are stored in `./packages/plugins/<plugin-name>/`:

- Each plugin is a self-contained workspace package with `package.json` and `.claude-plugin/plugin.json`
- The `.claude-plugin/marketplace.json` references plugins via relative paths
- Plugin validation: `node scripts/validate-plugin.cjs packages/plugins/<plugin-name>`

### Plugin Versioning

All plugins follow semantic versioning (semver):

- **Patch (1.0.X)**: Bug fixes, minor documentation updates
- **Minor (1.X.0)**: New skills, agents, or commands (backward compatible)
- **Major (X.0.0)**: Breaking changes, significant restructuring

After making any changes to `packages/plugins/`, bump the plugin version in `.claude-plugin/plugin.json`.

## Agent-Agnostic Design

All AI tools in this repo should be usable by ANY LLM coding agent, not just Claude Code:

1. **Documentation**: Use AGENTS.md (symlink to CLAUDE.md) as standard
2. **Prompts**: Write prompts that work across models
3. **Skills**: Structure skills as markdown that any agent can interpret
4. **No vendor lock-in**: Prefer standards over proprietary features
5. **Testing**: Evals should work with multiple LLM backends

## Testing Policy

- When running tests: **only run tests, do NOT auto-fix bugs**.
- If a test fails or a bug is found, **raise it to the user** and let them decide how to fix.
- Do not silently patch code to make tests pass.
- **Do NOT tolerate 429 errors** in tests. A 429 is a test failure — surface it immediately.

## Approvals

- **`requiredApprovals` doesn't lie.** If the API returns empty `requiredApprovals`, the on-chain allowance IS sufficient. Do NOT auto-approve tokens beyond what `requiredApprovals` says.
- If a tx fails due to allowance when `requiredApprovals` was empty, **report it as a bug**.

## Limit Orders

- `TOKEN_FOR_PT` / `TOKEN_FOR_YT` order types accept the same tokens as the market's `tokensIn`
- `PT_FOR_TOKEN` / `YT_FOR_TOKEN` order types accept the same tokens as the market's `tokensOut`
- Limit orders can be denominated in any valid market token (not just SY)

## Secrets & API Keys

- **NEVER print API keys, private keys, or secrets** in documentation, code comments, commit messages, or PR descriptions.
- API keys live in `.env` files only (gitignored). Reference them by variable name (e.g. `PENDLE_API_KEY`), never by value.

## Evals Framework

Evals are to AI tools what tests are to traditional code. This project uses [Promptfoo](https://github.com/promptfoo/promptfoo) for declarative, CI-integrated evaluations.

### Structure

```text
evals/
├── promptfoo.yaml          # Root config with default providers
├── rubrics/                # Shared evaluation rubrics
├── scripts/
│   └── anthropic-provider.ts  # Custom provider for OAuth support
├── suites/                 # Per-skill eval suites
│   └── <skill-name>/
│       └── promptfoo.yaml  # Suite-specific config
└── templates/              # Templates for new suites
```

### Running Evals

```bash
turbo run eval                                    # Run all eval suites
turbo run eval --filter=@pendle-ai/eval-suite-pendle-swap  # Run specific suite
```

### Turborepo Caching

Each eval suite is its own workspace package (`@pendle-ai/eval-suite-<name>`) with an `eval` script. Turborepo tracks inputs (skill files, eval scripts, promptfoo config) and caches `results.json`. When inputs haven't changed, Turbo restores the cached result without making LLM API calls.

## Node Version Requirement

**CRITICAL: This project requires Node.js >= 22**

```bash
node --version  # Should output: v22.x.x or higher
```
