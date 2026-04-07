import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../config.js';
import { createHttpClient } from '../http.js';
import { createFigmaClient } from '../clients/figma.js';
import { detectOutputMode, output } from '../output.js';
import type { FigmaUser } from '../types/figma.js';

function formatHuman(user: FigmaUser): string {
  const lines: string[] = [];
  lines.push(chalk.bold('Figma User'));
  lines.push('');
  lines.push(`  Handle:  ${chalk.cyan(user.handle)}`);
  lines.push(`  Email:   ${user.email}`);
  lines.push(`  ID:      ${user.id}`);
  return lines.join('\n');
}

export function registerMeCommand(program: Command): void {
  program
    .command('me')
    .description('Show current user info (verify token)')
    .action(async (_opts: unknown, command: Command) => {
      const config = loadConfig();
      const http = createHttpClient(config);
      const client = createFigmaClient(http);
      const ctx = detectOutputMode(command.optsWithGlobals().json);

      const user = await client.getMe();
      output(user, formatHuman, ctx);
    });
}
