import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { getApiKey } from '../../utils/config';
import { requireAuth, handleError } from '../../utils/errors';
import { success, output, isJsonOutput } from '../../utils/output';
import { downloadCharacterForReview } from '../../api/character';

export function registerImportCommand(program: Command): void {
  program
    .command('import <name>')
    .description('Download and extract a character for review')
    .requiredOption('--version <version>', 'Version to download')
    .action(async (name: string, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const version: string = options.version;

        const downloadUrl = await downloadCharacterForReview(name, version);

        // Download the zip from the signed URL
        const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);

        // Extract into ./{name}/
        const destDir = path.join(process.cwd(), name);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        const zip = new AdmZip(buffer);
        zip.extractAllTo(destDir, true);

        if (isJsonOutput()) {
          output({ success: true, character: name, version, path: destDir });
        } else {
          success(`Character extracted to: ${destDir}`);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
