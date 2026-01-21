import { Command } from 'commander';
import { registerMyCommands } from './my';
import { registerUsersCommands } from './users';
import { registerOrgsCommands } from './orgs';
import { registerPostsCommands } from './posts';
import { registerApplicationsCommands } from './applications';
import { registerChannelsCommands } from './channels';
import { registerContextCommands } from './context';

export function registerNetCommands(program: Command): void {
  const netCommand = program
    .command('net')
    .description('Matching Network commands');

  // Register all subcommands
  registerMyCommands(netCommand);
  registerUsersCommands(netCommand);
  registerOrgsCommands(netCommand);
  registerPostsCommands(netCommand);
  registerApplicationsCommands(netCommand);
  registerChannelsCommands(netCommand);
  registerContextCommands(netCommand);
}
