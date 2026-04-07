import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../../config.js';
import { createHttpClient } from '../../http.js';
import { createFigmaClient } from '../../clients/figma.js';
import { detectOutputMode, output, formatTable } from '../../output.js';
import type { FigmaComponent } from '../../types/figma.js';

function formatHuman(components: FigmaComponent[]): string {
  const lines: string[] = [];
  lines.push(chalk.bold(`Found ${components.length} matching component(s)`));
  lines.push('');

  if (components.length === 0) return lines.join('\n');

  const headers = ['Name', 'Node ID', 'Description'];
  const rows = components.map(c => [
    chalk.cyan(c.name),
    c.node_id,
    (c.description || '-').slice(0, 50),
  ]);

  lines.push(formatTable(headers, rows));
  return lines.join('\n');
}

export function registerSearchCommand(components: Command): void {
  components
    .command('search <file-key>')
    .description('Search components by name')
    .requiredOption('-q, --query <text>', 'Search query (case-insensitive name match)')
    .action(async (fileKey: string, opts: { query: string }, command: Command) => {
      const config = loadConfig();
      const http = createHttpClient(config);
      const client = createFigmaClient(http);
      const ctx = detectOutputMode(command.optsWithGlobals().json);

      const results = await client.searchComponents(fileKey, opts.query);
      output(results, formatHuman, ctx);
    });
}
