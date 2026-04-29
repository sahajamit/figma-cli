# Figma CLI — Research & Planning

Researched: April 7, 2026

---

## Background

In our organization, MCP servers not listed in a central registry are blocked for security reasons. This happened with Atlassian Jira/Confluence MCP too. The solution was to create `atlassian-cli` — a CLI that exposes all MCP tools as shell commands, using the Atlassian REST API under the hood. It's simpler, more token-efficient, and works with any AI agent that has shell access.

We need to replicate this pattern for Figma.

---

## Figma MCP Landscape

### Official Figma MCP Server

- **Remote:** `https://mcp.figma.com/mcp` (preferred)
- **Desktop:** Runs locally through Figma desktop app
- Currently in **free beta**, will become a **paid feature** tied to Dev Mode
- Supports: read design context, generate code from frames, write to canvas, code-to-canvas capture, FigJam/Make access
- **Problem:** Blocked by org's MCP registry policy

### Figma MCP Free (Community Alternative)

- **GitHub:** https://github.com/superdoccimo/figma-mcp-free
- Open-source MCP server alternative to Figma's paid Dev Mode
- Uses Figma REST API with Personal Access Token (read-only)
- TypeScript / Node 18+
- Tools: component search, code generation (React/Vue), export design tokens
- **Useful as reference** for what tools to expose in the CLI

---

## Figma REST API

**Base URL:** `https://api.figma.com`
**Auth:** Personal Access Token (free to generate) with scopes
**OpenAPI Spec:** https://github.com/figma/rest-api-spec (official, great for auto-generating types/commands)
**Docs:** https://developers.figma.com/docs/rest-api/

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/files/:key` | GET | Get full file JSON (all nodes, properties) |
| `/v1/files/:key/nodes` | GET | Get specific nodes by ID |
| `/v1/images/:key` | GET | Export images from a file (PNG, SVG, JPG, PDF) |
| `/v1/files/:key/components` | GET | List components in a file |
| `/v1/files/:key/styles` | GET | List styles in a file |
| `/v1/files/:key/variables/local` | GET | Get local variables (design tokens) |
| `/v1/files/:key/versions` | GET | Version history |
| `/v1/comments/:key` | GET | List comments on a file |
| `/v1/comments/:key` | POST | Add a comment to a file |
| `/v1/projects/:id/files` | GET | List files in a project |
| `/v1/me` | GET | Current user info |
| `/v1/teams/:id/projects` | GET | List team projects |
| `/v1/teams/:id/components` | GET | List published team components |
| `/v1/teams/:id/styles` | GET | List published team styles |
| `/v2/webhooks` | GET/POST | Manage webhooks |
| Activity logs, library analytics, dev resources | Various | Additional endpoints |

### Authentication

Two options:
1. **Personal Access Token** — Simple, set scopes, pass as `X-Figma-Token` header
2. **OAuth 2** — For multi-user apps, token exchange flow

For the CLI, Personal Access Token is the way to go (same as `atl` uses API tokens).

### Important Limitation

The Figma REST API is fundamentally **read-only** for design content. You cannot create, edit, or move design elements via REST. Write operations require:
- Figma Plugin API (executed inside the editor)
- Browser automation
- The official MCP server's write-to-canvas feature

For our use case (AI agents reading design context for code generation), read-only is sufficient.

---

## CLI Design

### Auth

```bash
export FIGMA_TOKEN=your_personal_access_token
```

### Proposed Commands

| Command | REST API Endpoint | Description |
|---------|------------------|-------------|
| `figma me` | `GET /v1/me` | Current user info |
| `figma files get <key>` | `GET /v1/files/:key` | Get file structure and metadata |
| `figma files nodes <key> --ids 1:2,3:4` | `GET /v1/files/:key/nodes` | Get specific nodes |
| `figma images export <key> --ids 1:2 --format png` | `GET /v1/images/:key` | Export images |
| `figma components list <key>` | `GET /v1/files/:key/components` | List components in a file |
| `figma components search <key> --query Button` | Component filtering | Find components by name |
| `figma components team <team_id>` | `GET /v1/teams/:id/components` | List published team components |
| `figma styles list <key>` | `GET /v1/files/:key/styles` | List styles |
| `figma styles team <team_id>` | `GET /v1/teams/:id/styles` | List published team styles |
| `figma variables list <key>` | `GET /v1/files/:key/variables/local` | Get design variables/tokens |
| `figma comments list <key>` | `GET /v1/comments/:key` | List comments |
| `figma comments add <key> --message "..."` | `POST /v1/comments/:key` | Add a comment |
| `figma versions list <key>` | `GET /v1/files/:key/versions` | Version history |
| `figma projects list <team_id>` | `GET /v1/teams/:id/projects` | List team projects |
| `figma projects files <project_id>` | `GET /v1/projects/:id/files` | List files in project |
| `figma install --skills` | — | Install Claude Code / agent skill files |

### Output Format

- Default: Human-readable (tables, summaries)
- `--json`: Raw JSON for scripting/piping
- `--output <file>`: Write to file (especially for image exports)

---

## Why CLI over MCP (Same Rationale as atlassian-cli)

| | MCP Server | CLI + Skills |
|---|---|---|
| **Token cost** | ~3,000+ tokens for tool schemas per turn | ~200 tokens per skill file, loaded on demand |
| **Setup** | Start server process, configure transport | Set env var, `npm link`, `figma install --skills` |
| **Latency** | Server init + JSON-RPC overhead | Direct process spawn (~50ms) |
| **Tool selection** | Agent picks from all tools at once | Agent reads relevant skill file only |
| **Security** | Needs MCP registry approval | Just a CLI binary, no server |
| **Debugging** | Inspect MCP messages | Run the same CLI command in your terminal |

---

## Reference Projects

### atlassian-cli (Our Own)
- **Location:** `~/Desktop/dev/github/atlassian-cli/`
- Node.js CLI, globally available as `atl`
- Replaced 73 MCP tools with lean CLI commands
- Skills files for Claude Code integration
- TypeScript + 3 npm packages

### figma-mcp-free (Community)
- **GitHub:** https://github.com/superdoccimo/figma-mcp-free
- Open-source Figma MCP alternative using REST API
- Good reference for tool design and API usage patterns
- TypeScript / Node 18+

### Figma OpenAPI Spec (Official)
- **GitHub:** https://github.com/figma/rest-api-spec
- Full OpenAPI specification for the Figma REST API
- Can auto-generate TypeScript types
- Best source of truth for all endpoints and schemas

---

## Tech Stack (Proposed)

Following the atlassian-cli pattern:
- **Language:** TypeScript
- **Runtime:** Node.js 22+
- **CLI framework:** Commander.js (same as atl)
- **HTTP:** Native fetch or axios
- **Auth:** Personal Access Token via env var
- **Output:** Chalk for formatting, JSON mode for scripting

---

## Implementation Plan

### Phase 1: Core Read Operations
- [ ] Project setup (TypeScript, Commander.js, build pipeline)
- [ ] Auth setup (`FIGMA_TOKEN` env var)
- [ ] `figma me` — verify token
- [ ] `figma files get` — get file structure
- [ ] `figma files nodes` — get specific nodes
- [ ] `figma images export` — export images
- [ ] `figma components list` — list components
- [ ] `figma styles list` — list styles

### Phase 2: Design System Operations
- [ ] `figma variables list` — get design tokens
- [ ] `figma components team` — published team components
- [ ] `figma styles team` — published team styles
- [ ] `figma components search` — search/filter components

### Phase 3: Collaboration & Project Management
- [ ] `figma comments list/add` — read and post comments
- [ ] `figma versions list` — version history
- [ ] `figma projects list/files` — team projects and files

### Phase 4: Agent Integration
- [ ] `figma install --skills` — install Claude Code skills
- [ ] Write skill markdown files for each command group
- [ ] Test with Claude Code end-to-end
- [ ] Document in README

---

## Links

- Figma REST API Docs: https://developers.figma.com/docs/rest-api/
- Figma REST API OpenAPI Spec: https://github.com/figma/rest-api-spec
- Figma MCP Server (Official): https://help.figma.com/hc/en-us/articles/32132100833559
- Figma MCP Free (Community): https://github.com/superdoccimo/figma-mcp-free
- Figma Auth Docs: https://developers.figma.com/docs/rest-api/authentication/
- Our Atlassian CLI: `~/Desktop/dev/github/atlassian-cli/`
