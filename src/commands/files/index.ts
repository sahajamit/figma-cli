import type { Command } from 'commander';
import { registerGetCommand } from './get.js';
import { registerNodesCommand } from './nodes.js';
import { registerFramesCommand } from './frames.js';

export function registerFilesCommands(program: Command): void {
  const files = program
    .command('files')
    .description('File operations');

  registerGetCommand(files);
  registerNodesCommand(files);
  registerFramesCommand(files);
}
