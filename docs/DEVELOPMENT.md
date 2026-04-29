# Development Guide

How to build and hack on `figma-cli` locally. For end-user installation, see the [README](../README.md).

## Prerequisites

- Node.js 22 or newer
- A Figma Personal Access Token (for smoke-testing)

## First-time setup

```bash
git clone https://github.com/sahajamit/figma-cli.git
cd figma-cli
npm install
npm run build
npm link              # makes `figma` available globally
figma --help
```

`npm install -g @sahajamit/figma-cli` does **not** auto-install AI agent skill files. To enable them, run `figma install --skills` once.

## Iterative development

After making code changes:

```bash
# Option 1: manual rebuild
npm run build
figma me

# Option 2: watch mode (auto-recompile on save)
npm run dev
# In another terminal:
figma me
figma files get ABC123xyz --depth 1
```

> `npm run dev` only recompiles TypeScript. If you edit skill files under `src/skills/`, run `npm run build` to copy them into `dist/`.

## Run without `npm link`

```bash
node dist/bin/figma.js me
node dist/bin/figma.js files get ABC123xyz --json
node dist/bin/figma.js images export ABC123xyz --ids 1:2 --format png
```

## Smoke testing with a real Figma token

1. Generate a token at [Figma → Settings → Personal Access Tokens](https://www.figma.com/developers/api#access-tokens) (free, no paid plan required).
2. Export it:
   ```bash
   export FIGMA_TOKEN=figd_your_token_here
   ```
3. Run:
   ```bash
   figma me                                          # verify token works
   figma files get <your-file-key> --depth 1         # file overview
   figma files frames <your-file-key>                # list frames
   figma components list <your-file-key>             # list components
   figma images export <your-file-key> --ids <node-id> --format png
   ```

## Adding a new command

1. Add types to `src/types/figma.ts`.
2. Add the API method in `src/clients/figma.ts`.
3. Create the command file in `src/commands/<group>/<command>.ts` (copy a sibling as a template).
4. Register it in `src/commands/<group>/index.ts`.
5. If it's a new group, register the group in `bin/figma.ts`.
6. Update the relevant skill file under `src/skills/` so AI agents discover it.
7. Rebuild: `npm run build`.

Every command follows the same flow:

```
loadConfig() → createHttpClient() → createFigmaClient() → detectOutputMode()
            → client.method() → output(result, formatHuman, ctx)
```

## Project scripts

| Script | What it does |
|--------|--------------|
| `npm run build` | Compile TypeScript + copy skill files to `dist/` |
| `npm run dev` | Watch mode — recompile TypeScript on file changes |
| `npm start` | Run `dist/bin/figma.js` directly |
| `npm link` | Make `figma` command available globally |
| `figma install --skills` | Install AI skill files (Claude Code, Cursor, Copilot) |
| `figma uninstall --skills` | Remove installed skill files |

## Releasing

1. Land changes on `main`.
2. Bump the `version` field in `package.json`.
3. `npm publish` (the `prepublishOnly` hook runs `npm run build` first).
4. Tag and push: `git tag v$(node -p "require('./package.json').version") && git push --tags`.

## Repository layout

See [ARCHITECTURE.md](./ARCHITECTURE.md) for an overview of the source tree, key patterns, and design decisions.
