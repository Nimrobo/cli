import { Command } from 'commander';
import { getApiKey, resolveProjectId } from '../../utils/config';
import { getSessionAudio } from '../../api/sessions';
import { output, isJsonOutput } from '../../utils/output';
import { handleError, requireAuth } from '../../utils/errors';
import { SessionType } from '../../types';

interface AudioOptions {
  type: string;
  project?: string;
}

export function registerSessionsAudioCommand(program: Command): void {
  program
    .command('audio <session-id>')
    .description('Get session audio URL')
    .requiredOption('-t, --type <type>', 'Session type: project or instant')
    .option('-p, --project <project-id>', 'Project ID (required when type=project)')
    .action(async (sessionId: string, options: AudioOptions) => {
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

        const result = await getSessionAudio(
          sessionId,
          sessionType,
          projectId || undefined
        );

        if (isJsonOutput()) {
          output(result);
        } else {
          console.log(result.audioUrl);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
