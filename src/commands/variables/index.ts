import type { Command } from 'commander';
import { registerListCommand } from './list.js';

export function registerVariablesCommands(program: Command): void {
  const variables = program
    .command('variables')
    .description('Variable (design token) operations');

  registerListCommand(variables);
}
