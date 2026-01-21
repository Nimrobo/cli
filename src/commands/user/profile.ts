import { Command } from 'commander';
import { getApiKey } from '../../utils/config';
import { getUserProfile } from '../../api/user';
import { output, isJsonOutput, printKeyValue } from '../../utils/output';
import { handleError, requireAuth } from '../../utils/errors';

export function registerUserProfileCommand(program: Command): void {
  program
    .command('profile')
    .description("Display authenticated user's profile information")
    .action(async () => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const user = await getUserProfile();

        if (isJsonOutput()) {
          output(user);
        } else {
          printKeyValue({
            ID: user.id,
            Name: user.name,
            Email: user.email,
            'Profile Completed': user.profileCompleted ? 'Yes' : 'No',
            'Created At': user.createdAt,
            'Last Login': user.lastLoginAt,
          });
        }
      } catch (err) {
        handleError(err);
      }
    });
}
