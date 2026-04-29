# Command Reference

Full reference for every `figma` command, including all flags and example output. For installation and a quick start, see the [README](../README.md).

> **Setup:** every command needs `FIGMA_TOKEN` exported. Generate one at [Figma → Settings → Personal Access Tokens](https://www.figma.com/developers/api#access-tokens).

## Finding your file key

Every Figma command needs a **file key** — the ID in the URL of any Figma file:

```
https://www.figma.com/design/ABC123xyz/My-Design
                              ^^^^^^^^^
                              this is the file key
```

Node IDs (like `1:2`, `3:4`) come from Figma's "Copy link" or from `figma files get`.

---

## `figma me`

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

## File operations

### `figma files get <file-key>`

Get the structure and metadata of a Figma file.

```bash
# Overview (shallow, fast)
figma files get ABC123xyz --depth 1

# Full file tree
figma files get ABC123xyz

# Specific version
figma files get ABC123xyz --version 123456
```

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

### `figma files nodes <file-key>`

Get specific nodes by ID. Useful for fetching details of a particular frame or component.

```bash
figma files nodes ABC123xyz --ids 1:2,3:4
```

### `figma files frames <file-key>`

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

## Image export

### `figma images export <file-key>`

Export frames or components as images. This is the big one — get visual output from any Figma design.

```bash
# Export specific frames as PNG
figma images export ABC123xyz --ids 1:2,3:4 --format png

# High-res SVG export
figma images export ABC123xyz --ids 1:2 --format svg --scale 2

# Save to a specific folder
figma images export ABC123xyz --ids 1:2,3:4,5:6 --format png --output-dir ./design-exports
```

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

## Components

### `figma components list <file-key>`

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

### `figma components search <file-key>`

Search components by name (case-insensitive, client-side filter).

```bash
figma components search ABC123xyz --query Button
```

### `figma components team <team-id>`

List published components from your team's design system library.

```bash
figma components team 123456789
```

---

## Styles

### `figma styles list <file-key>`

List all styles (colors, text styles, effects, grids) in a file.

```bash
figma styles list ABC123xyz
```

```
Found 12 style(s)

Name              Type    Node ID  Description
────────────────  ──────  ───────  ──────────────
Primary/500       FILL    1:10     Brand primary color
Heading/H1        TEXT    1:20     Page headings
Shadow/Card       EFFECT  1:30     Card elevation
```

### `figma styles team <team-id>`

List published team styles.

```bash
figma styles team 123456789
```

---

## Variables (native Figma tokens)

### `figma variables list <file-key>`

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

> Requires `file_variables:read` scope on your token.

---

## Design tokens (W3C format)

### `figma tokens export <file-key>`

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

## Comments

### `figma comments list <file-key>`

```bash
figma comments list ABC123xyz
```

### `figma comments add <file-key> <message>`

The only write operation. Use `-` to read the message from stdin.

```bash
figma comments add ABC123xyz "Please review the header layout"
echo "Detailed feedback..." | figma comments add ABC123xyz -
```

---

## Version history

### `figma versions list <file-key>`

```bash
figma versions list ABC123xyz
```

---

## Projects

### `figma projects list <team-id>`

List projects in a team.

```bash
figma projects list 123456789
```

### `figma projects files <project-id>`

List files in a project.

```bash
figma projects files 987654321
```

---

## Skill installer

### `figma install --skills`

Install AI-agent skill files for Claude Code, Cursor, and GitHub Copilot. Always overwrites existing files.

| Target | Path | When |
|--------|------|------|
| Claude Code | `~/.claude/skills/<skill>/SKILL.md` | always |
| Cursor | `~/.cursor/rules/<skill>.md` | only if `~/.cursor/rules` exists |
| Copilot (standalone) | `~/.copilot/skills/<skill>/SKILL.md` | always |
| GitHub Copilot | `.github/copilot-instructions.md` | only when run from a repo with `.github/` |

### `figma uninstall --skills`

Remove the skill files this CLI installed.

---

## Output modes

| Mode | When | Format |
|------|------|--------|
| **Human** | stdout is a terminal (TTY) | Colored tables and formatted text |
| **JSON** | stdout is piped (non-TTY) | Structured JSON |

Agents automatically get JSON because they pipe stdout. Force JSON in a terminal with `--json`.

```bash
# Agent runs this — gets JSON because stdout is piped
result=$(figma files get ABC123xyz --depth 1)

# Human runs the same command — gets a colored table
figma files get ABC123xyz --depth 1

# Force JSON in terminal
figma files get ABC123xyz --depth 1 --json
```
