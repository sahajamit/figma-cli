#!/usr/bin/env node

import { createRequire } from 'node:module';
import { program } from 'commander';
import { registerMeCommand } from '../src/commands/me.js';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json');
import { registerFilesCommands } from '../src/commands/files/index.js';
import { registerImagesCommands } from '../src/commands/images/index.js';
import { registerComponentsCommands } from '../src/commands/components/index.js';
import { registerStylesCommands } from '../src/commands/styles/index.js';
import { registerVariablesCommands } from '../src/commands/variables/index.js';
import { registerCommentsCommands } from '../src/commands/comments/index.js';
import { registerVersionsCommands } from '../src/commands/versions/index.js';
import { registerProjectsCommands } from '../src/commands/projects/index.js';
import { registerTokensCommands } from '../src/commands/tokens/index.js';
import { installSkills, uninstallSkills } from '../src/installer.js';
import { detectOutputMode, outputError } from '../src/output.js';
import { CliError } from '../src/errors.js';

program
  .name('figma')
  .version(version)
  .description(
    'CLI for Figma — read designs, export images, extract tokens\n\n' +
    'Every command accepts --json (machine-readable output).\n' +
    'Run any command with --help for full details.\n\n' +
    'Setup:\n' +
    '  export FIGMA_TOKEN=your_personal_access_token\n' +
    '  Run `figma install --skills` to install AI agent skill files'
  )
  .option('--json', 'Force JSON output')
  .option('--no-color', 'Disable colored output');

registerMeCommand(program);
registerFilesCommands(program);
registerImagesCommands(program);
registerComponentsCommands(program);
registerStylesCommands(program);
registerVariablesCommands(program);
registerCommentsCommands(program);
registerVersionsCommands(program);
registerProjectsCommands(program);
registerTokensCommands(program);

program
  .command('install')
  .description('Install components (use --skills to install AI agent skill files)')
  .option('--skills', 'Install AI agent skill files (Claude Code, Copilot, Cursor)')
  .action((opts: { skills?: boolean }) => {
    if (opts.skills) {
      installSkills();
    } else {
      console.log('Usage: figma install --skills\n');
      console.log('Options:');
      console.log('  --skills    Install AI agent skill files (Claude Code, Copilot, Cursor)');
    }
  });

program
  .command('uninstall')
  .description('Uninstall components (use --skills to remove AI agent skill files)')
  .option('--skills', 'Remove AI agent skill files')
  .action((opts: { skills?: boolean }) => {
    if (opts.skills) {
      uninstallSkills();
    } else {
      console.log('Usage: figma uninstall --skills\n');
      console.log('Options:');
      console.log('  --skills    Remove AI agent skill files');
    }
  });

// Global error handler
const originalParse = program.parseAsync.bind(program);
program.parseAsync = async (argv?: string[]) => {
  try {
    return await originalParse(argv);
  } catch (error) {
    const ctx = detectOutputMode(program.opts().json);
    outputError(error, ctx);
    const exitCode = error instanceof CliError ? error.exitCode : 1;
    process.exit(exitCode);
  }
};

program.parseAsync();
