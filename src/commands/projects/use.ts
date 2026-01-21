import { Command } from 'commander';
import { getApiKey, setDefaultProject, getDefaultProject } from '../../utils/config';
import { getProject } from '../../api/projects';
import { output, isJsonOutput, success, info } from '../../utils/output';
import { handleError, requireAuth } from '../../utils/errors';

interface UseOptions {
  clear?: boolean;
}

export function registerProjectsUseCommand(program: Command): void {
  program
    .command('use [project-id]')
    .description('Set or clear the default project')
    .option('-c, --clear', 'Clear the default project setting')
    .action(async (projectId: string | undefined, options: UseOptions) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        if (options.clear) {
          setDefaultProject(null);

          if (isJsonOutput()) {
            output({ success: true, defaultProject: null });
          } else {
            success('Default project cleared');
          }
          return;
        }

        if (!projectId) {
          // Show current default
          const currentDefault = getDefaultProject();

          if (!currentDefault) {
            if (isJsonOutput()) {
              output({ defaultProject: null });
            } else {
              info('No default project set');
            }
            return;
          }

          try {
            const project = await getProject(currentDefault);
            if (isJsonOutput()) {
              output({ defaultProject: { id: project.id, name: project.name } });
            } else {
              info(`Default project: ${project.name} (${project.id})`);
            }
          } catch {
            if (isJsonOutput()) {
              output({ defaultProject: { id: currentDefault, name: null } });
            } else {
              info(`Default project: ${currentDefault} (not found)`);
            }
          }
          return;
        }

        // Validate the project exists
        const project = await getProject(projectId);

        setDefaultProject(projectId);

        if (isJsonOutput()) {
          output({ success: true, defaultProject: { id: project.id, name: project.name } });
        } else {
          success(`Default project set to: ${project.name} (${project.id})`);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
