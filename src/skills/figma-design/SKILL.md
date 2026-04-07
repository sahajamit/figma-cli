---
name: figma-design
description: Figma component, style, variable, and design token commands. Use for browsing design systems, searching components, and extracting design tokens.
allowed-tools: Bash(figma:*)
---

# figma — Design System Commands

## Quick start

```bash
# List components
figma components list <file-key>

# Search for a component
figma components search <file-key> --query Button

# List styles
figma styles list <file-key>

# Get design variables
figma variables list <file-key>

# Export design tokens (W3C format)
figma tokens export <file-key> --json
```

---

## `figma components list <file-key>`

List components in a file.

```bash
figma components list <file-key> [--json]
```

**JSON output:**
```json
{
  "meta": {
    "components": [
      { "key": "abc", "node_id": "1:2", "name": "Button/Primary", "description": "..." }
    ]
  }
}
```

---

## `figma components search <file-key>`

Search components by name (case-insensitive).

```bash
figma components search <file-key> --query <text> [--json]
```

**JSON output:** Array of matching component objects.

---

## `figma components team <team-id>`

List published team components.

```bash
figma components team <team-id> [--json]
```

---

## `figma styles list <file-key>`

List styles in a file.

```bash
figma styles list <file-key> [--json]
```

**JSON output:**
```json
{
  "meta": {
    "styles": [
      { "key": "abc", "node_id": "1:2", "style_type": "FILL", "name": "Primary/500", "description": "..." }
    ]
  }
}
```

---

## `figma styles team <team-id>`

List published team styles.

```bash
figma styles team <team-id> [--json]
```

---

## `figma variables list <file-key>`

List local variables (design tokens from Figma's native variables).

```bash
figma variables list <file-key> [--json]
```

> Note: Requires `file_variables:read` scope on your token.

**JSON output:**
```json
{
  "meta": {
    "variableCollections": { "id": { "name": "Colors", "modes": [...], "variableIds": [...] } },
    "variables": { "id": { "name": "primary", "resolvedType": "COLOR", "valuesByMode": {...} } }
  }
}
```

---

## `figma tokens export <file-key>`

Extract design tokens from a file in W3C Design Tokens Community Group format. Extracts colors, spacing, sizes, typography, and shadows from the node tree.

```bash
figma tokens export <file-key> [--json]
```

**JSON output:**
```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/module.v1.json",
  "color": { "primary/500": { "value": "#3b82f6", "type": "color" } },
  "spacing": { "card-padding-top": { "value": 16, "type": "spacing" } },
  "typography": { "heading/h1": { "value": { "fontFamily": "Inter", "fontSize": 32, "fontWeight": 700 } } },
  "shadow": { "card": { "value": "0px 4px 6px 0px #0000001a" } }
}
```

---

## Workflow: Extract design system for code generation

```bash
# 1. List all components
figma components list <file-key> --json

# 2. Export design tokens
figma tokens export <file-key> --json > tokens.json

# 3. Get specific component node details
figma files nodes <file-key> --ids <component-node-id> --json

# 4. Use the node structure + tokens to generate code
```
