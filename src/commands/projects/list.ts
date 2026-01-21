import { Command } from 'commander';
import { getApiKey } from '../../utils/config';
import { listProjects } from '../../api/projects';
import { output, isJsonOutput, printTable } from '../../utils/output';
import { handleError, requireAuth } from '../../utils/errors';

export function registerProjectsListCommand(program: Command): void {
  program
    .command('list')
    .description('List all projects')
    .action(async () => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const projects = await listProjects();

        if (isJsonOutput()) {
          output(projects);
        } else {
          if (projects.length === 0) {
            console.log('No projects found.');
            return;
          }

          printTable(
            ['ID', 'Name', 'Time Limit', 'Created'],
            projects.map(p => [
              p.id,
              p.name,
              `${p.timeLimitMinutes} min`,
              p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—',
            ])
          );
        }
      } catch (err) {
        handleError(err);
      }
    });
}
