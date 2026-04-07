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
- `--scale` — 0.01 to 4 (default: 1)
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
# 1. Get file structure (shallow)
figma files get <file-key> --depth 1 --json

# 2. List all frames
figma files frames <file-key> --json

# 3. Get details of specific frames
figma files nodes <file-key> --ids 1:2,3:4 --json

# 4. Export frames as images for visual analysis
figma images export <file-key> --ids 1:2,3:4 --format png --output-dir ./figma-exports --json

# 5. Read each exported image to analyze the design visually
```
