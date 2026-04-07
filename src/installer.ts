import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, rmdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const SKILLS = [
  { name: 'figma', dir: 'figma' },
  { name: 'figma-files', dir: 'figma-files' },
  { name: 'figma-design', dir: 'figma-design' },
];

export function getSkillSource(skillDir: string): string {
  const candidate = join(__dirname, 'skills', skillDir, 'SKILL.md');
  if (existsSync(candidate)) {
    return candidate;
  }
  throw new Error(
    `Could not locate ${skillDir}/SKILL.md (looked at ${candidate}). ` +
    'Re-install figma-cli or run from the project root.',
  );
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export interface InstallResult {
  installed: string[];
  skipped: string[];
}

export function installSkillsToHome(): InstallResult {
  const home = homedir();
  const installed: string[] = [];
  const skipped: string[] = [];

  for (const skill of SKILLS) {
    let sourcePath: string;
    try {
      sourcePath = getSkillSource(skill.dir);
    } catch (e) {
      skipped.push((e as Error).message);
      continue;
    }

    // Claude Code
    const claudeTarget = join(home, '.claude', 'skills', skill.name, 'SKILL.md');
    ensureDir(dirname(claudeTarget));
    copyFileSync(sourcePath, claudeTarget);
    installed.push(`Claude Code  →  ${claudeTarget}`);

    // Cursor
    const cursorRulesDir = join(home, '.cursor', 'rules');
    if (existsSync(cursorRulesDir)) {
      const cursorTarget = join(cursorRulesDir, `${skill.name}.md`);
      copyFileSync(sourcePath, cursorTarget);
      installed.push(`Cursor       →  ${cursorTarget}`);
    } else if (skill.name === 'figma') {
      skipped.push('Cursor (~/.cursor/rules not found — open Cursor at least once to create it)');
    }

    // Copilot (standalone)
    const copilotSkillsTarget = join(home, '.copilot', 'skills', skill.name, 'SKILL.md');
    ensureDir(dirname(copilotSkillsTarget));
    copyFileSync(sourcePath, copilotSkillsTarget);
    installed.push(`Copilot      →  ${copilotSkillsTarget}`);
  }

  return { installed, skipped };
}

function installSkillsToGitHubCopilot(): InstallResult {
  const installed: string[] = [];
  const skipped: string[] = [];

  for (const skill of SKILLS) {
    let sourcePath: string;
    try {
      sourcePath = getSkillSource(skill.dir);
    } catch {
      continue;
    }

    const copilotDir = '.github';
    const copilotTarget = join(copilotDir, 'copilot-instructions.md');
    const marker = `<!-- ${skill.name}-skill -->`;
    if (existsSync(copilotDir)) {
      const skillContent = readFileSync(sourcePath, 'utf-8');
      let newContent: string;
      if (existsSync(copilotTarget)) {
        const existing = readFileSync(copilotTarget, 'utf-8');
        if (existing.includes(marker)) {
          const beforeIdx = existing.indexOf(marker);
          const afterIdx = existing.indexOf(marker, beforeIdx + marker.length);
          if (afterIdx !== -1) {
            const before = existing.slice(0, beforeIdx);
            const tail = existing.slice(afterIdx + marker.length);
            newContent = before + marker + '\n' + skillContent + '\n' + marker + tail;
          } else {
            newContent = existing + `\n\n${marker}\n${skillContent}\n${marker}\n`;
          }
        } else {
          newContent = existing + `\n\n${marker}\n${skillContent}\n${marker}\n`;
        }
      } else {
        newContent = `${marker}\n${skillContent}\n${marker}\n`;
      }
      writeFileSync(copilotTarget, newContent, 'utf-8');
      installed.push(`GitHub Copilot  →  ${copilotTarget} (${skill.name})`);
    } else if (skill.name === 'figma') {
      skipped.push('GitHub Copilot (.github/ not found — run from the root of a git repo)');
    }
  }

  return { installed, skipped };
}

export function installSkills(): void {
  const homeResult = installSkillsToHome();
  const ghResult = installSkillsToGitHubCopilot();

  const installed = [...homeResult.installed, ...ghResult.installed];
  const skipped = [...homeResult.skipped, ...ghResult.skipped];

  console.log('\nfigma skills installed:');
  for (const msg of installed) {
    console.log(`  ✓  ${msg}`);
  }

  if (skipped.length) {
    console.log('\nSkipped (target not detected):');
    for (const msg of skipped) {
      console.log(`  -  ${msg}`);
    }
  }
}

export function uninstallSkills(): void {
  const home = homedir();
  const removed: string[] = [];
  const skipped: string[] = [];

  for (const skill of SKILLS) {
    const claudeTarget = join(home, '.claude', 'skills', skill.name, 'SKILL.md');
    if (existsSync(claudeTarget)) {
      unlinkSync(claudeTarget);
      try { rmdirSync(dirname(claudeTarget)); } catch { /* not empty */ }
      removed.push(`Claude Code  →  ${claudeTarget}`);
    }

    const cursorTarget = join(home, '.cursor', 'rules', `${skill.name}.md`);
    if (existsSync(cursorTarget)) {
      unlinkSync(cursorTarget);
      removed.push(`Cursor       →  ${cursorTarget}`);
    }

    const copilotSkillsTarget = join(home, '.copilot', 'skills', skill.name, 'SKILL.md');
    if (existsSync(copilotSkillsTarget)) {
      unlinkSync(copilotSkillsTarget);
      try { rmdirSync(dirname(copilotSkillsTarget)); } catch { /* not empty */ }
      removed.push(`Copilot      →  ${copilotSkillsTarget}`);
    }

    const copilotTarget = join('.github', 'copilot-instructions.md');
    const marker = `<!-- ${skill.name}-skill -->`;
    if (existsSync(copilotTarget)) {
      const existing = readFileSync(copilotTarget, 'utf-8');
      if (existing.includes(marker)) {
        const beforeIdx = existing.indexOf(marker);
        const afterIdx = existing.indexOf(marker, beforeIdx + marker.length);
        if (afterIdx !== -1) {
          const before = existing.slice(0, beforeIdx);
          const tail = existing.slice(afterIdx + marker.length);
          const newContent = (before + tail).trim();
          if (newContent) {
            writeFileSync(copilotTarget, newContent + '\n', 'utf-8');
          } else {
            unlinkSync(copilotTarget);
          }
          removed.push(`GitHub Copilot  →  ${copilotTarget} (${skill.name})`);
        }
      }
    }
  }

  if (removed.length) {
    console.log('\nfigma skills removed:');
    for (const msg of removed) {
      console.log(`  ✓  ${msg}`);
    }
  } else {
    console.log('\nNothing to remove — figma skills were not installed.');
  }

  if (skipped.length) {
    console.log('\nSkipped (not found):');
    for (const msg of skipped) {
      console.log(`  -  ${msg}`);
    }
  }
}
