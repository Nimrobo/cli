import { Command } from 'commander';
import { registerLinksListCommand } from './list';
import { registerLinksCreateCommand } from './create';
import { registerLinksCancelCommand } from './cancel';
import { registerLinksUpdateCommand } from './update';

export function registerLinksCommands(program: Command): void {
  const linksCommand = program
    .command('links')
    .description('Voice link management commands');

  registerLinksListCommand(linksCommand);
  registerLinksCreateCommand(linksCommand);
  registerLinksCancelCommand(linksCommand);
  registerLinksUpdateCommand(linksCommand);
}
