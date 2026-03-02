import { Command } from 'commander';
import chalk from 'chalk';
import { getApiKey } from '../../utils/config';
import { requireAuth, handleError } from '../../utils/errors';
import { success, output, isJsonOutput, printTable, info } from '../../utils/output';
import { listMyCharacters } from '../../api/character';
import { CharacterState } from '../../types';

function stateColor(state: CharacterState): string {
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

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List all your characters')
    .action(async () => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const characters = await listMyCharacters();

        if (isJsonOutput()) {
          output(characters);
        } else {
          if (characters.length === 0) {
            info('No characters found.');
            console.log();
            console.log(chalk.gray('  Get started: nimrobo character export && nimrobo character publish <zip>'));
            return;
          }

          success(`Your characters (${characters.length}):`);
          console.log();
          printTable(
            ['Name', 'State', 'Latest Version', 'Clones', 'Tags'],
            characters.map(c => [
              c.name,
              stateColor(c.state),
              c.latest_published_version ?? '—',
              String(c.total_clones),
              c.tags.join(', ') || '—',
            ]),
          );
        }
      } catch (err) {
        handleError(err);
      }
    });
}
