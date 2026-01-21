import { Command } from 'commander';
import { registerProjectsListCommand } from './list';
import { registerProjectsCreateCommand } from './create';
import { registerProjectsGetCommand } from './get';
import { registerProjectsUpdateCommand } from './update';
import { registerProjectsUseCommand } from './use';

export function registerProjectsCommands(program: Command): void {
  const projectsCommand = program
    .command('projects')
    .description('Project management commands');

  registerProjectsListCommand(projectsCommand);
  registerProjectsCreateCommand(projectsCommand);
  registerProjectsGetCommand(projectsCommand);
  registerProjectsUpdateCommand(projectsCommand);
  registerProjectsUseCommand(projectsCommand);
}
