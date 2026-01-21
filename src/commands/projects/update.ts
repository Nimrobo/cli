import { Command } from 'commander';
import { getApiKey, resolveProjectId } from '../../utils/config';
import { getProject, updateProject } from '../../api/projects';
import { readJsonFile, validateProjectInput } from '../../utils/file-input';
import { output, isJsonOutput, success, printKeyValue } from '../../utils/output';
import { handleError, requireAuth } from '../../utils/errors';
import { UpdateProjectInput } from '../../types';

interface UpdateOptions {
  file?: string;
  name?: string;
  prompt?: string;
  description?: string;
  landingTitle?: string;
  landingInfo?: string;
  timeLimit?: string;
}

export function registerProjectsUpdateCommand(program: Command): void {
  program
    .command('update <project-id>')
    .description('Update a project')
    .option('-f, --file <path>', 'Path to JSON file with project data')
    .option('-n, --name <name>', 'Project name')
    .option('-p, --prompt <prompt>', 'AI prompt for the voice agent')
    .option('-d, --description <description>', 'Project description')
    .option('--landing-title <title>', 'Landing page title')
    .option('--landing-info <info>', 'Landing page info text')
    .option('-t, --time-limit <minutes>', 'Time limit in minutes')
    .action(async (projectIdArg: string, options: UpdateOptions) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const projectId = resolveProjectId(projectIdArg);
        if (!projectId) {
          throw new Error('Project ID is required.');
        }

        let updateData: UpdateProjectInput;

        if (options.file) {
          // Load from file
          const fileData = readJsonFile<UpdateProjectInput>(options.file);
          validateProjectInput(fileData);
          updateData = fileData;
        } else {
          // Get existing project to merge with updates
          const existingProject = await getProject(projectId);

          updateData = {
            name: options.name || existingProject.name,
            prompt: options.prompt || existingProject.prompt,
            description: options.description !== undefined ? options.description : existingProject.description,
            landingPageTitle: options.landingTitle !== undefined ? options.landingTitle : existingProject.landingPageTitle,
            landingPageInfo: options.landingInfo !== undefined ? options.landingInfo : existingProject.landingPageInfo,
            timeLimitMinutes: options.timeLimit ? parseInt(options.timeLimit, 10) : existingProject.timeLimitMinutes,
          };
        }

        const project = await updateProject(projectId, updateData);

        if (isJsonOutput()) {
          output(project);
        } else {
          success(`Project updated: ${project.name}`);
          console.log();
          printKeyValue({
            ID: project.id,
            Name: project.name,
            Description: project.description || '—',
            'Time Limit': `${project.timeLimitMinutes} minutes`,
          });
        }
      } catch (err) {
        handleError(err);
      }
    });
}
