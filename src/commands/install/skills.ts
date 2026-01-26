import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { success, error } from '../../utils/output';
import { handleError } from '../../utils/errors';

// List of skill files to copy
const SKILLS_TO_COPY = [
  'SKILL.md',
  'commands.md',
  'voice-commands.md',
  'net-commands.md',
  'workflow.md',
];

/**
 * Get the path to the skills directory in the installed package
 */
function getSkillsDir(): string {
  // When installed globally or locally, skills are at package root
  return path.resolve(__dirname, '../../../skills');
}

/**
 * Register the install skills command
 */
export function registerInstallSkillsCommand(installCommand: Command): void {
  installCommand
    .command('skills')
    .description('Install Nimrobo CLI skills for Claude AI')
    .action(async () => {
      try {
        const cwd = process.cwd();
        const targetDir = path.join(cwd, '.claude', 'skills', 'nimrobo');
        const skillsDir = getSkillsDir();

        // Check if skills directory exists
        if (!fs.existsSync(skillsDir)) {
          error(`Skills directory not found: ${skillsDir}`);
          process.exit(1);
        }

        // Create target directory
        fs.mkdirSync(targetDir, { recursive: true });

        // Copy each skill file
        let copiedCount = 0;
        for (const filename of SKILLS_TO_COPY) {
          const sourcePath = path.join(skillsDir, filename);
          const targetPath = path.join(targetDir, filename);

          if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, targetPath);
            copiedCount++;
          } else {
            error(`Warning: ${filename} not found in package, skipping`);
          }
        }

        success(`Installed ${copiedCount} skill files to ${targetDir}`);
        console.log('\nFiles installed:');
        for (const filename of SKILLS_TO_COPY) {
          const targetPath = path.join(targetDir, filename);
          if (fs.existsSync(targetPath)) {
            console.log(`  ✓ ${filename}`);
          }
        }
        console.log('\nClaude can now use Nimrobo CLI skills from .claude/skills/nimrobo/');
      } catch (err) {
        handleError(err);
      }
    });
}

/**
 * Register the install command group
 */
export function registerInstallCommands(program: Command): void {
  const installCommand = program
    .command('install')
    .description('Install Nimrobo CLI resources');

  registerInstallSkillsCommand(installCommand);
}
