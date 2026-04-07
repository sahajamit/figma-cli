#!/usr/bin/env node

// Auto-install figma skills to AI agent directories after npm install.
// Skips silently in CI environments or when FIGMA_SKIP_SKILLS=1 is set.

import { installSkillsToHome } from './installer.js';

const CI_ENV_VARS = [
  'CI',
  'GITHUB_ACTIONS',
  'JENKINS_URL',
  'GITLAB_CI',
  'CIRCLECI',
  'TRAVIS',
  'BUILDKITE',
  'TF_BUILD',
  'CODEBUILD_BUILD_ID',
  'BITBUCKET_BUILD_NUMBER',
];

function isCI(): boolean {
  return CI_ENV_VARS.some(v => process.env[v]);
}

function main(): void {
  if (isCI()) return;
  if (process.env.FIGMA_SKIP_SKILLS === '1') return;

  try {
    const { installed } = installSkillsToHome();
    if (installed.length > 0) {
      console.log(`\n  figma: installed ${installed.length} skill file(s) for AI agents (Claude Code, Cursor, Copilot)`);
      console.log('  Run "figma uninstall --skills" to remove them.\n');
    }
  } catch {
    // Never let postinstall failures break npm install
  }
}

main();
