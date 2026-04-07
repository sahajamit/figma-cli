import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../../config.js';
import { createHttpClient } from '../../http.js';
import { createFigmaClient } from '../../clients/figma.js';
import { detectOutputMode, output, formatTable } from '../../output.js';
import type { FigmaStylesResponse } from '../../types/figma.js';

function formatHuman(response: FigmaStylesResponse): string {
  const styles = response.meta.styles;
  const lines: string[] = [];
  lines.push(chalk.bold(`Found ${styles.length} style(s)`));
  lines.push('');

  if (styles.length === 0) return lines.join('\n');

  const headers = ['Name', 'Type', 'Node ID', 'Description'];
  const rows = styles.map(s => [
    chalk.cyan(s.name),
    s.style_type,
    s.node_id,
    (s.description || '-').slice(0, 40),
  ]);

  lines.push(formatTable(headers, rows));
  return lines.join('\n');
}

export function registerListCommand(styles: Command): void {
  styles
    .command('list <file-key>')
    .description('List styles in a file')
    .action(async (fileKey: string, _opts: unknown, command: Command) => {
      const config = loadConfig();
      const http = createHttpClient(config);
      const client = createFigmaClient(http);
      const ctx = detectOutputMode(command.optsWithGlobals().json);

      const result = await client.getStyles(fileKey);
      output(result, formatHuman, ctx);
    });
}
