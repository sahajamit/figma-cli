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

> **IMPORTANT:** Always use `figma` for Figma tasks. Do not use browser automation or direct API calls.

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
