# Architecture

A short tour of why `figma-cli` exists, how it's wired, and the patterns it follows. For build/run instructions see [DEVELOPMENT.md](./DEVELOPMENT.md); for command details see [COMMANDS.md](./COMMANDS.md).

## Why this exists

The official [Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559) is great, but in many organizations MCP servers not on a central registry are blocked for security reasons, and Figma's MCP is increasingly tied to paid Dev Mode. We hit the same problem with Atlassian and solved it by building [atlassian-cli](https://github.com/sahajamit/atlassian-cli); this is the same pattern for Figma.

`figma` is a plain CLI binary that any AI agent invokes via shell commands. Combined with skill files (markdown that teach agents the command syntax), this gives:

| | MCP Server | CLI + Skills |
|---|---|---|
| **Token cost** | ~3,000+ tokens for tool schemas per turn | ~200 tokens per skill file, loaded on demand |
| **Setup** | Start server process, configure transport | Set env var, `npm install -g`, `figma install --skills` |
| **Latency** | Server init + JSON-RPC overhead | Direct process spawn (~50ms) |
| **Tool selection** | Agent picks from all tools at once | Agent reads relevant skill file only |
| **Security** | Needs MCP registry approval | Just a CLI binary, no server |
| **Debugging** | Inspect MCP messages | Run the same CLI command in your terminal |

The key insight: **an agent doesn't need a protocol to call a CLI** — it just runs a shell command and reads the output.

## Tech stack

- **Language:** TypeScript (ES2022, NodeNext modules, `strict: true`)
- **Runtime:** Node.js ≥ 22 (uses native `fetch`, no HTTP library)
- **CLI framework:** [Commander.js](https://github.com/tj/commander.js)
- **Output styling:** [chalk](https://github.com/chalk/chalk)
- **Design tokens:** Custom W3C extractor (ported from `figma-mcp-free`)
- **Test framework:** None yet — manual smoke tests against a real `FIGMA_TOKEN`

## Source layout

```
figma-cli/
├── bin/
│   └── figma.ts                  # CLI entry point, commander setup
├── src/
│   ├── config.ts                 # FIGMA_TOKEN env var loader
│   ├── http.ts                   # HTTP client (native fetch, X-Figma-Token, file download)
│   ├── output.ts                 # JSON vs human-readable, TTY auto-detect
│   ├── errors.ts                 # CliError, ConfigError, ApiError
│   ├── installer.ts              # Skill file installer for AI agents
│   ├── types/
│   │   └── figma.ts              # All Figma domain types
│   ├── tokens/
│   │   └── extract.ts            # Design token extraction (W3C format)
│   ├── clients/
│   │   └── figma.ts              # Figma REST API client
│   ├── commands/
│   │   ├── me.ts
│   │   ├── files/                # get, nodes, frames
│   │   ├── images/               # export
│   │   ├── components/           # list, search, team
│   │   ├── styles/               # list, team
│   │   ├── variables/            # list
│   │   ├── comments/             # list, add
│   │   ├── versions/             # list
│   │   ├── projects/             # list, files
│   │   └── tokens/               # export
│   └── skills/
│       ├── figma/SKILL.md        # parent skill (routing + overview)
│       ├── figma-files/SKILL.md  # file/image/comment/version/project commands
│       └── figma-design/SKILL.md # component/style/variable/token commands
├── docs/
└── package.json
```

## Key patterns

- **Auth.** Personal Access Token via the `X-Figma-Token` header. Token is read once from `process.env.FIGMA_TOKEN` (`src/config.ts`) and never logged, never put in URLs, never persisted.
- **Read-only API.** The Figma REST API can't create or edit design content. The only write operation in this CLI is `comments add`.
- **Two-step image export.** First call `/v1/images/:key` to get temporary S3 URLs, then download each URL to a local file. Node ID colons (`1:2`) become hyphens (`1-2`) in filenames.
- **Design token extraction.** `src/tokens/extract.ts` walks the Figma document tree and emits W3C-format tokens (colors, spacing, sizes, typography, shadows). Ported from [figma-mcp-free](https://github.com/superdoccimo/figma-mcp-free).
- **Output mode.** `src/output.ts` auto-detects TTY: human-readable tables when stdout is a terminal, JSON when piped. `--json` forces JSON.
- **Factory pattern.** `createHttpClient()`, `createFigmaClient()` — no classes, just functions returning objects.
- **Error hierarchy.** `CliError` base → `ConfigError` (missing token) and `ApiError` (HTTP failures). Rate limiting (429) surfaced clearly.
- **Common command flow:**

  ```
  loadConfig() → createHttpClient() → createFigmaClient() → detectOutputMode()
              → client.method() → output(result, formatHuman, ctx)
  ```

## Skill installer

Three modular skill files live under `src/skills/` and are bundled into the published npm package:

| Skill | Scope |
|-------|-------|
| `figma` | Parent skill — routing + overview |
| `figma-files` | File, image, comment, version, project commands |
| `figma-design` | Component, style, variable, design-token commands |

`figma install --skills` copies them into:

| Target | Path | When |
|--------|------|------|
| Claude Code | `~/.claude/skills/<skill>/SKILL.md` | always |
| Cursor | `~/.cursor/rules/<skill>.md` | only if `~/.cursor/rules` exists |
| Copilot (standalone) | `~/.copilot/skills/<skill>/SKILL.md` | always |
| GitHub Copilot | `.github/copilot-instructions.md` | only when run from a repo with `.github/` |

The package has no `postinstall` hook — `npm install -g @sahajamit/figma-cli` is silent and never writes to your home directory. Skill files only land on disk when the user explicitly runs `figma install --skills`.

## Reference projects

- **[atlassian-cli](https://github.com/sahajamit/atlassian-cli)** — same architecture, applied to Jira/Confluence.
- **[figma-mcp-free](https://github.com/superdoccimo/figma-mcp-free)** — community MCP server; the W3C design-token extractor in `src/tokens/extract.ts` is ported from here.
- **[Figma REST API docs](https://developers.figma.com/docs/rest-api/)**
- **[Figma OpenAPI spec](https://github.com/figma/rest-api-spec)**
