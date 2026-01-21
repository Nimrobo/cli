import { Command } from 'commander';
import { getApiKey, resolveProjectId } from '../../utils/config';
import { cancelProjectLink } from '../../api/links';
import { output, isJsonOutput, success } from '../../utils/output';
import { handleError, requireAuth } from '../../utils/errors';

interface CancelOptions {
  project: string;
}

export function registerLinksCancelCommand(program: Command): void {
  program
    .command('cancel <link-id>')
    .description('Cancel an active project link')
    .requiredOption('-p, --project <project-id>', 'Project ID or "default"')
    .action(async (linkId: string, options: CancelOptions) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const projectId = resolveProjectId(options.project);
        if (!projectId) {
          throw new Error('Project ID is required. Use a project ID or "default" if you have set a default project.');
        }

        await cancelProjectLink(linkId, projectId);

        if (isJsonOutput()) {
          output({ success: true, message: 'Link cancelled successfully' });
        } else {
          success('Link cancelled successfully');
        }
      } catch (err) {
        handleError(err);
      }
    });
}
