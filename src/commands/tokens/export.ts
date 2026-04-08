import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../../config.js';
import { createHttpClient } from '../../http.js';
import { createFigmaClient } from '../../clients/figma.js';
import { detectOutputMode, output } from '../../output.js';
import { toDesignTokens, type DesignTokens } from '../../tokens/extract.js';

function formatHuman(tokens: DesignTokens): string {
  const lines: string[] = [];
  lines.push(chalk.bold('Design Tokens (W3C format)'));
  lines.push('');

  const counts: string[] = [];
  if (tokens.color) counts.push(`${Object.keys(tokens.color).length} colors`);
  if (tokens.spacing) counts.push(`${Object.keys(tokens.spacing).length} spacing`);
  if (tokens.size) counts.push(`${Object.keys(tokens.size).length} sizes`);
  if (tokens.typography) counts.push(`${Object.keys(tokens.typography).length} typography`);
  if (tokens.shadow) counts.push(`${Object.keys(tokens.shadow).length} shadows`);

  if (counts.length === 0) {
    lines.push('No design tokens found.');
  } else {
    lines.push(`  ${counts.join(', ')}`);
    lines.push('');
    lines.push(chalk.dim('Use --json to get the full W3C Design Tokens JSON.'));
  }

  return lines.join('\n');
}

export function registerExportCommand(tokens: Command): void {
  tokens
    .command('export <file-key>')
    .description('Export design tokens in W3C format')
    .action(async (fileKey: string, _opts: unknown, command: Command) => {
      const config = loadConfig();
      const http = createHttpClient(config);
      const client = createFigmaClient(http);
      const ctx = detectOutputMode(command.optsWithGlobals().json);

      const file = await client.getFileByPages(fileKey);
      const designTokens = toDesignTokens(file);
      output(designTokens, formatHuman, ctx);
    });
}
