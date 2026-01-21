import { Command } from 'commander';
import { getApiKey, resolveProjectId } from '../../utils/config';
import { listProjectLinks, listInstantLinks } from '../../api/links';
import { output, isJsonOutput, printTable } from '../../utils/output';
import { handleError, requireAuth } from '../../utils/errors';

interface ListOptions {
  project?: string;
}

export function registerLinksListCommand(program: Command): void {
  program
    .command('list')
    .description('List voice links')
    .option('-p, --project <project-id>', 'Project ID or "default" (omit for instant links)')
    .action(async (options: ListOptions) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const projectId = resolveProjectId(options.project);

        if (projectId) {
          // List project links
          const links = await listProjectLinks(projectId);

          if (isJsonOutput()) {
            output(links);
          } else {
            if (links.length === 0) {
              console.log('No links found for this project.');
              return;
            }

            printTable(
              ['ID', 'Label', 'Status', 'Session ID', 'Expires'],
              links.map(l => [
                l.id,
                l.label,
                l.status,
                l.sessionId || '—',
                l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : '—',
              ])
            );
          }
        } else {
          // List instant links
          const links = await listInstantLinks();

          if (isJsonOutput()) {
            output(links);
          } else {
            if (links.length === 0) {
              console.log('No instant links found.');
              return;
            }

            printTable(
              ['ID', 'Label', 'Status', 'Session ID', 'Expires'],
              links.map(l => [
                l.id,
                l.label,
                l.status,
                l.sessionId || '—',
                l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : '—',
              ])
            );
          }
        }
      } catch (err) {
        handleError(err);
      }
    });
}
