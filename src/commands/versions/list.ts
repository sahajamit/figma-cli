import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../../config.js';
import { createHttpClient } from '../../http.js';
import { createFigmaClient } from '../../clients/figma.js';
import { detectOutputMode, output, formatTable } from '../../output.js';
import type { FigmaVersionsResponse } from '../../types/figma.js';

function formatHuman(response: FigmaVersionsResponse): string {
  const versions = response.versions;
  const lines: string[] = [];
  lines.push(chalk.bold(`Found ${versions.length} version(s)`));
  lines.push('');

  if (versions.length === 0) return lines.join('\n');

  const headers = ['Label', 'Created', 'User', 'Description'];
  const rows = versions.map(v => [
    chalk.cyan(v.label || '(unnamed)'),
    v.created_at.slice(0, 10),
    v.user.handle,
    (v.description || '-').slice(0, 40),
  ]);

  lines.push(formatTable(headers, rows));
  return lines.join('\n');
}

export function registerListCommand(versions: Command): void {
  versions
    .command('list <file-key>')
    .description('List version history of a file')
    .action(async (fileKey: string, _opts: unknown, command: Command) => {
      const config = loadConfig();
      const http = createHttpClient(config);
      const client = createFigmaClient(http);
      const ctx = detectOutputMode(command.optsWithGlobals().json);

      const result = await client.getVersions(fileKey);
      output(result, formatHuman, ctx);
    });
}
