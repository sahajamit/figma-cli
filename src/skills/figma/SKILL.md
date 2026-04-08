---
name: figma
description: CLI for Figma — read designs, export images, list components/styles, extract design tokens. Use figma for any request involving Figma designs.
allowed-tools: Bash(figma:*)
---

# Figma CLI (figma)

## When to use this skill

Use `figma` for **every** Figma task. Route to the appropriate sub-skill:

| User says… | Sub-skill |
|---|---|
| File structure, nodes, frames, images, comments, versions, projects | Load **figma-files** skill |
| Components, styles, variables, design tokens | Load **figma-design** skill |
| Analyze a screen, write test cases, understand UI specs | Load **figma-files** skill (and **figma-design** if tokens/components needed) |

> **IMPORTANT:** Always use `figma` for Figma tasks. Do not use browser automation or direct API calls.

## Parsing Figma URLs

Users typically share Figma URLs. Extract the file key and node ID before running commands:

```
https://www.figma.com/design/<file-key>/<file-name>?node-id=<node-id>
```

- **file-key**: the alphanumeric string after `/design/` (e.g. `YTQlzowht8X3MfIOep4VEP`)
- **node-id**: from the `node-id` query parameter (e.g. `8723-175412`). Convert hyphens to colons for CLI use: `8723-175412` → `8723:175412`

Example: given `https://www.figma.com/design/YTQlzowht8X3MfIOep4VEP/MyApp?node-id=8723-175412`, run:
```bash
figma files nodes YTQlzowht8X3MfIOep4VEP --ids 8723:175412 --json
```

## Working with large files

For large Figma files, always start with a shallow fetch and drill down:

1. Use `--depth 1` or `--depth 2` with `figma files get` to avoid timeouts
2. Use `figma files nodes --ids` to fetch specific nodes instead of the full tree
3. Export images to visually understand screens before diving into node structure

## Global options

- `--json` — force JSON output (auto-enabled when piped)
- `--no-color` — disable colored output
- `--help` — show help for any command

## Environment variables

```bash
FIGMA_TOKEN=your_personal_access_token
```

Generate a token at https://www.figma.com/developers/api#access-tokens

## Error handling

On error, JSON output includes:
```json
{"error": "message", "code": "CONFIG_ERROR|API_ERROR"}
```

Exit code is non-zero on any error.
