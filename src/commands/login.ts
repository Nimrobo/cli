import { Command } from 'commander';
import { promptApiKey } from '../utils/prompts';
import { setApiKey } from '../utils/config';
import { resetApiClient } from '../api/client';
import { validateApiKey } from '../api/user';
import { success, output, isJsonOutput } from '../utils/output';
import { handleError } from '../utils/errors';

export function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Authenticate with your Nimrobo API key')
    .action(async () => {
      try {
        const apiKey = await promptApiKey();

        const user = await validateApiKey(apiKey);

        setApiKey(apiKey);
        resetApiClient();

        if (isJsonOutput()) {
          output({ success: true, user });
        } else {
          const displayName = user.name || user.email || user.id;
          const emailPart = user.email ? ` (${user.email})` : '';
          success(`Logged in as ${displayName}${emailPart}`);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
