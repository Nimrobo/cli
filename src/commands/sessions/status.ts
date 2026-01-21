import { Command } from 'commander';
import { getApiKey, resolveProjectId } from '../../utils/config';
import { getSessionStatus } from '../../api/sessions';
import { output, isJsonOutput, printKeyValue } from '../../utils/output';
import { handleError, requireAuth } from '../../utils/errors';
import { SessionType } from '../../types';

interface StatusOptions {
  type: string;
  project?: string;
}

export function registerSessionsStatusCommand(program: Command): void {
  program
    .command('status <session-id>')
    .description('Get session status')
    .requiredOption('-t, --type <type>', 'Session type: project or instant')
    .option('-p, --project <project-id>', 'Project ID (required when type=project)')
    .action(async (sessionId: string, options: StatusOptions) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        if (options.type !== 'project' && options.type !== 'instant') {
          throw new Error('Type must be "project" or "instant"');
        }

        const sessionType = options.type as SessionType;
        const projectId = resolveProjectId(options.project);

        if (sessionType === 'project' && !projectId) {
          throw new Error('Project ID is required when type=project');
        }

        const status = await getSessionStatus(
          sessionId,
          sessionType,
          projectId || undefined
        );

        if (isJsonOutput()) {
          output(status);
        } else {
          printKeyValue({
            'Session ID': status.sessionId,
            Type: status.type,
            'Project ID': status.projectId || '—',
            Status: status.status,
            'Agent ID': status.agentId || '—',
            'Created At': status.createdAt ? new Date(status.createdAt).toLocaleString() : '—',
            'Updated At': status.updatedAt ? new Date(status.updatedAt).toLocaleString() : '—',
            'Completed At': status.completedAt ? new Date(status.completedAt).toLocaleString() : '—',
          });
        }
      } catch (err) {
        handleError(err);
      }
    });
}
