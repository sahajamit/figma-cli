import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../../config.js';
import { createHttpClient } from '../../http.js';
import { createFigmaClient } from '../../clients/figma.js';
import { detectOutputMode, output } from '../../output.js';
import type { FigmaVariablesResponse } from '../../types/figma.js';

function formatHuman(response: FigmaVariablesResponse): string {
  const collections = Object.values(response.meta.variableCollections);
  const variables = Object.values(response.meta.variables);
  const lines: string[] = [];

  lines.push(chalk.bold(`${collections.length} collection(s), ${variables.length} variable(s)`));
  lines.push('');

  for (const col of collections) {
    lines.push(chalk.bold.underline(col.name));
    const modes = col.modes.map(m => m.name).join(', ');
    lines.push(`  Modes: ${modes}`);

    const colVars = variables.filter(v => col.variableIds.includes(v.id));
    for (const v of colVars) {
      const desc = v.description ? ` — ${v.description}` : '';
      lines.push(`  ${chalk.cyan(v.name)} (${v.resolvedType})${desc}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function registerListCommand(variables: Command): void {
  variables
    .command('list <file-key>')
    .description('List local variables (design tokens)')
    .action(async (fileKey: string, _opts: unknown, command: Command) => {
      const config = loadConfig();
      const http = createHttpClient(config);
      const client = createFigmaClient(http);
      const ctx = detectOutputMode(command.optsWithGlobals().json);

      const result = await client.getVariables(fileKey);
      output(result, formatHuman, ctx);
    });
}
