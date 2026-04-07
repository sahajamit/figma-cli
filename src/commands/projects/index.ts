import type { Command } from 'commander';
import { registerListCommand } from './list.js';
import { registerFilesCommand } from './files.js';

export function registerProjectsCommands(program: Command): void {
  const projects = program
    .command('projects')
    .description('Project and team operations');

  registerListCommand(projects);
  registerFilesCommand(projects);
}
