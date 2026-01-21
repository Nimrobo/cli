import { Command } from 'commander';
import { getApiKey, resolveProjectId } from '../../utils/config';
import { getSessionTranscript } from '../../api/sessions';
import { output, isJsonOutput, printJson } from '../../utils/output';
import { handleError, requireAuth } from '../../utils/errors';
import { SessionType } from '../../types';

interface TranscriptOptions {
  type: string;
  project?: string;
}

export function registerSessionsTranscriptCommand(program: Command): void {
  program
    .command('transcript <session-id>')
    .description('Get session transcript')
    .requiredOption('-t, --type <type>', 'Session type: project or instant')
    .option('-p, --project <project-id>', 'Project ID (required when type=project)')
    .action(async (sessionId: string, options: TranscriptOptions) => {
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

        const result = await getSessionTranscript(
          sessionId,
          sessionType,
          projectId || undefined
        );

        if (isJsonOutput()) {
          output(result);
        } else {
          // Print transcript in a readable format
          printJson(result.transcript);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
