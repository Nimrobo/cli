import { Command } from 'commander';
import { getApiKey, setContext } from '../../../utils/config';
import { requireAuth, handleError } from '../../../utils/errors';
import { success, output, isJsonOutput, printKeyValue, printTable } from '../../../utils/output';
import { getUserById, searchUsers } from '../../../api/net/users';

export function registerUsersCommands(program: Command): void {
  const usersCommand = program
    .command('users')
    .description('Manage and search users');

  // net users get <userId>
  usersCommand
    .command('get <userId>')
    .description('Get a user\'s public profile')
    .option('--use', 'Set this user as current context')
    .action(async (userId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const user = await getUserById(userId);

        if (options.use) {
          setContext('user', user.id);
        }

        if (isJsonOutput()) {
          output(user);
        } else {
          success('User profile:');
          console.log();
          printKeyValue({
            'ID': user.id,
            'Name': user.profile?.data?.name,
            'Location': user.profile?.data?.location
              ? `${user.profile.data.location.city || ''}${user.profile.data.location.city && user.profile.data.location.country ? ', ' : ''}${user.profile.data.location.country || ''}`
              : null,
            'Bio': user.profile?.data?.short_bio,
            'Joined': user.created_at,
          });
          if (user.profile?.content) {
            console.log();
            console.log('Content:');
            console.log(user.profile.content);
          }
          if (options.use) {
            console.log();
            success(`Set as current user context`);
          }
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net users search
  usersCommand
    .command('search')
    .description('Search for users')
    .option('--keyword <keyword>', 'Search keyword')
    .option('--name <name>', 'Filter by name')
    .option('--city <city>', 'Filter by city')
    .option('--country <country>', 'Filter by country')
    .option('--limit <limit>', 'Number of results', '20')
    .option('--skip <skip>', 'Number of results to skip', '0')
    .option('--sort <field>', 'Sort field (created_at)')
    .option('--order <order>', 'Sort order (asc, desc)', 'desc')
    .action(async (options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const filters: Record<string, string> = {};
        if (options.name) filters.name = options.name;
        if (options.city) filters.location_city = options.city;
        if (options.country) filters.location_country = options.country;

        const result = await searchUsers({
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          keyword: options.keyword,
          pagination: {
            limit: parseInt(options.limit),
            skip: parseInt(options.skip),
          },
          sort: options.sort ? { field: options.sort, order: options.order } : undefined,
        });

        if (isJsonOutput()) {
          output(result);
        } else {
          if (result.data.length === 0) {
            success('No users found');
            return;
          }

          success(`Users found (${result.data.length}${result.pagination.has_more ? '+' : ''}):`);
          console.log();
          printTable(
            ['ID', 'Name', 'Location', 'Bio'],
            result.data.map(user => [
              user.id,
              user.profile?.data?.name || '',
              user.profile?.data?.location?.city || '',
              (user.profile?.data?.short_bio || '').substring(0, 40),
            ])
          );
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net users use <userId>
  usersCommand
    .command('use <userId>')
    .description('Set a user as current context')
    .action(async (userId) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        // Verify user exists
        const user = await getUserById(userId);
        setContext('user', user.id);

        if (isJsonOutput()) {
          output({ success: true, user_id: user.id });
        } else {
          success(`Set current user to: ${user.profile?.data?.name || user.id}`);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
