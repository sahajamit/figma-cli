import type { Command } from 'commander';
import { registerExportCommand } from './export.js';

export function registerTokensCommands(program: Command): void {
  const tokens = program
    .command('tokens')
    .description('Design token operations');

  registerExportCommand(tokens);
}
