import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import AdmZip from 'adm-zip';
import { handleError } from '../../utils/errors';
import { success, warn } from '../../utils/output';

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

function getDirSize(dirPath: string): number {
  let total = 0;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += getDirSize(full);
    } else {
      total += fs.statSync(full).size;
    }
  }
  return total;
}

export function registerExportCommand(program: Command): void {
  program
    .command('export')
    .description('Package the current directory as a character zip')
    .action(async () => {
      try {
        const cwd = process.cwd();

        // Validate agent.json
        const agentJsonPath = path.join(cwd, 'agent.json');
        if (!fs.existsSync(agentJsonPath)) {
          throw new Error('agent.json not found in current directory');
        }
        let agentJson: Record<string, unknown>;
        try {
          agentJson = JSON.parse(fs.readFileSync(agentJsonPath, 'utf-8'));
        } catch {
          throw new Error('agent.json is not valid JSON');
        }

        // Validate SOUL.md
        const soulMdPath = path.join(cwd, 'SOUL.md');
        if (!fs.existsSync(soulMdPath)) {
          throw new Error('SOUL.md not found in current directory');
        }
        const soulContent = fs.readFileSync(soulMdPath, 'utf-8').trim();
        if (!soulContent) {
          throw new Error('SOUL.md is empty');
        }

        // Extract name and version
        const name = agentJson.name as string | undefined;
        const version = agentJson.version as string | undefined;
        if (!name) {
          throw new Error('agent.json must have a "name" field');
        }
        if (!version) {
          throw new Error('agent.json must have a "version" field');
        }

        // Check size
        const dirSize = getDirSize(cwd);
        if (dirSize > MAX_SIZE_BYTES) {
          throw new Error(`Directory size (${(dirSize / 1024 / 1024).toFixed(1)} MB) exceeds the 20 MB limit`);
        } else if (dirSize > MAX_SIZE_BYTES * 0.8) {
          warn(`Directory size is ${(dirSize / 1024 / 1024).toFixed(1)} MB — approaching the 20 MB limit`);
        }

        // Create zip
        const outputName = `${name}-${version}.zip`;
        const outputPath = path.join(cwd, outputName);
        const zip = new AdmZip();
        zip.addLocalFolder(cwd, '', (filename: string) => filename !== outputName);
        zip.writeZip(outputPath);

        success(`Character exported: ${outputPath}`);
      } catch (err) {
        handleError(err);
      }
    });
}
