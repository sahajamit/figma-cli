# figma — Figma CLI

A lightweight Node.js CLI for the Figma REST API. Read designs, export images, browse components, extract design tokens — all from your terminal, and from any AI agent that can run a shell command.

[![npm version](https://img.shields.io/npm/v/@sahajamit/figma-cli.svg)](https://www.npmjs.com/package/@sahajamit/figma-cli)
[![license](https://img.shields.io/npm/l/@sahajamit/figma-cli.svg)](./LICENSE)

> **npm:** [@sahajamit/figma-cli](https://www.npmjs.com/package/@sahajamit/figma-cli)

---

## Why

The official Figma MCP server is great, but in many organizations MCP servers off the central registry are blocked, and Figma's MCP is increasingly tied to paid Dev Mode. `figma` is a plain CLI binary that any AI agent invokes via shell commands. Combined with on-demand skill files, it gives an agent the same capability without the MCP token cost, server overhead, or registry approval. See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the full rationale.

## Install

Requires Node.js ≥ 22.

```bash
npm install -g @sahajamit/figma-cli
export FIGMA_TOKEN=your_personal_access_token   # generate at https://www.figma.com/developers/api#access-tokens
figma me                                        # verify the token works
```

## Quick start

The **file key** is the ID in any Figma file URL: `https://www.figma.com/design/`**`ABC123xyz`**`/My-Design`.

```bash
# List every frame in a file
figma files frames ABC123xyz

# Export specific frames as PNG
figma images export ABC123xyz --ids 1:2,3:4 --format png --output-dir ./design

# Extract design tokens in W3C format
figma tokens export ABC123xyz --json > tokens.json
```

Output is colored tables in a terminal and JSON when piped — agents automatically get JSON. Force JSON with `--json`.

## Commands

| Command | Description |
|---------|-------------|
| `figma me` | Current user info (verify token) |
| `figma files get <key>` | File structure and metadata |
| `figma files nodes <key> --ids ...` | Specific nodes by ID |
| `figma files frames <key>` | List all frames |
| `figma images export <key> --ids ...` | Export as PNG / SVG / JPG / PDF |
| `figma components list <key>` | List components in a file |
| `figma components search <key> -q ...` | Search components by name |
| `figma components team <team-id>` | Published team components |
| `figma styles list <key>` | List styles in a file |
| `figma styles team <team-id>` | Published team styles |
| `figma variables list <key>` | Local variables (native Figma tokens) |
| `figma tokens export <key>` | Extract W3C design tokens |
| `figma comments list <key>` | List comments |
| `figma comments add <key> <msg>` | Add a comment (the only write op) |
| `figma versions list <key>` | Version history |
| `figma projects list <team-id>` | Team projects |
| `figma projects files <project-id>` | Files in a project |

Full flags, examples, and output samples for every command live in **[docs/COMMANDS.md](./docs/COMMANDS.md)**.

## AI agent integration

`figma` ships skill files for Claude Code, Cursor, and GitHub Copilot. Install them once:

```bash
figma install --skills      # install skill files
figma uninstall --skills    # remove them
```

Targets:

| Target | Path | When |
|--------|------|------|
| Claude Code | `~/.claude/skills/<skill>/SKILL.md` | always |
| Cursor | `~/.cursor/rules/<skill>.md` | only if `~/.cursor/rules` exists |
| Copilot (standalone) | `~/.copilot/skills/<skill>/SKILL.md` | always |
| GitHub Copilot | `.github/copilot-instructions.md` | only when run from a repo with `.github/` |

Skill files are installed only on demand — `npm install -g @sahajamit/figma-cli` does not touch your home directory.

## Limitations

- **Read-only** for design content — the Figma REST API can't create, edit, or move design elements. The only write operation is `comments add`.
- **Image export URLs are temporary.** Figma returns pre-signed S3 URLs that expire after ~14 days. The CLI downloads them immediately.
- **Rate limiting.** Figma's API has rate limits. If you hit a 429, wait a moment and retry.
- **Variables API** requires `file_variables:read` scope on your token.

## Documentation

- **[docs/COMMANDS.md](./docs/COMMANDS.md)** — full per-command reference with flags and examples
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — design rationale, source layout, key patterns
- **[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)** — building from source, contributing, smoke testing
- **[docs/RESEARCH.md](./docs/RESEARCH.md)** — original research notes on the Figma API and CLI design

## License & credits

MIT — see [LICENSE](./LICENSE).

- Architecture pattern from [atlassian-cli](https://github.com/sahajamit/atlassian-cli).
- W3C design-token extraction in `src/tokens/extract.ts` is ported from [figma-mcp-free](https://github.com/superdoccimo/figma-mcp-free).
- Built on the [Figma REST API](https://developers.figma.com/docs/rest-api/).
