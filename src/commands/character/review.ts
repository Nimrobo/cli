import { Command } from 'commander';
import chalk from 'chalk';
import { getApiKey } from '../../utils/config';
import { requireAuth, handleError } from '../../utils/errors';
import { success, output, isJsonOutput, printKeyValue } from '../../utils/output';
import { submitReviewDecision } from '../../api/character';

export function registerReviewCommand(program: Command): void {
  program
    .command('review <name>')
    .description('Submit a review decision for a character version')
    .requiredOption('--version <version>', 'Version to review')
    .option('--approve', 'Approve the character version')
    .option('--reject', 'Reject the character version')
    .option('--comment <comment>', 'Review comment (required when rejecting)')
    .action(async (name: string, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const version: string = options.version;

        if (!options.approve && !options.reject) {
          throw new Error('Either --approve or --reject is required');
        }
        if (options.approve && options.reject) {
          throw new Error('Cannot use both --approve and --reject');
        }

        const decision: 'approve' | 'reject' = options.approve ? 'approve' : 'reject';

        if (decision === 'reject' && !options.comment) {
          throw new Error('--comment is required when rejecting a character');
        }

        const result = await submitReviewDecision(name, version, decision, options.comment);

        if (isJsonOutput()) {
          output(result);
        } else {
          const decisionLabel = decision === 'approve' ? chalk.green('approved') : chalk.red('rejected');
          success(`Review submitted: ${result.character} v${result.version} — ${decisionLabel}`);
          console.log();
          printKeyValue({
            'Character': result.character,
            'Version': result.version,
            'Decision': decisionLabel,
          });
        }
      } catch (err) {
        handleError(err);
      }
    });
}
