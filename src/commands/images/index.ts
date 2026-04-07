import type { Command } from 'commander';
import { registerExportCommand } from './export.js';

export function registerImagesCommands(program: Command): void {
  const images = program
    .command('images')
    .description('Image export operations');

  registerExportCommand(images);
}
