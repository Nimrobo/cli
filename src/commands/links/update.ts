import { Command } from 'commander';
import { getApiKey } from '../../utils/config';
import { updateInstantLink } from '../../api/links';
import { readJsonFile, validateUpdateLinkInput } from '../../utils/file-input';
import { output, isJsonOutput, success } from '../../utils/output';
import { handleError, requireAuth } from '../../utils/errors';
import { UpdateInstantLinkInput, ExpiryPreset } from '../../types';

interface UpdateOptions {
  file?: string;
  label?: string;
  expiry?: string;
  prompt?: string;
  landingTitle?: string;
  landingInfo?: string;
  timeLimit?: string;
}

export function registerLinksUpdateCommand(program: Command): void {
  program
    .command('update <link-id>')
    .description('Update an instant voice link')
    .option('-f, --file <path>', 'Path to JSON file with update data')
    .option('-l, --label <label>', 'New label')
    .option('-e, --expiry <preset>', 'New expiry preset: 1_day, 1_week, 1_month')
    .option('--prompt <prompt>', 'New AI prompt')
    .option('--landing-title <title>', 'New landing page title')
    .option('--landing-info <info>', 'New landing page info')
    .option('-t, --time-limit <minutes>', 'New time limit in minutes')
    .action(async (linkId: string, options: UpdateOptions) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        let updateData: UpdateInstantLinkInput;

        if (options.file) {
          const fileData = readJsonFile<UpdateInstantLinkInput>(options.file);
          validateUpdateLinkInput(fileData);
          updateData = fileData;
        } else {
          updateData = {};

          if (options.label) updateData.label = options.label;
          if (options.expiry) updateData.expiryPreset = options.expiry as ExpiryPreset;
          if (options.prompt) updateData.prompt = options.prompt;
          if (options.landingTitle) updateData.landingPageTitle = options.landingTitle;
          if (options.landingInfo) updateData.landingPageInfo = options.landingInfo;
          if (options.timeLimit) updateData.timeLimitMinutes = parseInt(options.timeLimit, 10);

          if (Object.keys(updateData).length === 0) {
            throw new Error('No update options provided. Use --file or specify fields to update.');
          }
        }

        await updateInstantLink(linkId, updateData);

        if (isJsonOutput()) {
          output({ success: true });
        } else {
          success('Link updated successfully');
        }
      } catch (err) {
        handleError(err);
      }
    });
}
