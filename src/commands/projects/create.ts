import { Command } from 'commander';
import { getApiKey } from '../../utils/config';
import { createProject } from '../../api/projects';
import { promptProjectName, promptProjectPrompt } from '../../utils/prompts';
import { readJsonFile, validateProjectInput } from '../../utils/file-input';
import { output, isJsonOutput, success, printKeyValue } from '../../utils/output';
import { handleError, requireAuth } from '../../utils/errors';
import { CreateProjectInput } from '../../types';

interface CreateOptions {
  file?: string;
  name?: string;
  prompt?: string;
  description?: string;
  landingTitle?: string;
  landingInfo?: string;
  timeLimit?: string;
}

export function registerProjectsCreateCommand(program: Command): void {
  program
    .command('create')
    .description('Create a new project')
    .option('-f, --file <path>', 'Path to JSON file with project data')
    .option('-n, --name <name>', 'Project name')
    .option('-p, --prompt <prompt>', 'AI prompt for the voice agent')
    .option('-d, --description <description>', 'Project description')
    .option('--landing-title <title>', 'Landing page title')
    .option('--landing-info <info>', 'Landing page info text')
    .option('-t, --time-limit <minutes>', 'Time limit in minutes')
    .action(async (options: CreateOptions) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        let projectData: CreateProjectInput;

        if (options.file) {
          // Load from file
          const fileData = readJsonFile<CreateProjectInput>(options.file);
          validateProjectInput(fileData);
          projectData = fileData;
        } else if (options.name && options.prompt) {
          // Use flags
          projectData = {
            name: options.name,
            prompt: options.prompt,
            description: options.description,
            landingPageTitle: options.landingTitle,
            landingPageInfo: options.landingInfo,
            timeLimitMinutes: options.timeLimit ? parseInt(options.timeLimit, 10) : undefined,
          };
        } else {
          // Interactive mode
          const name = options.name || await promptProjectName();
          const prompt = options.prompt || await promptProjectPrompt();

          projectData = {
            name,
            prompt,
            description: options.description,
            landingPageTitle: options.landingTitle,
            landingPageInfo: options.landingInfo,
            timeLimitMinutes: options.timeLimit ? parseInt(options.timeLimit, 10) : undefined,
          };
        }

        const project = await createProject(projectData);

        if (isJsonOutput()) {
          output(project);
        } else {
          success(`Project created: ${project.name}`);
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
