---
name: figma-files
description: Figma file, node, image, comment, version, and project commands. Use for reading file structure, exporting images, managing comments, and browsing projects.
allowed-tools: Bash(figma:*)
---

# figma — File & Project Commands

## Quick start

```bash
# Verify token
figma me

# Get file structure
figma files get <file-key> --depth 1

# Get specific nodes
figma files nodes <file-key> --ids 1:2,3:4

# List frames
figma files frames <file-key>

# Export images
figma images export <file-key> --ids 1:2,3:4 --format png

# List comments
figma comments list <file-key>
```

---

## `figma me`

Show current user info (verify token works).

```bash
figma me [--json]
```

**JSON output:**
```json
{
  "id": "123456",
  "handle": "John Doe",
  "email": "john@example.com",
  "img_url": "https://..."
}
```

---

## `figma files get <file-key>`

Get file structure and metadata.

```bash
figma files get <file-key> [--depth N] [--version ID] [--geometry paths] [--json]
```

**Options:**
- `--depth N` — depth of node tree (use 1-2 for large files)
- `--version ID` — get a specific version
- `--geometry paths` — include vector path data

**JSON output:** Full Figma file JSON (name, document tree, lastModified, version).

---

## `figma files nodes <file-key>`

Get specific nodes by ID.

```bash
figma files nodes <file-key> --ids 1:2,3:4 [--json]
```

**JSON output:**
```json
{
  "name": "File Name",
  "nodes": {
    "1:2": { "document": { "id": "1:2", "name": "Node", "type": "FRAME", ... } }
  }
}
```

---

## `figma files frames <file-key>`

List all frames in a file.

```bash
figma files frames <file-key> [--json]
```

**JSON output:** Array of FigmaNode objects with type "FRAME".

---

## `figma images export <file-key>`

Export nodes as images (PNG, SVG, JPG, PDF).

```bash
figma images export <file-key> --ids 1:2,3:4 [--format png] [--scale 2] [--output-dir ./exports] [--json]
```

**Options:**
- `--ids` — **(required)** comma-separated node IDs
- `--format` — png, svg, jpg, pdf (default: png)
- `--scale` — 0.01 to 4 (default: 2)
- `--output-dir` — output directory (default: current directory)

**JSON output:**
```json
{
  "fileKey": "abc123",
  "outputDir": "./exports",
  "format": "png",
  "exported": [{ "nodeId": "1:2", "filename": "1-2.png", "path": "./exports/1-2.png" }],
  "failed": []
}
```

---

## `figma comments list <file-key>`

List comments on a file.

```bash
figma comments list <file-key> [--json]
```

---

## `figma comments add <file-key> <message>`

Add a comment. Use `-` to read from stdin.

```bash
figma comments add <file-key> "Review the header layout" [--json]
echo "Long comment..." | figma comments add <file-key> -
```

---

## `figma versions list <file-key>`

List version history.

```bash
figma versions list <file-key> [--json]
```

---

## `figma projects list <team-id>`

List projects in a team.

```bash
figma projects list <team-id> [--json]
```

---

## `figma projects files <project-id>`

List files in a project.

```bash
figma projects files <project-id> [--json]
```

---

## Workflow: Explore a design file

```bash
# 1. Get file structure (shallow — use --depth 1 or 2 for large files)
figma files get <file-key> --depth 1 --json

# 2. List all frames to find screens/pages of interest
figma files frames <file-key> --json

# 3. Get details of specific frames
figma files nodes <file-key> --ids 1:2,3:4 --json

# 4. Export frames as images for visual analysis
figma images export <file-key> --ids 1:2,3:4 --format png --scale 2 --output-dir ./figma-exports --json

# 5. View each exported image using your file reading capability to analyze the design visually
# (e.g. use the Read tool on each PNG file to see the actual UI)
```

---

## Workflow: Analyze a screen for test case writing

Use this workflow when a QA engineer or tester needs to understand a UI screen to write test cases.

```bash
# 1. Parse the Figma URL the user shared to extract file-key and node-id
#    URL format: https://www.figma.com/design/<file-key>/...?node-id=<node-id>
#    Convert node-id hyphens to colons: 8723-175412 → 8723:175412

# 2. Export the screen as a high-res image to see the full UI
figma images export <file-key> --ids <node-id> --format png --scale 2 --output-dir ./figma-exports --json

# 3. View the exported image to understand the visual layout
#    Read the PNG file to see buttons, forms, labels, navigation, states, etc.

# 4. Get the node tree to understand the UI structure and field details
figma files nodes <file-key> --ids <node-id> --json
```

**What to extract from the node tree for test cases:**
- **TEXT nodes** → field labels, button text, headings, placeholder text, error messages
- **FRAME/GROUP names** → logical sections (e.g. "Login Form", "Header", "Navigation")
- **COMPONENT/INSTANCE nodes** → reusable UI elements (buttons, inputs, dropdowns, checkboxes)
- **Node hierarchy** → parent-child relationships reveal form structure and grouping
- **Node names** → designers often name layers descriptively (e.g. "Email Input", "Submit Button", "Error State")

**From the visual export + node structure, identify:**
- All interactive elements (buttons, links, inputs, toggles, dropdowns)
- Required vs optional fields (look for asterisks or "required" labels)
- Validation hints (error message text nodes, helper text)
- Navigation paths (tabs, breadcrumbs, menu items)
- Different states if multiple frames exist (empty, filled, error, success, loading)

---

## Workflow: Compare UI states and screen variations

Use this when you need to understand different states of the same screen (e.g. empty form vs validation errors vs success).

```bash
# 1. Get the file structure to find related frames
figma files get <file-key> --depth 2 --json

# 2. Look for frames with similar names indicating states
#    (e.g. "Login - Default", "Login - Error", "Login - Loading")

# 3. Export all related frames as images for side-by-side comparison
figma images export <file-key> --ids <state1-id>,<state2-id>,<state3-id> --format png --scale 2 --output-dir ./figma-exports --json

# 4. View each exported image and compare the differences
#    Note what changes between states: error messages, button states, field highlights, loading indicators
```
