import { Command } from 'commander';
import { registerCreateCommand } from './create';
import { registerExportCommand } from './export';
import { registerPublishCommand } from './publish';
import { registerStatusCommand } from './status';
import { registerListCommand } from './list';
import { registerImportCommand } from './import';
import { registerReviewCommand } from './review';

export function registerCharacterCommands(program: Command): void {
  const characterCommand = program
    .command('character')
    .description('Character Hub commands');

  registerCreateCommand(characterCommand);
  registerExportCommand(characterCommand);
  registerPublishCommand(characterCommand);
  registerStatusCommand(characterCommand);
  registerListCommand(characterCommand);
  registerImportCommand(characterCommand);
  registerReviewCommand(characterCommand);
}
