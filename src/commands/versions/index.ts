import type { Command } from 'commander';
import { registerListCommand } from './list.js';

export function registerVersionsCommands(program: Command): void {
  const versions = program
    .command('versions')
    .description('Version history operations');

  registerListCommand(versions);
}
