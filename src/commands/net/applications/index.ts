import { Command } from 'commander';
import { getApiKey } from '../../../utils/config';
import { requireAuth, handleError } from '../../../utils/errors';
import { success, output, isJsonOutput, printKeyValue, printTable, info } from '../../../utils/output';
import {
  readJsonInput,
  validateNetAcceptInput,
  validateNetRejectInput,
  validateNetBatchActionInput,
} from '../../../utils/file-input';
import {
  getApplicationById,
  acceptApplication,
  rejectApplication,
  withdrawApplication,
  batchAction,
} from '../../../api/net/applications';

export function registerApplicationsCommands(program: Command): void {
  const applicationsCommand = program
    .command('applications')
    .description('Manage applications');

  // net applications get <applicationId>
  applicationsCommand
    .command('get <applicationId>')
    .description('Get application details')
    .action(async (applicationId) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const application = await getApplicationById(applicationId);

        if (isJsonOutput()) {
          output(application);
        } else {
          success('Application details:');
          console.log();
          printKeyValue({
            'ID': application.id,
            'Post ID': application.post_id,
            'Applicant ID': application.applicant_id,
            'Applicant': application.applicant_name,
            'Status': application.status,
            'Channel ID': application.channel_id,
            'Rejection Reason': application.rejection_reason,
            'Created': application.created_at,
            'Updated': application.updated_at,
          });
          if (application.data) {
            console.log();
            console.log('Application Data:');
            printKeyValue(application.data as Record<string, unknown>, 1);
          }
          if (application.content_md) {
            console.log();
            console.log('Content:');
            console.log(application.content_md);
          }
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net applications accept <applicationId>
  applicationsCommand
    .command('accept <applicationId>')
    .description('Accept an application')
    .option('-f, --file <path>', 'JSON file with accept options')
    .option('--stdin', 'Read JSON input from stdin')
    .option('--channel-expires <date>', 'Channel expiration date (ISO format)')
    .option('--context <context>', 'Channel context')
    .action(async (applicationId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        // Parse JSON input if provided
        let inputData: Record<string, unknown> = {};
        if (options.file || options.stdin) {
          inputData = await readJsonInput<Record<string, unknown>>({
            file: options.file,
            stdin: options.stdin,
          });
          validateNetAcceptInput(inputData);
        }

        // Merge JSON input with CLI flags (CLI overrides JSON)
        const channelExpires = options.channelExpires || inputData.channel_expires as string | undefined;
        const context = options.context || inputData.context as string | undefined;

        const result = await acceptApplication(applicationId, {
          channel_expires_at: channelExpires,
          context: context,
        });

        if (isJsonOutput()) {
          output(result);
        } else {
          success(result.message);
          console.log();
          info(`Channel created: ${result.channel.id}`);
          printKeyValue({
            'Channel ID': result.channel.id,
            'User 1': result.channel.user1_id,
            'User 2': result.channel.user2_id,
            'Expires': result.channel.expires_at,
          });
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net applications reject <applicationId>
  applicationsCommand
    .command('reject <applicationId>')
    .description('Reject an application')
    .option('-f, --file <path>', 'JSON file with reject options')
    .option('--stdin', 'Read JSON input from stdin')
    .option('--reason <reason>', 'Rejection reason')
    .action(async (applicationId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        // Parse JSON input if provided
        let inputData: Record<string, unknown> = {};
        if (options.file || options.stdin) {
          inputData = await readJsonInput<Record<string, unknown>>({
            file: options.file,
            stdin: options.stdin,
          });
          validateNetRejectInput(inputData);
        }

        // Merge JSON input with CLI flags (CLI overrides JSON)
        const reason = options.reason || inputData.reason as string | undefined;

        const result = await rejectApplication(applicationId, reason);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(result.message);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net applications withdraw <applicationId>
  applicationsCommand
    .command('withdraw <applicationId>')
    .description('Withdraw your application')
    .action(async (applicationId) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const result = await withdrawApplication(applicationId);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(result.message);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net applications batch-action
  applicationsCommand
    .command('batch-action')
    .description('Accept or reject multiple applications at once')
    .option('-f, --file <path>', 'JSON file with batch action data')
    .option('--stdin', 'Read JSON input from stdin')
    .option('--action <action>', 'Action to perform (accept, reject)')
    .option('--ids <ids>', 'Comma-separated application IDs')
    .option('--channel-expires <date>', 'Channel expiration date for accept action')
    .option('--reason <reason>', 'Rejection reason for reject action')
    .action(async (options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        // Parse JSON input if provided
        let inputData: Record<string, unknown> = {};
        if (options.file || options.stdin) {
          inputData = await readJsonInput<Record<string, unknown>>({
            file: options.file,
            stdin: options.stdin,
          });
          validateNetBatchActionInput(inputData);
        }

        // Merge JSON input with CLI flags (CLI overrides JSON)
        const action = (options.action || inputData.action) as 'accept' | 'reject';
        const ids = options.ids
          ? options.ids.split(',').map((id: string) => id.trim())
          : inputData.ids as string[] | undefined;
        const channelExpires = options.channelExpires || inputData.channel_expires as string | undefined;
        const reason = options.reason || inputData.reason as string | undefined;

        if (!action || !['accept', 'reject'].includes(action)) {
          throw new Error('Action is required and must be "accept" or "reject"');
        }

        if (!ids || ids.length === 0) {
          throw new Error('Application IDs are required. Provide via --ids or in JSON input.');
        }

        const result = await batchAction(action, ids, {
          channel_expires_at: channelExpires,
          reason: reason,
        });

        if (isJsonOutput()) {
          output(result);
        } else {
          success(`Batch ${action} completed`);
          console.log();
          console.log(`Total requested: ${result.summary.total_requested}`);
          console.log(`Succeeded: ${result.summary.succeeded}`);
          console.log(`Failed: ${result.summary.failed}`);

          if (result.processed.length > 0) {
            console.log();
            console.log('Processed:');
            printTable(
              ['Application ID', 'Action', 'Channel ID'],
              result.processed.map(p => [p.application_id, p.action, p.channel_id || ''])
            );
          }

          if (result.failed.length > 0) {
            console.log();
            console.log('Failed:');
            printTable(
              ['Application ID', 'Error'],
              result.failed.map(f => [f.id, f.error])
            );
          }
        }
      } catch (err) {
        handleError(err);
      }
    });
}
