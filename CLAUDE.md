# CLAUDE.md

## Project Overview

**figma-cli** (`figma`) is a TypeScript CLI for Figma that serves as a lightweight alternative to the official Figma MCP server (blocked by org MCP registry policy). It wraps the Figma REST API as shell commands, usable by any AI agent with shell access.

The CLI implements 16 commands across 10 command groups:

**File operations (3 commands):**
- `figma files get` — Get file structure and metadata
- `figma files nodes` — Get specific nodes by ID
- `figma files frames` — List all frames in a file

**Image export (1 command):**
- `figma images export` — Export nodes as PNG/SVG/JPG/PDF (two-step: get URLs → download files)

**Components (3 commands):**
- `figma components list` — List components in a file
- `figma components search` — Search components by name (client-side filter)
- `figma components team` — List published team components

**Styles (2 commands):**
- `figma styles list` — List styles in a file
- `figma styles team` — List published team styles

**Variables & Tokens (2 commands):**
- `figma variables list` — List local variables (native Figma variables)
- `figma tokens export` — Extract design tokens in W3C format (colors, spacing, sizes, typography, shadows)

**Collaboration (2 commands):**
- `figma comments list` — List comments on a file
- `figma comments add` — Add a comment (only write operation)

**Other (3 commands):**
- `figma me` — Current user info (verify token)
- `figma versions list` — Version history
- `figma projects list` / `figma projects files` — Team projects and files

**Utility:**
- `figma install --skills` — Install AI agent skill files (Claude Code, Cursor, Copilot)
- `figma uninstall --skills` — Remove installed skill files

## Tech Stack

- **Language:** TypeScript (ES2022, NodeNext modules, strict mode)
- **Runtime:** Node.js >= 22 (uses native `fetch`, no HTTP library)
- **CLI framework:** Commander.js
- **Output styling:** Chalk
- **Design tokens:** Custom W3C extractor (ported from figma-mcp-free)
- **No test framework yet**

## Build & Run

```bash
npm run build          # tsc → dist/ + copies skill files into dist
npm run dev            # tsc --watch (does NOT copy skills)
npm start              # node dist/bin/figma.js
node dist/bin/figma.js # direct invocation
npm link               # make `figma` available globally
```

Entry point: `bin/figma.ts` → compiles to `dist/bin/figma.js`

## Authentication

```bash
export FIGMA_TOKEN=your_personal_access_token
```

Generate at https://www.figma.com/developers/api#access-tokens. Passed as `X-Figma-Token` header. All design content is read-only via REST API.

## Project Structure

```
bin/figma.ts                      # CLI entry point, commander setup
src/
  config.ts                       # FIGMA_TOKEN env var loading
  http.ts                         # HTTP client (X-Figma-Token auth, file download, URL download)
  output.ts                       # JSON vs human-readable output (auto-detects TTY)
  errors.ts                       # CliError, ConfigError, ApiError
  installer.ts                    # Skill file installer for AI agents
  types/
    figma.ts                      # All Figma domain types
  tokens/
    extract.ts                    # Design token extraction (W3C format)
  clients/
    figma.ts                      # Figma API client (all REST methods)
  commands/
    me.ts                         # figma me
    files/                        # get, nodes, frames
    images/                       # export
    components/                   # list, search, team
    styles/                       # list, team
    variables/                    # list
    comments/                     # list, add
    versions/                     # list
    projects/                     # list, files
    tokens/                       # export
  skills/
    figma/SKILL.md                # Parent skill (routing + overview)
    figma-files/SKILL.md          # File/image/comment/version commands
    figma-design/SKILL.md         # Component/style/variable/token commands
```

## Key Architecture Patterns

- **Auth:** Personal Access Token via `X-Figma-Token` header. Simpler than atlassian-cli (no Cloud vs Server distinction).
- **API is read-only** for design content. Only write operation is `comments add`.
- **Image export is two-step:** First call `/v1/images/:key` to get temporary S3 URLs, then download each URL to local files. Node ID colons (`1:2`) are replaced with hyphens (`1-2`) in filenames.
- **Design token extraction** (`src/tokens/extract.ts`): Traverses the Figma document tree, extracting colors, spacing, sizes, typography, and shadows into W3C Design Tokens Community Group format. Ported from the figma-mcp-free community project.
- **Output mode:** Auto-detects TTY for human-readable tables vs JSON for piped output. `--json` flag forces JSON.
- **Factory pattern:** `createHttpClient()`, `createFigmaClient()` — no classes, just functions returning objects.
- **Error hierarchy:** `CliError` base → `ConfigError` (missing token) and `ApiError` (HTTP failures). Rate limiting (429) surfaced clearly.
- **Every command follows the same flow:** `loadConfig() → createHttpClient() → createFigmaClient() → detectOutputMode() → client.method() → output(result, formatHuman, ctx)`

## Adding New Commands

1. Add types to `src/types/figma.ts`
2. Add client method in `src/clients/figma.ts`
3. Create command file in `src/commands/<group>/<command>.ts`
4. Create `register<Command>` export function, register in `src/commands/<group>/index.ts`
5. If new group, register in `bin/figma.ts`
6. Update skill files in `src/skills/`

Follow existing patterns: use `output()` for display, `formatTable()` for human output, `detectOutputMode()` for JSON/TTY detection.

## Skill Installer (`figma install --skills` / `figma uninstall --skills`)

Three modular skill files:
- **`figma`** — parent skill (routing + overview)
- **`figma-files`** — file, image, comment, version, project commands
- **`figma-design`** — component, style, variable, design token commands

Targets: Claude Code (`~/.claude/skills/`), Cursor (`~/.cursor/rules/`), Copilot standalone (`~/.copilot/skills/`), GitHub Copilot (`.github/copilot-instructions.md`).

The package has no `postinstall` hook — `npm install -g @sahajamit/figma-cli` is silent and never writes to the home directory. Skill files only land on disk when the user explicitly runs `figma install --skills`. The install command always overwrites existing files.

## Reference Projects

- **atlassian-cli** (`~/Desktop/dev/github/atlassian-cli/`) — Same architecture, Jira/Confluence
- **figma-mcp-free** (`~/Desktop/dev/github/figma-mcp-free/`) — Community MCP server, design token extraction ported from here
- **Figma REST API** — https://developers.figma.com/docs/rest-api/
- **Figma OpenAPI Spec** — https://github.com/figma/rest-api-spec
