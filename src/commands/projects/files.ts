import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../../config.js';
import { createHttpClient } from '../../http.js';
import { createFigmaClient } from '../../clients/figma.js';
import { detectOutputMode, output, formatTable } from '../../output.js';
import type { FigmaProjectFilesResponse } from '../../types/figma.js';

function formatHuman(response: FigmaProjectFilesResponse): string {
  const files = response.files;
  const lines: string[] = [];
  lines.push(chalk.bold(`Found ${files.length} file(s)`));
  lines.push('');

  if (files.length === 0) return lines.join('\n');

  const headers = ['Name', 'Key', 'Last Modified'];
  const rows = files.map(f => [
    chalk.cyan(f.name),
    f.key,
    f.last_modified.slice(0, 10),
  ]);

  lines.push(formatTable(headers, rows));
  return lines.join('\n');
}

export function registerFilesCommand(projects: Command): void {
  projects
    .command('files <project-id>')
    .description('List files in a project')
    .action(async (projectId: string, _opts: unknown, command: Command) => {
      const config = loadConfig();
      const http = createHttpClient(config);
      const client = createFigmaClient(http);
      const ctx = detectOutputMode(command.optsWithGlobals().json);

      const result = await client.getProjectFiles(projectId);
      output(result, formatHuman, ctx);
    });
}
