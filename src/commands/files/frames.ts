import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../../config.js';
import { createHttpClient } from '../../http.js';
import { createFigmaClient } from '../../clients/figma.js';
import { detectOutputMode, output, formatTable } from '../../output.js';
import type { FigmaNode } from '../../types/figma.js';

function formatHuman(frames: FigmaNode[]): string {
  const lines: string[] = [];
  lines.push(chalk.bold(`Found ${frames.length} frame(s)`));
  lines.push('');

  if (frames.length === 0) {
    return lines.join('\n');
  }

  const headers = ['Name', 'ID', 'Dimensions'];
  const rows = frames.map(f => {
    const bb = f.absoluteBoundingBox;
    const dims = bb ? `${Math.round(bb.width)}x${Math.round(bb.height)}` : '-';
    return [chalk.cyan(f.name), f.id, dims];
  });

  lines.push(formatTable(headers, rows));
  return lines.join('\n');
}

export function registerFramesCommand(files: Command): void {
  files
    .command('frames <file-key>')
    .description('List all frames in a file')
    .action(async (fileKey: string, _opts: unknown, command: Command) => {
      const config = loadConfig();
      const http = createHttpClient(config);
      const client = createFigmaClient(http);
      const ctx = detectOutputMode(command.optsWithGlobals().json);

      const frames = await client.listFrames(fileKey);
      output(frames, formatHuman, ctx);
    });
}
