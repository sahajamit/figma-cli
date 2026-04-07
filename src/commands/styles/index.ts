import type { Command } from 'commander';
import { registerListCommand } from './list.js';
import { registerTeamCommand } from './team.js';

export function registerStylesCommands(program: Command): void {
  const styles = program
    .command('styles')
    .description('Style operations');

  registerListCommand(styles);
  registerTeamCommand(styles);
}
