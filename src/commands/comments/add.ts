import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../../config.js';
import { createHttpClient } from '../../http.js';
import { createFigmaClient } from '../../clients/figma.js';
import { detectOutputMode, output, resolveBody } from '../../output.js';
import type { FigmaCommentsResponse } from '../../types/figma.js';

function formatHuman(response: FigmaCommentsResponse): string {
  const lines: string[] = [];
  lines.push(chalk.green('Comment added successfully.'));
  if (response.comments?.length) {
    const c = response.comments[0]!;
    lines.push(`  ID: ${c.id}`);
    lines.push(`  Message: ${c.message}`);
  }
  return lines.join('\n');
}

export function registerAddCommand(comments: Command): void {
  comments
    .command('add <file-key> <message>')
    .description('Add a comment to a file (use "-" to read from stdin)')
    .action(async (fileKey: string, message: string, _opts: unknown, command: Command) => {
      const config = loadConfig();
      const http = createHttpClient(config);
      const client = createFigmaClient(http);
      const ctx = detectOutputMode(command.optsWithGlobals().json);

      const body = await resolveBody(message);
      const result = await client.addComment(fileKey, body);
      output(result, formatHuman, ctx);
    });
}
