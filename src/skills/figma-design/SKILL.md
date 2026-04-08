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

---

## Workflow: Understand UI specs for testing

Use this when QA/testing teams need to understand design specs — field names, component types, visual styling, spacing — to write comprehensive test cases.

```bash
# 1. Export the screen as an image to see the full UI visually
figma images export <file-key> --ids <screen-node-id> --format png --scale 2 --output-dir ./figma-exports --json

# 2. View the exported image to identify all UI elements visually

# 3. Get the node tree for the screen to extract structural details
figma files nodes <file-key> --ids <screen-node-id> --json

# 4. Search for specific components used in the screen
figma components search <file-key> --query "Button" --json
figma components search <file-key> --query "Input" --json

# 5. Get design tokens to understand the visual spec (colors, spacing, typography)
figma tokens export <file-key> --json > tokens.json
```

**How to interpret node tree data for test cases:**

| Node property | What it tells you |
|---|---|
| `type: "TEXT"` + `characters` | Labels, headings, button text, placeholders, error messages |
| `type: "INSTANCE"` + `name` | Reusable component (e.g. "Button/Primary", "Input/Text", "Checkbox") |
| `type: "COMPONENT"` | Component definition — check `name` and `description` for intended behavior |
| `name` on any node | Designer's label for the element (e.g. "Email Field", "Submit CTA") |
| `children` array | Hierarchy — children inside a "Form" frame are the form fields |
| `visible: false` | Hidden elements — may indicate conditional UI (shown on error, loading, etc.) |

**Mapping Figma components to testable UI elements:**
- `Button/*` → clickable actions — test click behavior, disabled states
- `Input/*`, `TextField/*` → text inputs — test typing, validation, character limits
- `Checkbox/*`, `Toggle/*` → boolean inputs — test checked/unchecked states
- `Dropdown/*`, `Select/*` → selection inputs — test options, default selection
- `Modal/*`, `Dialog/*` → overlays — test open/close, backdrop click
- `Tab/*`, `Navigation/*` → navigation — test switching, active states
