import type { Command } from 'commander';
import { registerListCommand } from './list.js';
import { registerSearchCommand } from './search.js';
import { registerTeamCommand } from './team.js';

export function registerComponentsCommands(program: Command): void {
  const components = program
    .command('components')
    .description('Component operations');

  registerListCommand(components);
  registerSearchCommand(components);
  registerTeamCommand(components);
}
