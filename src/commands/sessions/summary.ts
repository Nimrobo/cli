import { Command } from 'commander';
import { getApiKey, resolveProjectId } from '../../utils/config';
import { getSessionSummary } from '../../api/sessions';
import { output, isJsonOutput, info, printJson } from '../../utils/output';
import { handleError, requireAuth } from '../../utils/errors';

interface SummaryOptions {
  project?: string;
  instant?: boolean;
}

export function registerSessionsSummaryCommand(program: Command): void {
  program
    .command('summary <session-id>')
    .description('Get or trigger generation of session summary')
    .option('-p, --project <project-id>', 'Project ID (for project sessions)')
    .option('-i, --instant', 'Flag for instant link sessions')
    .action(async (sessionId: string, options: SummaryOptions) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const projectId = resolveProjectId(options.project);
        const result = await getSessionSummary(
          sessionId,
          projectId || undefined,
          options.instant
        );

        if (isJsonOutput()) {
          output(result);
        } else {
          if (result.generating) {
            info('Summary generation in progress...');
            console.log(`  Workflow ID: ${result.workflowId}`);
            console.log(`  Run ID: ${result.runId}`);
          } else if (result.summary) {
            console.log('Summary:');
            printJson(result.summary);
          } else {
            info('No summary available yet.');
          }
        }
      } catch (err) {
        handleError(err);
      }
    });
}
