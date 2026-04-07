import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../../config.js';
import { createHttpClient } from '../../http.js';
import { createFigmaClient } from '../../clients/figma.js';
import { detectOutputMode, output, formatTable } from '../../output.js';
import type { FigmaFile, FigmaNode } from '../../types/figma.js';

function countNodes(node: FigmaNode): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  return count;
}

function formatHuman(file: FigmaFile): string {
  const lines: string[] = [];
  lines.push(chalk.bold(file.name));
  lines.push(`  Last modified: ${file.lastModified}`);
  lines.push(`  Version: ${file.version}`);
  lines.push('');

  const pages = file.document.children ?? [];
  if (pages.length) {
    lines.push(chalk.bold(`Pages (${pages.length}):`));
    const headers = ['Name', 'ID', 'Children', 'Total Nodes'];
    const rows = pages.map(page => [
      chalk.cyan(page.name),
      page.id,
      String(page.children?.length ?? 0),
      String(countNodes(page)),
    ]);
    lines.push(formatTable(headers, rows));
  }

  return lines.join('\n');
}

export function registerGetCommand(files: Command): void {
  files
    .command('get <file-key>')
    .description('Get file structure and metadata')
    .option('-d, --depth <n>', 'Depth of node tree to return (1-N)')
    .option('-v, --version <id>', 'Get a specific version')
    .option('--geometry <paths>', 'Include geometry data (e.g. "paths")')
    .action(async (fileKey: string, opts: { depth?: string; version?: string; geometry?: string }, command: Command) => {
      const config = loadConfig();
      const http = createHttpClient(config);
      const client = createFigmaClient(http);
      const ctx = detectOutputMode(command.optsWithGlobals().json);

      const file = await client.getFile(fileKey, {
        depth: opts.depth ? parseInt(opts.depth, 10) : undefined,
        version: opts.version,
        geometry: opts.geometry,
      });

      output(file, formatHuman, ctx);
    });
}
