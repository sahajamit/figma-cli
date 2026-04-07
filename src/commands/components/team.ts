import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../../config.js';
import { createHttpClient } from '../../http.js';
import { createFigmaClient } from '../../clients/figma.js';
import { detectOutputMode, output, formatTable } from '../../output.js';
import type { FigmaComponentsResponse } from '../../types/figma.js';

function formatHuman(response: FigmaComponentsResponse): string {
  const components = response.meta.components;
  const lines: string[] = [];
  lines.push(chalk.bold(`Found ${components.length} published component(s)`));
  lines.push('');

  if (components.length === 0) return lines.join('\n');

  const headers = ['Name', 'Key', 'Description'];
  const rows = components.map(c => [
    chalk.cyan(c.name),
    c.key,
    (c.description || '-').slice(0, 50),
  ]);

  lines.push(formatTable(headers, rows));
  return lines.join('\n');
}

export function registerTeamCommand(components: Command): void {
  components
    .command('team <team-id>')
    .description('List published team components')
    .action(async (teamId: string, _opts: unknown, command: Command) => {
      const config = loadConfig();
      const http = createHttpClient(config);
      const client = createFigmaClient(http);
      const ctx = detectOutputMode(command.optsWithGlobals().json);

      const result = await client.getTeamComponents(teamId);
      output(result, formatHuman, ctx);
    });
}
