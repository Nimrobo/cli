import { Command } from 'commander';
import { getApiKey, resolveProjectId } from '../../utils/config';
import { regenerateSessionSummary } from '../../api/sessions';
import { output, isJsonOutput, success } from '../../utils/output';
import { handleError, requireAuth } from '../../utils/errors';

interface RegenerateOptions {
  project?: string;
  instant?: boolean;
}

export function registerSessionsSummaryRegenerateCommand(program: Command): void {
  program
    .command('summary:regenerate <session-id>')
    .description('Force regeneration of session summary')
    .option('-p, --project <project-id>', 'Project ID (for project sessions)')
    .option('-i, --instant', 'Flag for instant link sessions')
    .action(async (sessionId: string, options: RegenerateOptions) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const projectId = resolveProjectId(options.project);
        const result = await regenerateSessionSummary(
          sessionId,
          projectId || undefined,
          options.instant
        );

        if (isJsonOutput()) {
          output(result);
        } else {
          success('Summary regeneration started');
          console.log(`  Workflow ID: ${result.workflowId}`);
          console.log(`  Run ID: ${result.runId}`);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
