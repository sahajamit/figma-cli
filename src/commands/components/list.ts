import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../../config.js';
import { createHttpClient } from '../../http.js';
import { createFigmaClient } from '../../clients/figma.js';
import { detectOutputMode, output, formatTable } from '../../output.js';
import type { FigmaComponentsResponse } from '../../types/figma.js';

function formatHuman(response: FigmaComponentsResponse): string {
  const components = response.meta.components;
  const lines: string[] = [];
  lines.push(chalk.bold(`Found ${components.length} component(s)`));
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

export function registerListCommand(components: Command): void {
  components
    .command('list <file-key>')
    .description('List components in a file')
    .action(async (fileKey: string, _opts: unknown, command: Command) => {
      const config = loadConfig();
      const http = createHttpClient(config);
      const client = createFigmaClient(http);
      const ctx = detectOutputMode(command.optsWithGlobals().json);

      const result = await client.getComponents(fileKey);
      output(result, formatHuman, ctx);
    });
}
