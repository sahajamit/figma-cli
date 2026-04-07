import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../../config.js';
import { createHttpClient } from '../../http.js';
import { createFigmaClient } from '../../clients/figma.js';
import { detectOutputMode, output, formatTable } from '../../output.js';
import type { FigmaNodesResponse } from '../../types/figma.js';

function formatHuman(response: FigmaNodesResponse): string {
  const lines: string[] = [];
  lines.push(chalk.bold(response.name));
  lines.push('');

  const entries = Object.entries(response.nodes);
  if (entries.length === 0) {
    lines.push('No nodes found.');
    return lines.join('\n');
  }

  const headers = ['ID', 'Name', 'Type', 'Children', 'Dimensions'];
  const rows = entries.map(([id, entry]) => {
    const node = entry.document;
    const bb = node.absoluteBoundingBox;
    const dims = bb ? `${Math.round(bb.width)}x${Math.round(bb.height)}` : '-';
    return [
      chalk.cyan(id),
      node.name,
      node.type,
      String(node.children?.length ?? 0),
      dims,
    ];
  });

  lines.push(formatTable(headers, rows));
  return lines.join('\n');
}

export function registerNodesCommand(files: Command): void {
  files
    .command('nodes <file-key>')
    .description('Get specific nodes by ID')
    .requiredOption('--ids <ids>', 'Comma-separated node IDs (e.g. 1:2,3:4)')
    .action(async (fileKey: string, opts: { ids: string }, command: Command) => {
      const config = loadConfig();
      const http = createHttpClient(config);
      const client = createFigmaClient(http);
      const ctx = detectOutputMode(command.optsWithGlobals().json);

      const nodeIds = opts.ids.split(',').map(id => id.trim());
      const result = await client.getNodes(fileKey, nodeIds);
      output(result, formatHuman, ctx);
    });
}
