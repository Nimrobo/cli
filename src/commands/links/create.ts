import { Command } from 'commander';
import { getApiKey, resolveProjectId } from '../../utils/config';
import { createProjectLinks, createInstantLinks } from '../../api/links';
import { promptLabels, promptExpiry, promptInstantLinkPrompt } from '../../utils/prompts';
import { readJsonFile, validateLinksInput } from '../../utils/file-input';
import { output, isJsonOutput, printUrls } from '../../utils/output';
import { handleError, requireAuth } from '../../utils/errors';
import { CreateProjectLinksInput, CreateInstantLinksInput, ExpiryPreset } from '../../types';

interface CreateOptions {
  file?: string;
  project?: string;
  labels?: string;
  expiry?: string;
  prompt?: string;
  landingTitle?: string;
  landingInfo?: string;
  timeLimit?: string;
}

export function registerLinksCreateCommand(program: Command): void {
  program
    .command('create')
    .description('Create voice links')
    .option('-f, --file <path>', 'Path to JSON file with link data')
    .option('-p, --project <project-id>', 'Project ID or "default" (omit for instant links)')
    .option('-l, --labels <labels>', 'Comma-separated list of link labels')
    .option('-e, --expiry <preset>', 'Expiry preset: 1_day, 1_week, 1_month')
    .option('--prompt <prompt>', 'AI prompt (required for instant links)')
    .option('--landing-title <title>', 'Landing page title (instant links only)')
    .option('--landing-info <info>', 'Landing page info (instant links only)')
    .option('-t, --time-limit <minutes>', 'Time limit in minutes (instant links only)')
    .action(async (options: CreateOptions) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const projectId = resolveProjectId(options.project);
        const isProjectLink = !!projectId;

        if (isProjectLink) {
          // Create project links
          let linkData: CreateProjectLinksInput;

          if (options.file) {
            const fileData = readJsonFile<CreateProjectLinksInput>(options.file);
            validateLinksInput(fileData, false);
            linkData = fileData;
          } else if (options.labels && options.expiry) {
            linkData = {
              labels: options.labels.split(',').map(s => s.trim()),
              expiryPreset: options.expiry as ExpiryPreset,
            };
          } else {
            // Interactive mode
            const labels = options.labels
              ? options.labels.split(',').map(s => s.trim())
              : await promptLabels();
            const expiryPreset = (options.expiry as ExpiryPreset) || await promptExpiry();

            linkData = { labels, expiryPreset };
          }

          const links = await createProjectLinks(projectId, linkData);

          if (isJsonOutput()) {
            output(links);
          } else {
            const urls = links.map(l => l.url).filter((url): url is string => !!url);
            printUrls(urls);
          }
        } else {
          // Create instant links
          let linkData: CreateInstantLinksInput;

          if (options.file) {
            const fileData = readJsonFile<CreateInstantLinksInput>(options.file);
            validateLinksInput(fileData, true);
            linkData = fileData;
          } else if (options.labels && options.expiry && options.prompt) {
            linkData = {
              labels: options.labels.split(',').map(s => s.trim()),
              expiryPreset: options.expiry as ExpiryPreset,
              prompt: options.prompt,
              landingPageTitle: options.landingTitle,
              landingPageInfo: options.landingInfo,
              timeLimitMinutes: options.timeLimit ? parseInt(options.timeLimit, 10) : undefined,
            };
          } else {
            // Interactive mode
            const labels = options.labels
              ? options.labels.split(',').map(s => s.trim())
              : await promptLabels();
            const expiryPreset = (options.expiry as ExpiryPreset) || await promptExpiry();
            const prompt = options.prompt || await promptInstantLinkPrompt();

            linkData = {
              labels,
              expiryPreset,
              prompt,
              landingPageTitle: options.landingTitle,
              landingPageInfo: options.landingInfo,
              timeLimitMinutes: options.timeLimit ? parseInt(options.timeLimit, 10) : undefined,
            };
          }

          const links = await createInstantLinks(linkData);

          if (isJsonOutput()) {
            output(links);
          } else {
            const urls = links.map(l => l.url).filter((url): url is string => !!url);
            printUrls(urls);
          }
        }
      } catch (err) {
        handleError(err);
      }
    });
}
