import { Command } from 'commander';
import chalk from 'chalk';
import { getApiKey, getDefaultProject, getApiBaseUrl } from '../utils/config';
import { getUserProfile } from '../api/user';
import { getProject } from '../api/projects';
import { output, isJsonOutput } from '../utils/output';
import { handleError } from '../utils/errors';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Display current authentication status and configuration')
    .action(async () => {
      try {
        const apiKey = getApiKey();
        const defaultProjectId = getDefaultProject();
        const apiUrl = getApiBaseUrl();

        if (!apiKey) {
          if (isJsonOutput()) {
            output({
              authenticated: false,
              apiUrl,
            });
          } else {
            console.log(chalk.red('✗'), 'Not authenticated');
            console.log(`  API: ${apiUrl}`);
            console.log();
            console.log(chalk.gray("  Run 'nimrobo login' to authenticate"));
          }
          return;
        }

        const user = await getUserProfile();
        const displayName = user.name || user.email || user.id;
        const emailPart = user.email ? ` (${user.email})` : '';

        let defaultProject = null;
        if (defaultProjectId) {
          try {
            defaultProject = await getProject(defaultProjectId);
          } catch {
            // Project may have been deleted
          }
        }

        if (isJsonOutput()) {
          output({
            authenticated: true,
            user,
            defaultProject: defaultProject
              ? { id: defaultProject.id, name: defaultProject.name }
              : null,
            apiUrl,
          });
        } else {
          console.log(chalk.green('✓'), `Authenticated as ${displayName}${emailPart}`);

          if (defaultProject) {
            console.log(`  Default project: ${defaultProject.name} (${defaultProject.id})`);
          } else if (defaultProjectId) {
            console.log(`  Default project: ${chalk.yellow('(not found)')} ${defaultProjectId}`);
          }

          console.log(`  API: ${apiUrl}`);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
