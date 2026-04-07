import type { Command } from 'commander';
import { registerListCommand } from './list.js';
import { registerAddCommand } from './add.js';

export function registerCommentsCommands(program: Command): void {
  const comments = program
    .command('comments')
    .description('Comment operations');

  registerListCommand(comments);
  registerAddCommand(comments);
}
