import { Command } from 'commander';
import { getApiKey, resolveProjectId } from '../../utils/config';
import { getSessionEvaluation } from '../../api/sessions';
import { output, isJsonOutput, printKeyValue, printJson } from '../../utils/output';
import { handleError, requireAuth } from '../../utils/errors';
import { SessionType } from '../../types';

interface EvaluationOptions {
  type: string;
  project?: string;
}

export function registerSessionsEvaluationCommand(program: Command): void {
  program
    .command('evaluation <session-id>')
    .description('Get session evaluation results')
    .requiredOption('-t, --type <type>', 'Session type: project or instant')
    .option('-p, --project <project-id>', 'Project ID (required when type=project)')
    .action(async (sessionId: string, options: EvaluationOptions) => {
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

        const result = await getSessionEvaluation(
          sessionId,
          sessionType,
          projectId || undefined
        );

        if (isJsonOutput()) {
          output(result);
        } else {
          printKeyValue({
            'Session ID': result.sessionId,
            Type: result.type,
            'Project ID': result.projectId || '—',
            'Evaluated At': result.evaluatedAt ? new Date(result.evaluatedAt).toLocaleString() : '—',
            'Has Error': result.hasError ? 'Yes' : 'No',
          });

          if (result.evaluationResults) {
            console.log();
            console.log('Evaluation Results:');
            printJson(result.evaluationResults);
          } else {
            console.log();
            console.log('No evaluation results available yet.');
          }
        }
      } catch (err) {
        handleError(err);
      }
    });
}
