import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import { getApiKey } from '../../utils/config';
import { requireAuth, handleError } from '../../utils/errors';
import { success, output, isJsonOutput, printKeyValue } from '../../utils/output';
import { publishCharacter } from '../../api/character';
import { CharacterVersionState } from '../../types';

function stateColor(state: CharacterVersionState): string {
  switch (state) {
    case 'draft': return chalk.gray(state);
    case 'submitted': return chalk.yellow(state);
    case 'in_review': return chalk.blue(state);
    case 'approved': return chalk.green(state);
    case 'rejected': return chalk.red(state);
    default: return state;
  }
}

export function registerPublishCommand(program: Command): void {
  program
    .command('publish <zip>')
    .description('Publish a character zip to the Character Hub')
    .option('--draft', 'Publish as draft (skips review queue)')
    .action(async (zip: string, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const zipPath = path.resolve(zip);
        if (!fs.existsSync(zipPath)) {
          throw new Error(`File not found: ${zipPath}`);
        }
        if (!zipPath.endsWith('.zip')) {
          throw new Error('File must be a .zip archive');
        }

        const result = await publishCharacter(zipPath, options.draft ?? false);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(`Character published: ${result.character} v${result.version}`);
          console.log();
          printKeyValue({
            'Character': result.character,
            'Version': result.version,
            'State': stateColor(result.state),
          });
        }
      } catch (err) {
        handleError(err);
      }
    });
}
