# figma — Figma CLI

[![npm version](https://img.shields.io/npm/v/@sahajamit/figma-cli.svg)](https://www.npmjs.com/package/@sahajamit/figma-cli)
[![license](https://img.shields.io/npm/l/@sahajamit/figma-cli.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/@sahajamit/figma-cli.svg)](https://nodejs.org)

A lightweight Node.js CLI for the Figma REST API. Read designs, export images, browse components, extract design tokens — all from your terminal.

Built as a faster, leaner alternative to MCP servers for letting AI agents (like Claude Code, Cursor, Copilot) interact with Figma designs.

📦 **npm:** https://www.npmjs.com/package/@sahajamit/figma-cli

### Install

```bash
npm install -g @sahajamit/figma-cli
```

Then jump to [Quick Start](#quick-start) to set your token and verify, or skim [Why We Built This](#why-we-built-this) and [Beyond Plain Metadata](#beyond-plain-metadata) first.

---

## Why We Built This

### The Problem with MCP

The official [Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559) is a great piece of work — but in many organizations, MCP servers not on a central registry are blocked for security reasons, and Figma's MCP is increasingly tied to paid Dev Mode. Even when those barriers don't apply, MCP comes with its own overhead:

1. **Token overhead.** Every MCP call includes the full tool schema in the conversation context. With dozens of tools, that's thousands of tokens spent just describing what's available — before any actual work happens. On long conversations, this adds up fast.

2. **Server lifecycle.** MCP requires a running server process. You need to start it, keep it alive, handle crashes, manage configuration. It's another moving part in your development setup.

3. **Cold start latency.** The MCP server has to initialize, load dependencies, and establish a connection before the first call. That's seconds added to every fresh session.

4. **All-or-nothing tool loading.** MCP sends every tool definition to the agent upfront. Even if you only need to export a frame as PNG, the agent sees every Figma tool and has to reason about which one to use. This dilutes focus and wastes context.

### The CLI + Skills Approach

`figma` takes a different approach: it's a plain CLI binary that AI agents invoke directly via shell commands. Combined with skill files (markdown files that teach the agent how to use each command), this gives you:

| | MCP Server | CLI + Skills |
|---|---|---|
| **Token cost** | ~3,000+ tokens for tool schemas per turn | ~200 tokens per skill file, loaded on demand |
| **Setup** | Start server process, configure transport | Set `FIGMA_TOKEN`, `npm install -g`, `figma install --skills` |
| **Latency** | Server init + JSON-RPC overhead | Direct process spawn (~50ms) |
| **Tool selection** | Agent picks from all tools at once | Agent reads relevant skill file only |
| **Security** | Needs MCP registry approval | Just a CLI binary, no server |
| **Debugging** | Inspect MCP messages | Run the same CLI command in your terminal |

The key insight: **an agent doesn't need a protocol to call a CLI.** It just runs a shell command and reads the output. Skill files teach it the command syntax and output schema — no runtime overhead, no server process, no token bloat.

### When to Use MCP Instead

MCP still makes sense when:
- You need **bi-directional communication** (server pushing updates to the agent)
- You're building a **multi-tenant SaaS** with OAuth per user
- You need **full Dev Mode** integration and are paying for it
- Your agent framework **only supports MCP** (no shell access)

For the common case — a developer using an AI agent to read designs, export visuals, and pull design tokens — the CLI is simpler and cheaper.

---

## Beyond Plain Metadata

Most "Figma to text" tools just return the document JSON and stop there. `figma` does two things differently that turn out to matter a lot for AI workflows:

### Multimodal — agents can *see* the design

A frame's metadata is rarely enough. A `Hero Section` frame with width/height and a list of children doesn't tell an agent what the section actually looks like — what the visual hierarchy is, what the call-to-action says, what colors carry the brand.

`figma` treats rendered visuals as first-class output:

- `figma images export` calls the Figma image-export endpoint, downloads the temporary S3 URLs, and writes PNG / SVG / JPG / PDF files locally — in one command.
- The bundled skill files explicitly instruct vision-capable AI agents (Claude, Cursor, Copilot) to export frames as PNG, **then read them with vision** before answering. The synthesized answer combines layout text *and* visual content.

So a question like *"build a React component that matches the hero on this design"* doesn't fail because the agent only saw `frameName: "Hero"` and a bounding box.

```bash
# Agent flow (this is what the skill file tells the agent to do)
figma files frames ABC123xyz --json                                  # find the frame
figma images export ABC123xyz --ids 1:2 --format png --output-dir .  # render it
# → agent reads ./1-2.png with vision, then writes the component
```

### Design tokens in W3C format — directly usable

Designers store color, spacing, typography, and shadow values in styles and variables. A code-generating agent that has to *guess* these values from screenshots will get them wrong. `figma tokens export` traverses the document tree and emits a [W3C Design Tokens Community Group](https://design-tokens.github.io/community-group/format/) JSON document:

| Token type | Source | Output shape |
|---|---|---|
| **Colors** | `FILL` styles + solid paints | `{ value: "#3b82f6", type: "color" }` |
| **Spacing** | Auto-layout padding values | `{ value: 16, type: "spacing" }` |
| **Sizes** | Frame dimensions | `{ value: 1440, type: "dimension" }` |
| **Typography** | `TEXT` styles | `{ value: { fontFamily, fontSize, fontWeight, lineHeight } }` |
| **Shadows** | Drop / inner shadow effects | `{ value: "0px 4px 6px 0px #0000001a" }` |

Agents can pipe this straight into Style Dictionary, Tailwind config, CSS custom properties, or any design-token-aware build pipeline:

```bash
figma tokens export ABC123xyz --json > tokens.json
# → agent feeds tokens.json into the next step of the build
```

For Figma's own native variables (color/spacing tokens defined inside Figma rather than inferred from styles), use `figma variables list <key>` — it requires the `file_variables:read` scope on your token.

---

## Quick Start

### Prerequisites

- Node.js 22+
- A Figma Personal Access Token

### Install

```bash
npm install -g @sahajamit/figma-cli
```

Or run without installing:

```bash
npx @sahajamit/figma-cli --help
```

### Configure

```bash
export FIGMA_TOKEN=your_personal_access_token
```

Generate a token at [Figma → Settings → Personal Access Tokens](https://www.figma.com/developers/api#access-tokens). Free to create — no paid plan required.

The **file key** is the ID in any Figma file URL: `https://www.figma.com/design/`**`ABC123xyz`**`/My-Design`. Node IDs (like `1:2`) come from Figma's "Copy link" or `figma files get`.

### Install AI Agent Skills (optional)

```bash
figma install --skills    # Install skill files for Claude Code, Cursor, Copilot
```

This installs three skill files that teach AI agents how to use `figma`:
- **`figma`** — parent skill (routing + overview)
- **`figma-files`** — file, image, comment, version, and project commands
- **`figma-design`** — component, style, variable, and design-token commands

Agents load only the relevant skill file, keeping token usage minimal.

> Skill files are **not** auto-installed on `npm install`. You opt in by running `figma install --skills`. To remove them later: `figma uninstall --skills`.

### Verify

```bash
figma me
figma files frames ABC123xyz
```

---

## Commands

### Files & Images

| Command | Purpose |
|---------|---------|
| `figma files get <key>` | File structure and metadata |
| `figma files nodes <key> --ids ...` | Specific nodes by ID |
| `figma files frames <key>` | List all frames |
| `figma images export <key> --ids ...` | Export as PNG / SVG / JPG / PDF |

### Design System

| Command | Purpose |
|---------|---------|
| `figma components list <key>` | List components in a file |
| `figma components search <key> -q ...` | Search components by name |
| `figma components team <team-id>` | Published team components |
| `figma styles list <key>` | List styles in a file |
| `figma styles team <team-id>` | Published team styles |
| `figma variables list <key>` | Local variables (native Figma tokens) |
| `figma tokens export <key>` | Extract W3C design tokens |

### Collaboration & Org

| Command | Purpose |
|---------|---------|
| `figma me` | Current user info (verify token) |
| `figma comments list <key>` | List comments |
| `figma comments add <key> <msg>` | Add a comment (the only write op) |
| `figma versions list <key>` | Version history |
| `figma projects list <team-id>` | Team projects |
| `figma projects files <project-id>` | Files in a project |

Run `figma <command> --help` for full options on any command. Detailed examples and JSON output schemas are in [docs/COMMANDS.md](./docs/COMMANDS.md) and the [skill files](./src/skills/figma-files/SKILL.md) shipped with the package.

---

## Output Modes

The CLI has two output modes:

| Mode | When | Format |
|------|------|--------|
| **Human** | stdout is a terminal (TTY) | Colored tables and formatted text |
| **JSON** | stdout is piped (non-TTY) | Structured JSON |

This means agents automatically get JSON without any flags:

```bash
# Agent runs this — gets JSON because stdout is piped
result=$(figma files get ABC123xyz --depth 1)

# Human runs the same command — gets a colored table
figma files get ABC123xyz --depth 1

# Force JSON in terminal
figma files get ABC123xyz --depth 1 --json
```

---

## Image Export

The flow is two steps under the hood, but `figma images export` does both in one command:

1. Call the Figma image endpoint (`/v1/images/<key>`) to get **temporary, pre-signed S3 URLs** for each requested node.
2. Download each URL to a local file. Node ID colons (`1:2`) are replaced with hyphens (`1-2`) in the filename.

| Flag | Default | Description |
|------|---------|-------------|
| `--ids <ids>` | **(required)** | Comma-separated node IDs |
| `-f, --format <fmt>` | `png` | `png`, `svg`, `jpg`, or `pdf` |
| `-s, --scale <n>` | `1` | Scale factor (0.01 to 4) |
| `-o, --output-dir <dir>` | `.` | Output directory |

```bash
# 4× scale PNG of a single hero frame
figma images export ABC123xyz --ids 1:2 --format png --scale 4 --output-dir ./renders

# Multiple frames as SVG
figma images export ABC123xyz --ids 1:2,3:4,5:6 --format svg
```

> The pre-signed URLs Figma returns expire after ~14 days. The CLI downloads them immediately, so you don't need to worry about it for normal usage.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FIGMA_TOKEN` | Yes | Personal access token sent as the `X-Figma-Token` header |

Generate at [Figma → Settings → Personal Access Tokens](https://www.figma.com/developers/api#access-tokens). The token needs:

- **`file_content:read`** (default scope) — for everything except variables
- **`file_variables:read`** (separate scope) — only required for `figma variables list`

The token is read once at startup and never logged, never put in URLs, never persisted.

---

## AI Agent Integration

Install skill files so AI agents know how to use `figma`:

```bash
figma install --skills    # Install for Claude Code, Cursor, Copilot
figma uninstall --skills  # Remove skill files
```

This installs three modular skill files:

| Skill | Scope | Installed to |
|-------|-------|-------------|
| `figma` | Routing + overview | `~/.claude/skills/figma/SKILL.md` |
| `figma-files` | File, image, comment, version, project commands | `~/.claude/skills/figma-files/SKILL.md` |
| `figma-design` | Component, style, variable, token commands | `~/.claude/skills/figma-design/SKILL.md` |

The same files are installed under `~/.cursor/rules/` (if Cursor is set up) and `~/.copilot/skills/`. Run from a git repo root to also append to `.github/copilot-instructions.md`.

Agents load only the relevant skill (files vs. design system) on demand, not all commands at once.

### How it works

1. Agent sees a Figma-related request, loads the `figma-files` skill
2. Agent runs `figma files get ABC123xyz --depth 1 --json`
3. CLI returns JSON (auto-detected because stdout is piped)
4. Agent parses the JSON and continues reasoning

This is typically **5-10× cheaper in tokens** than the equivalent MCP flow, because:
- Only the relevant skill schema is loaded (not every Figma tool)
- No MCP protocol overhead (tool registration, JSON-RPC framing)
- The output is the same structured JSON either way

### Example: agent exports a design for implementation

```bash
# 1. Get file overview
figma files get ABC123xyz --depth 1 --json

# 2. List all frames
figma files frames ABC123xyz --json

# 3. Export the hero section as PNG for visual reference
figma images export ABC123xyz --ids 1:2 --format png --output-dir ./design --json

# 4. Get the node details for code generation
figma files nodes ABC123xyz --ids 1:2 --json

# 5. Extract design tokens
figma tokens export ABC123xyz --json > tokens.json
```

---

## Limitations

- **Read-only** for design content. The Figma REST API cannot create, edit, or move design elements. The only write operation is `comments add`.
- **Image export URLs are temporary.** Figma returns pre-signed S3 URLs that expire after ~14 days. The CLI downloads them immediately.
- **Rate limiting.** Figma's API has rate limits. If you hit a 429, wait a moment and retry.
- **Variables API** requires the `file_variables:read` scope on your token.

---

## Contributing / Local Development

To build from source, run smoke tests, or add new commands, see [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md). Architecture and design notes live in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md), and the full per-command reference is in [`docs/COMMANDS.md`](./docs/COMMANDS.md).

Bug reports and feature requests are welcome at [GitHub Issues](https://github.com/sahajamit/figma-cli/issues).

---

## License

MIT — see [LICENSE](./LICENSE).

---

## Credits

- Architecture pattern from [atlassian-cli](https://github.com/sahajamit/atlassian-cli) — same CLI + Skills approach, applied to Atlassian.
- W3C design-token extraction in `src/tokens/extract.ts` is ported from [figma-mcp-free](https://github.com/superdoccimo/figma-mcp-free).
- Built on the [Figma REST API](https://developers.figma.com/docs/rest-api/).
