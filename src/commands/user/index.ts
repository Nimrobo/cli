import { Command } from 'commander';
import { registerUserProfileCommand } from './profile';

export function registerUserCommands(program: Command): void {
  const userCommand = program
    .command('user')
    .description('User-related commands');

  registerUserProfileCommand(userCommand);
}
