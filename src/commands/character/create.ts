import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import inquirer from 'inquirer';
import { handleError } from '../../utils/errors';
import { success, warn } from '../../utils/output';

const VALID_TIERS = ['free', 'pro', 'enterprise'] as const;
type Tier = typeof VALID_TIERS[number];

function validateName(input: string): true | string {
  const trimmed = input.trim();
  if (trimmed.length < 3 || trimmed.length > 50) {
    return 'Name must be between 3 and 50 characters';
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(trimmed)) {
    return 'Name must be lowercase alphanumeric with hyphens, and must start and end with alphanumeric';
  }
  return true;
}

function validateVersion(input: string): true | string {
  if (!/^\d+\.\d+\.\d+$/.test(input.trim())) {
    return 'Version must be a valid semver string (e.g. 1.0.0)';
  }
  return true;
}

function toTitleCase(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildAgentJson(name: string, version: string, description: string, tier: Tier, tags: string[]): string {
  return JSON.stringify(
    {
      name,
      version,
      description,
      tags,
      minimum_tier: tier,
      skills: [],
      global_packages: [],
    },
    null,
    2
  );
}

function buildSoulMd(name: string, description: string): string {
  const title = toTitleCase(name);
  return `---
description: ${description}
---

# ${title}

You are ${name}, a helpful AI assistant.

## Personality

- Be clear and concise
- Be helpful and proactive
- Communicate in a friendly, professional tone

## Instructions

<!-- Add your character's core instructions here -->
`;
}

export function registerCreateCommand(program: Command): void {
  program
    .command('create [name]')
    .description('Scaffold a new character directory with agent.json and SOUL.md')
    .option('--description <desc>', 'Short description (max 200 chars)')
    .option('--version <version>', 'Initial semver version (default: 1.0.0)')
    .option('--tier <tier>', 'Minimum tier to clone (free / pro / enterprise)')
    .option('--tags <tags>', 'Comma-separated tags (up to 5)')
    .action(async (nameArg: string | undefined, options: { description?: string; version?: string; tier?: string; tags?: string }) => {
      try {
        // Validate flags before prompting
        if (options.tier && !VALID_TIERS.includes(options.tier as Tier)) {
          throw new Error(`Invalid tier "${options.tier}". Valid options are: ${VALID_TIERS.join(', ')}`);
        }
        if (options.version) {
          const versionResult = validateVersion(options.version);
          if (versionResult !== true) {
            throw new Error(`Invalid version "${options.version}". ${versionResult}`);
          }
        }

        // Collect name
        let name: string;
        if (nameArg) {
          const result = validateName(nameArg);
          if (result !== true) {
            throw new Error(`Invalid name "${nameArg}". ${result}`);
          }
          name = nameArg.trim();
        } else {
          const answer = await inquirer.prompt([
            {
              type: 'input',
              name: 'name',
              message: 'Character name (lowercase, hyphens only):',
              validate: validateName,
            },
          ]);
          name = answer.name.trim();
        }

        // Collect description
        let description: string;
        if (options.description !== undefined) {
          const trimmed = options.description.trim();
          if (!trimmed) throw new Error('Description cannot be empty');
          if (trimmed.length > 200) throw new Error('Description must be 200 characters or fewer');
          description = trimmed;
        } else {
          const answer = await inquirer.prompt([
            {
              type: 'input',
              name: 'description',
              message: 'Description (max 200 chars):',
              validate: (input: string) => {
                const t = input.trim();
                if (!t) return 'Description is required';
                if (t.length > 200) return 'Description must be 200 characters or fewer';
                return true;
              },
            },
          ]);
          description = answer.description.trim();
        }

        // Collect version
        let version: string;
        if (options.version !== undefined) {
          version = options.version.trim();
        } else {
          const answer = await inquirer.prompt([
            {
              type: 'input',
              name: 'version',
              message: 'Version:',
              default: '1.0.0',
              validate: validateVersion,
            },
          ]);
          version = answer.version.trim();
        }

        // Collect tier
        let tier: Tier;
        if (options.tier !== undefined) {
          tier = options.tier as Tier;
        } else {
          const answer = await inquirer.prompt([
            {
              type: 'list',
              name: 'tier',
              message: 'Minimum tier to clone:',
              choices: VALID_TIERS,
              default: 'free',
            },
          ]);
          tier = answer.tier;
        }

        // Collect tags
        let tags: string[];
        if (options.tags !== undefined) {
          tags = options.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
          if (tags.length > 5) {
            warn('More than 5 tags provided — only the first 5 will be used');
            tags = tags.slice(0, 5);
          }
        } else {
          const answer = await inquirer.prompt([
            {
              type: 'input',
              name: 'tags',
              message: 'Tags (comma-separated, optional):',
            },
          ]);
          const raw: string = answer.tags || '';
          tags = raw.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
          if (tags.length > 5) {
            warn('More than 5 tags provided — only the first 5 will be used');
            tags = tags.slice(0, 5);
          }
        }

        // Create directory
        const dest = path.join(process.cwd(), name);
        if (fs.existsSync(dest)) {
          throw new Error(`Directory already exists: ./${name}`);
        }
        fs.mkdirSync(dest);

        // Write files
        fs.writeFileSync(path.join(dest, 'agent.json'), buildAgentJson(name, version, description, tier, tags), 'utf-8');
        fs.writeFileSync(path.join(dest, 'SOUL.md'), buildSoulMd(name, description), 'utf-8');

        console.log();
        success(`Character created: ./${name}/`);
        console.log();
        console.log('  Next steps:');
        console.log(`    cd ${name}`);
        console.log('    Edit SOUL.md to define your character\'s personality');
        console.log('    nimrobo character export');
        console.log(`    nimrobo character publish ${name}-${version}.zip`);
        console.log();
      } catch (err) {
        handleError(err);
      }
    });
}
