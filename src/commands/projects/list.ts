import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../../config.js';
import { createHttpClient } from '../../http.js';
import { createFigmaClient } from '../../clients/figma.js';
import { detectOutputMode, output, formatTable } from '../../output.js';
import type { FigmaTeamProjectsResponse } from '../../types/figma.js';

function formatHuman(response: FigmaTeamProjectsResponse): string {
  const projects = response.projects;
  const lines: string[] = [];
  lines.push(chalk.bold(`Found ${projects.length} project(s)`));
  lines.push('');

  if (projects.length === 0) return lines.join('\n');

  const headers = ['Name', 'ID'];
  const rows = projects.map(p => [
    chalk.cyan(p.name),
    String(p.id),
  ]);

  lines.push(formatTable(headers, rows));
  return lines.join('\n');
}

export function registerListCommand(projects: Command): void {
  projects
    .command('list <team-id>')
    .description('List projects in a team')
    .action(async (teamId: string, _opts: unknown, command: Command) => {
      const config = loadConfig();
      const http = createHttpClient(config);
      const client = createFigmaClient(http);
      const ctx = detectOutputMode(command.optsWithGlobals().json);

      const result = await client.getTeamProjects(teamId);
      output(result, formatHuman, ctx);
    });
}
