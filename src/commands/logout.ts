import { Command } from 'commander';
import { clearApiKey } from '../utils/config';
import { resetApiClient } from '../api/client';
import { success, output, isJsonOutput } from '../utils/output';

export function registerLogoutCommand(program: Command): void {
  program
    .command('logout')
    .description('Remove stored credentials')
    .action(() => {
      clearApiKey();
      resetApiClient();

      if (isJsonOutput()) {
        output({ success: true, message: 'Logged out successfully' });
      } else {
        success('Logged out successfully');
      }
    });
}
