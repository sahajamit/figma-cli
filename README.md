# figma — Figma CLI

A lightweight Node.js CLI for the Figma REST API. Read designs, export images, browse components, extract design tokens — all from your terminal.

Built as a faster, leaner alternative to MCP servers for letting AI agents (like Claude Code) interact with Figma designs.

---

## Why We Built This

### The Problem with MCP

The official [Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559) is great — but in many organizations, MCP servers not listed in a central registry are blocked for security reasons. Figma's MCP is also becoming a paid feature tied to Dev Mode.

We hit the same problem with Atlassian, and solved it by building [atlassian-cli](https://github.com/sahajamit/atlassian-cli). This is the same pattern for Figma.

### The CLI + Skills Approach

`figma` is a plain CLI binary that any AI agent invokes via shell commands. Combined with skill files (markdown that teach agents the command syntax), this gives you:

| | MCP Server | CLI + Skills |
|---|---|---|
| **Token cost** | ~3,000+ tokens for tool schemas per turn | ~200 tokens per skill file, loaded on demand |
| **Setup** | Start server process, configure transport | Set env var, `npm link`, `figma install --skills` |
| **Latency** | Server init + JSON-RPC overhead | Direct process spawn (~50ms) |
| **Tool selection** | Agent picks from all tools at once | Agent reads relevant skill file only |
| **Security** | Needs MCP registry approval | Just a CLI binary, no server |
| **Debugging** | Inspect MCP messages | Run the same CLI command in your terminal |

The key insight: **an agent doesn't need a protocol to call a CLI.** It just runs a shell command and reads the output.

---

## Quick Start

### Prerequisites

- Node.js 22+
- A Figma Personal Access Token

### Install

```bash
git clone https://github.com/sahajamit/figma-cli.git && cd figma-cli
npm install
npm run build
npm link    # makes `figma` available globally
```

### Configure

```bash
export FIGMA_TOKEN=your_personal_access_token
```

Generate a token at [Figma → Settings → Personal Access Tokens](https://www.figma.com/developers/api#access-tokens). Free to create, no paid plan required.

### Install AI Agent Skills (optional)

```bash
figma install --skills    # Install skill files for Claude Code, Cursor, Copilot
```

### Verify

```bash
figma me
```

---

## Finding Your File Key

Every Figma command needs a **file key** — the ID in the URL of any Figma file:

```
https://www.figma.com/design/ABC123xyz/My-Design
                              ^^^^^^^^^
                              this is the file key
```

Node IDs (like `1:2`, `3:4`) are found in Figma's "Copy link" or via `figma files get`.

---

## Commands

### `figma me`

Verify your token and see your account info.

```bash
figma me
```

```
Figma User

  Handle:  John Doe
  Email:   john@example.com
  ID:      123456789
```

---

### File Operations

#### `figma files get <file-key>`

Get the structure and metadata of a Figma file.

```bash
# Overview (shallow, fast)
figma files get ABC123xyz --depth 1

# Full file tree
figma files get ABC123xyz

# Specific version
figma files get ABC123xyz --version 123456
```

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `-d, --depth <n>` | all | Depth of node tree (1 = pages only, 2 = pages + top-level frames) |
| `-v, --version <id>` | latest | Specific file version |
| `--geometry <paths>` | — | Include vector path data |
| `--json` | auto | Force JSON output |

**Output (human):**
```
My Design File
  Last modified: 2024-06-15T10:30:00Z
  Version: 123456

Pages (3):
Name           ID    Children  Total Nodes
─────────────  ────  ────────  ───────────
Home           1:2   12        145
Components     3:4   8         89
Icons          5:6   24        72
```

---

#### `figma files nodes <file-key>`

Get specific nodes by ID. Useful for getting details of a particular frame or component.

```bash
figma files nodes ABC123xyz --ids 1:2,3:4
```

---

#### `figma files frames <file-key>`

List all frames in a file (useful for finding what to export).

```bash
figma files frames ABC123xyz
```

```
Found 12 frame(s)

Name              ID     Dimensions
────────────────  ─────  ──────────
Hero Section      1:2    1440x900
Navigation Bar    3:4    1440x72
Footer            5:6    1440x300
Login Modal       7:8    480x560
```

---

### Image Export

#### `figma images export <file-key>`

Export frames or components as images. This is the big one — get visual output from any Figma design.

```bash
# Export specific frames as PNG
figma images export ABC123xyz --ids 1:2,3:4 --format png

# High-res SVG export
figma images export ABC123xyz --ids 1:2 --format svg --scale 2

# Save to a specific folder
figma images export ABC123xyz --ids 1:2,3:4,5:6 --format png --output-dir ./design-exports
```

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `--ids <ids>` | **(required)** | Comma-separated node IDs |
| `-f, --format <fmt>` | `png` | `png`, `svg`, `jpg`, or `pdf` |
| `-s, --scale <n>` | `1` | Scale factor (0.01 to 4) |
| `-o, --output-dir <dir>` | `.` | Output directory |
| `--json` | auto | Force JSON output |

**Output (human):**
```
Exported 3 image(s) to ./design-exports

  ✓  1:2 → ./design-exports/1-2.png
  ✓  3:4 → ./design-exports/3-4.png
  ✓  5:6 → ./design-exports/5-6.png
```

**How it works:** Figma's API returns temporary S3 URLs for rendered images. The CLI downloads each one to a local file. Node ID colons are replaced with hyphens in filenames (e.g., `1:2` → `1-2.png`).

---

### Components

#### `figma components list <file-key>`

List all components in a file.

```bash
figma components list ABC123xyz
```

```
Found 8 component(s)

Name               Node ID  Description
─────────────────  ───────  ─────────────────────────
Button/Primary     10:2     Primary action button
Button/Secondary   10:3     Secondary action button
Input/Text         10:5     Standard text input
Card/Default       10:8     Content card with shadow
```

---

#### `figma components search <file-key>`

Search components by name (case-insensitive).

```bash
figma components search ABC123xyz --query Button
```

---

#### `figma components team <team-id>`

List published components from your team's design system library.

```bash
figma components team 123456789
```

---

### Styles

#### `figma styles list <file-key>`

List all styles (colors, text styles, effects, grids) in a file.

```bash
figma styles list ABC123xyz
```

```
Found 12 style(s)

Name              Type  Node ID  Description
────────────────  ────  ───────  ──────────────
Primary/500       FILL  1:10     Brand primary color
Heading/H1        TEXT  1:20     Page headings
Shadow/Card       EFFECT  1:30   Card elevation
```

---

#### `figma styles team <team-id>`

List published team styles.

```bash
figma styles team 123456789
```

---

### Variables (Design Tokens)

#### `figma variables list <file-key>`

List local variables (Figma's native design tokens).

```bash
figma variables list ABC123xyz
```

```
2 collection(s), 15 variable(s)

Colors
  Modes: Light, Dark
  primary (COLOR)
  secondary (COLOR)
  background (COLOR)

Spacing
  Modes: Default
  sm (FLOAT) — Small spacing
  md (FLOAT) — Medium spacing
  lg (FLOAT) — Large spacing
```

> **Note:** Requires `file_variables:read` scope on your token.

---

### Design Tokens (W3C Format)

#### `figma tokens export <file-key>`

Extract design tokens from a file's node tree in [W3C Design Tokens Community Group](https://design-tokens.github.io/community-group/format/) format. Extracts colors, spacing, sizes, typography, and shadows by traversing the document.

```bash
# Summary
figma tokens export ABC123xyz

# Full W3C JSON (pipe to file)
figma tokens export ABC123xyz --json > tokens.json
```

**Output (human):**
```
Design Tokens (W3C format)

  24 colors, 8 spacing, 12 sizes, 6 typography, 3 shadows

Use --json to get the full W3C Design Tokens JSON.
```

**Output (JSON):**
```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/module.v1.json",
  "color": {
    "primary/500": { "value": "#3b82f6", "type": "color" }
  },
  "spacing": {
    "card-padding-top": { "value": 16, "type": "spacing" }
  },
  "typography": {
    "heading/h1": {
      "value": { "fontFamily": "Inter", "fontSize": 32, "fontWeight": 700, "lineHeight": 40 }
    }
  },
  "shadow": {
    "card": { "value": "0px 4px 6px 0px #0000001a" }
  }
}
```

---

### Comments

#### `figma comments list <file-key>`

List comments on a file.

```bash
figma comments list ABC123xyz
```

---

#### `figma comments add <file-key> <message>`

Add a comment. Use `-` to read from stdin.

```bash
figma comments add ABC123xyz "Please review the header layout"
echo "Detailed feedback..." | figma comments add ABC123xyz -
```

---

### Version History

#### `figma versions list <file-key>`

```bash
figma versions list ABC123xyz
```

---

### Projects

#### `figma projects list <team-id>`

List projects in a team.

```bash
figma projects list 123456789
```

---

#### `figma projects files <project-id>`

List files in a project.

```bash
figma projects files 987654321
```

---

## Output Modes

The CLI has two output modes:

| Mode | When | Format |
|------|------|--------|
| **Human** | stdout is a terminal (TTY) | Colored tables and formatted text |
| **JSON** | stdout is piped (non-TTY) | Structured JSON |

This means agents automatically get JSON:

```bash
# Agent runs this — gets JSON because stdout is piped
result=$(figma files get ABC123xyz --depth 1)

# Human runs the same command — gets a colored table
figma files get ABC123xyz --depth 1

# Force JSON in terminal
figma files get ABC123xyz --depth 1 --json
```

---

## AI Agent Integration

Install skill files so AI agents know how to use `figma`:

```bash
figma install --skills      # Install for Claude Code, Cursor, Copilot
figma uninstall --skills    # Remove skill files
```

This installs three modular skill files:

| Skill | Scope | Installed to |
|-------|-------|-------------|
| `figma` | Routing + overview | `~/.claude/skills/figma/SKILL.md` |
| `figma-files` | File, image, comment, version, project commands | `~/.claude/skills/figma-files/SKILL.md` |
| `figma-design` | Component, style, variable, token commands | `~/.claude/skills/figma-design/SKILL.md` |

Agents load only the relevant skill on demand — no token bloat.

### How it works

1. Agent sees a Figma-related request, loads the `figma-files` skill
2. Agent runs `figma files get ABC123xyz --depth 1 --json`
3. CLI returns JSON (auto-detected because stdout is piped)
4. Agent parses the JSON and continues reasoning

### Example: AI agent exports a design for implementation

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

## Project Structure

```
figma-cli/
├── bin/
│   └── figma.ts                  # CLI entry point
├── src/
│   ├── config.ts                 # FIGMA_TOKEN env var loader
│   ├── http.ts                   # HTTP client (native fetch, X-Figma-Token auth)
│   ├── output.ts                 # JSON vs human-readable formatting
│   ├── errors.ts                 # Error classes (ConfigError, ApiError)
│   ├── installer.ts              # Skill file installer
│   ├── types/
│   │   └── figma.ts              # All Figma API types
│   ├── tokens/
│   │   └── extract.ts            # W3C design token extractor
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
│       ├── figma/SKILL.md
│       ├── figma-files/SKILL.md
│       └── figma-design/SKILL.md
├── package.json
└── tsconfig.json
```

---

## Command Reference

| Command | Description |
|---------|-------------|
| `figma me` | Current user info (verify token) |
| `figma files get <key>` | File structure and metadata |
| `figma files nodes <key> --ids ...` | Specific nodes by ID |
| `figma files frames <key>` | List all frames |
| `figma images export <key> --ids ...` | Export as PNG/SVG/JPG/PDF |
| `figma components list <key>` | List components |
| `figma components search <key> -q ...` | Search by name |
| `figma components team <team-id>` | Published team components |
| `figma styles list <key>` | List styles |
| `figma styles team <team-id>` | Published team styles |
| `figma variables list <key>` | Design tokens (native variables) |
| `figma tokens export <key>` | Extract W3C design tokens |
| `figma comments list <key>` | List comments |
| `figma comments add <key> <msg>` | Add a comment |
| `figma versions list <key>` | Version history |
| `figma projects list <team-id>` | Team projects |
| `figma projects files <project-id>` | Files in a project |
| `figma install --skills` | Install AI agent skills |
| `figma uninstall --skills` | Remove AI agent skills |

---

## Development Guide

Want to contribute or test locally? Here's how to get up and running without publishing to npm.

### First-Time Setup (Fresh Clone)

```bash
git clone https://github.com/sahajamit/figma-cli.git
cd figma-cli
npm install        # installs dependencies AND auto-builds (via `prepare` hook)
npm link           # makes `figma` available as a global command
```

That's it — two commands. `npm install` automatically compiles TypeScript into `dist/` and copies skill files, so you don't need a separate build step.

Verify it works:

```bash
figma --help       # should print the command list
```

### What Happens During `npm install`?

The project uses npm's [`prepare` lifecycle hook](https://docs.npmjs.com/cli/v10/using-npm/scripts#life-cycle-scripts) to auto-build:

```
npm install
  ├─ installs dependencies (chalk, commander, typescript, etc.)
  ├─ runs `postinstall` → installs AI agent skill files (if dist/ exists)
  └─ runs `prepare` → npm run build
       ├─ tsc (compiles TypeScript → dist/)
       ├─ chmod +x dist/bin/figma.js (makes the binary executable)
       └─ copy-skills (copies SKILL.md files into dist/)
```

This means `dist/` is always created after install — you never need to run `npm run build` manually on first setup.

### Development Workflow

After making code changes, you need to rebuild:

```bash
# Option 1: Manual rebuild after changes
npm run build
figma me

# Option 2: Watch mode (auto-recompile on save, recommended for development)
npm run dev         # runs tsc --watch — recompiles on every file save

# In another terminal, test your changes:
figma me
figma files get ABC123xyz --depth 1
```

> **Tip:** `npm run dev` only recompiles TypeScript. If you edit skill files (`src/skills/`), run `npm run build` to copy them into `dist/`.

### Run Without Global Link

If you don't want to `npm link`, you can always run the compiled CLI directly:

```bash
node dist/bin/figma.js me
node dist/bin/figma.js files get ABC123xyz --json
node dist/bin/figma.js images export ABC123xyz --ids 1:2 --format png
```

### Testing With a Real Figma Token

1. Go to [Figma → Settings → Personal Access Tokens](https://www.figma.com/developers/api#access-tokens)
2. Generate a token (free, no paid plan needed)
3. Export it:
   ```bash
   export FIGMA_TOKEN=figd_your_token_here
   ```
4. Test basic commands:
   ```bash
   figma me                                          # verify token works
   figma files get <your-file-key> --depth 1         # get a file overview
   figma files frames <your-file-key>                # list frames
   figma components list <your-file-key>             # list components
   figma images export <your-file-key> --ids <node-id> --format png  # export an image
   ```

### Adding a New Command

1. Add types to `src/types/figma.ts`
2. Add the API method in `src/clients/figma.ts`
3. Create the command file in `src/commands/<group>/<command>.ts` (copy an existing one as template)
4. Register it in `src/commands/<group>/index.ts`
5. If it's a new group, register the group in `bin/figma.ts`
6. Update skill files in `src/skills/`
7. Rebuild: `npm run build`

### Project Scripts

| Script | What it does |
|--------|-------------|
| `npm install` | Install deps + auto-build (creates `dist/`) |
| `npm run build` | Compile TypeScript + chmod +x + copy skill files to `dist/` |
| `npm run dev` | Watch mode — recompile TypeScript on file changes |
| `npm start` | Run `dist/bin/figma.js` directly |
| `npm link` | Make `figma` command available globally |
| `figma install --skills` | Install AI skill files to `~/.claude/`, `~/.copilot/`, etc. |
| `figma uninstall --skills` | Remove installed skill files |

---

## Limitations

- **Read-only** for design content. The Figma REST API cannot create, edit, or move design elements. The only write operation is `comments add`.
- **Image export URLs are temporary.** Figma returns pre-signed S3 URLs that expire after ~14 days. The CLI downloads them immediately.
- **Rate limiting.** Figma's API has rate limits. If you hit a 429, wait a moment and retry.
- **Variables API** requires `file_variables:read` scope on your token.

---

## Credits

- Architecture pattern from [atlassian-cli](https://github.com/sahajamit/atlassian-cli)
- Design token extraction ported from [figma-mcp-free](https://github.com/superdoccimo/figma-mcp-free)
- Figma REST API docs: https://developers.figma.com/docs/rest-api/
