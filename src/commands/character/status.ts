import { Command } from 'commander';
import chalk from 'chalk';
import { getApiKey } from '../../utils/config';
import { requireAuth, handleError } from '../../utils/errors';
import { success, output, isJsonOutput, printKeyValue, printTable } from '../../utils/output';
import { getCharacterStatus } from '../../api/character';
import { CharacterVersionState, CharacterState } from '../../types';

function versionStateColor(state: CharacterVersionState): string {
  switch (state) {
    case 'draft': return chalk.gray(state);
    case 'submitted': return chalk.yellow(state);
    case 'in_review': return chalk.blue(state);
    case 'approved': return chalk.green(state);
    case 'rejected': return chalk.red(state);
    default: return state;
  }
}

function characterStateColor(state: CharacterState): string {
  switch (state) {
    case 'draft': return chalk.gray(state);
    case 'submitted': return chalk.yellow(state);
    case 'in_review': return chalk.blue(state);
    case 'published': return chalk.green(state);
    case 'unlisted': return chalk.dim(state);
    case 'deprecated': return chalk.red(state);
    default: return state;
  }
}

export function registerStatusCommand(program: Command): void {
  program
    .command('status <name>')
    .description('Check the status of a character')
    .action(async (name: string) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const result = await getCharacterStatus(name);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(`Character: ${result.character.name}`);
          console.log();
          printKeyValue({
            'State': characterStateColor(result.character.state),
            'Latest Published Version': result.character.latest_published_version ?? '—',
            'Total Clones': result.character.total_clones,
          });

          if (result.versions.length > 0) {
            console.log();
            console.log(chalk.bold('Versions:'));
            console.log();
            printTable(
              ['Version', 'State', 'Submitted', 'Reviewed', 'Comment'],
              result.versions.map(v => [
                v.version,
                versionStateColor(v.state),
                v.submitted_at ? new Date(v.submitted_at).toLocaleDateString() : '—',
                v.reviewed_at ? new Date(v.reviewed_at).toLocaleDateString() : '—',
                v.review_comment ?? '—',
              ]),
            );
          }
        }
      } catch (err) {
        handleError(err);
      }
    });
}
