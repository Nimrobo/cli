import { Command } from 'commander';
import { getApiKey, resolveProjectId } from '../../utils/config';
import { getProject } from '../../api/projects';
import { output, isJsonOutput, printKeyValue } from '../../utils/output';
import { handleError, requireAuth } from '../../utils/errors';

export function registerProjectsGetCommand(program: Command): void {
  program
    .command('get <project-id>')
    .description('Get details of a specific project')
    .action(async (projectIdArg: string) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const projectId = resolveProjectId(projectIdArg);
        if (!projectId) {
          throw new Error('Project ID is required. Use a project ID or "default" if you have set a default project.');
        }

        const project = await getProject(projectId);

        if (isJsonOutput()) {
          output(project);
        } else {
          printKeyValue({
            ID: project.id,
            Name: project.name,
            Description: project.description || '—',
            Prompt: project.prompt.substring(0, 100) + (project.prompt.length > 100 ? '...' : ''),
            'Landing Page Title': project.landingPageTitle || '—',
            'Landing Page Info': project.landingPageInfo || '—',
            'Time Limit': `${project.timeLimitMinutes} minutes`,
            'Has Evaluator': project.evaluator ? 'Yes' : 'No',
            'Created At': project.createdAt ? new Date(project.createdAt).toLocaleString() : '—',
            'Updated At': project.updatedAt ? new Date(project.updatedAt).toLocaleString() : '—',
          });
        }
      } catch (err) {
        handleError(err);
      }
    });
}
