import { Command } from 'commander';
import { getAllContext, clearContext, clearAllContext, getContext } from '../../utils/config';
import { success, output, isJsonOutput, printKeyValue, info } from '../../utils/output';
import { ContextType } from '../../types';

export function registerContextCommands(program: Command): void {
  const contextCommand = program
    .command('context')
    .description('View and manage stored context (org, post, channel, user)');

  // net context
  contextCommand
    .command('show')
    .description('Show all stored context')
    .action(() => {
      const context = getAllContext();

      if (isJsonOutput()) {
        output(context);
      } else {
        success('Current context:');
        console.log();
        printKeyValue({
          'Organization': context.orgId || '(not set)',
          'Post': context.postId || '(not set)',
          'Channel': context.channelId || '(not set)',
          'User': context.userId || '(not set)',
        });
      }
    });

  // net context clear
  contextCommand
    .command('clear [type]')
    .description('Clear stored context (org, post, channel, user, or all)')
    .action((type) => {
      if (!type || type === 'all') {
        clearAllContext();
        if (isJsonOutput()) {
          output({ success: true, message: 'All context cleared' });
        } else {
          success('All context cleared');
        }
      } else {
        const validTypes: ContextType[] = ['org', 'post', 'channel', 'user'];
        if (!validTypes.includes(type)) {
          throw new Error(`Invalid context type. Must be one of: ${validTypes.join(', ')}, or 'all'`);
        }
        clearContext(type as ContextType);
        if (isJsonOutput()) {
          output({ success: true, message: `${type} context cleared` });
        } else {
          success(`${type} context cleared`);
        }
      }
    });

  // net context get <type>
  contextCommand
    .command('get <type>')
    .description('Get a specific context value (org, post, channel, user)')
    .action((type) => {
      const validTypes: ContextType[] = ['org', 'post', 'channel', 'user'];
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid context type. Must be one of: ${validTypes.join(', ')}`);
      }

      const value = getContext(type as ContextType);

      if (isJsonOutput()) {
        output({ type, value });
      } else {
        if (value) {
          info(`${type}: ${value}`);
        } else {
          info(`${type}: (not set)`);
        }
      }
    });
}
