import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../../config.js';
import { createHttpClient } from '../../http.js';
import { createFigmaClient } from '../../clients/figma.js';
import { detectOutputMode, output, formatTable } from '../../output.js';
import type { FigmaCommentsResponse } from '../../types/figma.js';

function formatHuman(response: FigmaCommentsResponse): string {
  const comments = response.comments;
  const lines: string[] = [];
  lines.push(chalk.bold(`Found ${comments.length} comment(s)`));
  lines.push('');

  if (comments.length === 0) return lines.join('\n');

  const headers = ['Author', 'Date', 'Message', 'Resolved'];
  const rows = comments.map(c => [
    chalk.cyan(c.user.handle),
    c.created_at.slice(0, 10),
    c.message.length > 60 ? c.message.slice(0, 57) + '...' : c.message,
    c.resolved_at ? 'Yes' : 'No',
  ]);

  lines.push(formatTable(headers, rows));
  return lines.join('\n');
}

export function registerListCommand(comments: Command): void {
  comments
    .command('list <file-key>')
    .description('List comments on a file')
    .action(async (fileKey: string, _opts: unknown, command: Command) => {
      const config = loadConfig();
      const http = createHttpClient(config);
      const client = createFigmaClient(http);
      const ctx = detectOutputMode(command.optsWithGlobals().json);

      const result = await client.getComments(fileKey);
      output(result, formatHuman, ctx);
    });
}
