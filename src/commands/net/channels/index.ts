import { Command } from 'commander';
import { getApiKey, setContext, resolveId } from '../../../utils/config';
import { requireAuth, handleError } from '../../../utils/errors';
import { success, output, isJsonOutput, printKeyValue, printTable } from '../../../utils/output';
import {
  readJsonInput,
  readContentFile,
  validateNetMessageInput,
} from '../../../utils/file-input';
import {
  listChannels,
  getChannelById,
  getChannelMessages,
  sendMessage,
  getMessageById,
  markMessageRead,
  markMessageUnread,
  markAllRead,
} from '../../../api/net/channels';

export function registerChannelsCommands(program: Command): void {
  const channelsCommand = program
    .command('channels')
    .description('Manage messaging channels');

  // net channels list
  channelsCommand
    .command('list')
    .description('List your channels')
    .option('--status <status>', 'Filter by status (active, archived)')
    .option('--application <id>', 'Filter by application ID')
    .option('--post <id>', 'Filter by post ID')
    .option('--limit <limit>', 'Number of results', '20')
    .option('--skip <skip>', 'Number of results to skip', '0')
    .action(async (options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const result = await listChannels({
          status: options.status,
          application_id: options.application,
          post_id: options.post,
          limit: parseInt(options.limit),
          skip: parseInt(options.skip),
        });

        if (isJsonOutput()) {
          output(result);
        } else {
          if (result.data.length === 0) {
            success('No channels found');
            return;
          }

          success(`Channels (${result.data.length}${result.pagination.has_more ? '+' : ''}):`);
          console.log();
          printTable(
            ['ID', 'Users', 'Status', 'Last Message', 'Expires'],
            result.data.map(ch => [
              ch.id,
              `${ch.user1_name || ch.user1_id} <-> ${ch.user2_name || ch.user2_id}`,
              ch.status,
              ch.last_message_at ? new Date(ch.last_message_at).toLocaleDateString() : 'Never',
              new Date(ch.expires_at).toLocaleDateString(),
            ])
          );
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net channels get <channelId>
  channelsCommand
    .command('get [channelId]')
    .description('Get channel details (use "current" for stored context)')
    .option('--use', 'Set this channel as current context')
    .action(async (channelId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(channelId || 'current', 'channel');
        if (!resolvedId) {
          throw new Error('Channel ID is required. Provide it as argument or set context with "net channels use <id>"');
        }

        const channel = await getChannelById(resolvedId);

        if (options.use) {
          setContext('channel', channel.id);
        }

        if (isJsonOutput()) {
          output(channel);
        } else {
          success('Channel details:');
          console.log();
          printKeyValue({
            'ID': channel.id,
            'Application ID': channel.application_id,
            'Post ID': channel.post_id,
            'User 1': channel.user1_name || channel.user1_id,
            'User 2': channel.user2_name || channel.user2_id,
            'Context': channel.context,
            'Status': channel.status,
            'Last Message': channel.last_message_at,
            'Expires': channel.expires_at,
            'Created': channel.created_at,
          });
          if (options.use) {
            console.log();
            success('Set as current channel context');
          }
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net channels messages <channelId>
  channelsCommand
    .command('messages [channelId]')
    .description('List messages in a channel (use "current" for stored context)')
    .option('--limit <limit>', 'Number of results', '20')
    .option('--skip <skip>', 'Number of results to skip', '0')
    .action(async (channelId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(channelId || 'current', 'channel');
        if (!resolvedId) {
          throw new Error('Channel ID is required');
        }

        const result = await getChannelMessages(resolvedId, {
          limit: parseInt(options.limit),
          skip: parseInt(options.skip),
        });

        if (isJsonOutput()) {
          output(result);
        } else {
          if (result.data.length === 0) {
            success('No messages in this channel');
            return;
          }

          success(`Messages (${result.data.length}${result.pagination.has_more ? '+' : ''}):`);
          console.log();

          // Display messages in reverse order (oldest first) for readability
          const messages = [...result.data].reverse();
          for (const msg of messages) {
            const readStatus = msg.is_read ? '' : ' [UNREAD]';
            const time = new Date(msg.created_at).toLocaleString();
            console.log(`[${time}] ${msg.sender_name || msg.sender_id}${readStatus}:`);
            console.log(`  ${msg.content_md}`);
            console.log();
          }
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net channels send <channelId>
  channelsCommand
    .command('send [channelId]')
    .description('Send a message to a channel (use "current" for stored context)')
    .option('-f, --file <path>', 'JSON file with message data')
    .option('--stdin', 'Read JSON input from stdin')
    .option('--content-file <path>', 'Read message content from file')
    .option('--message <content>', 'Message content (markdown)')
    .action(async (channelId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(channelId || 'current', 'channel');
        if (!resolvedId) {
          throw new Error('Channel ID is required');
        }

        // Parse JSON input if provided
        let inputData: Record<string, unknown> = {};
        if (options.file || options.stdin) {
          inputData = await readJsonInput<Record<string, unknown>>({
            file: options.file,
            stdin: options.stdin,
          });
          validateNetMessageInput(inputData);
        }

        // Handle message: CLI flag > content-file > JSON input
        let messageContent = options.message || inputData.message as string | undefined;
        if (options.contentFile) {
          messageContent = readContentFile(options.contentFile);
        }

        if (!messageContent || messageContent.trim().length === 0) {
          throw new Error('Message content is required. Provide via --message, --content-file, or in JSON input.');
        }

        const message = await sendMessage(resolvedId, messageContent);

        if (isJsonOutput()) {
          output(message);
        } else {
          success('Message sent');
          console.log();
          printKeyValue({
            'Message ID': message.id,
            'Sent at': message.created_at,
          });
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net channels message <channelId> <messageId>
  channelsCommand
    .command('message [channelId] <messageId>')
    .description('Get a specific message (auto-marks as read)')
    .action(async (channelIdOrMessageId, messageIdOrUndefined) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        let channelId: string | undefined;
        let messageId: string;

        if (messageIdOrUndefined) {
          channelId = channelIdOrMessageId;
          messageId = messageIdOrUndefined;
        } else {
          messageId = channelIdOrMessageId;
        }

        const resolvedChannelId = resolveId(channelId || 'current', 'channel');
        if (!resolvedChannelId) {
          throw new Error('Channel ID is required');
        }

        const message = await getMessageById(resolvedChannelId, messageId);

        if (isJsonOutput()) {
          output(message);
        } else {
          console.log();
          printKeyValue({
            'Message ID': message.id,
            'From': message.sender_name || message.sender_id,
            'Sent': message.created_at,
            'Read': message.is_read ? (message.read_at || 'Yes') : 'No',
          });
          console.log();
          console.log('Content:');
          console.log(message.content_md);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net channels mark-read <channelId> <messageId>
  channelsCommand
    .command('mark-read [channelId] <messageId>')
    .description('Mark a message as read')
    .action(async (channelIdOrMessageId, messageIdOrUndefined) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        let channelId: string | undefined;
        let messageId: string;

        if (messageIdOrUndefined) {
          channelId = channelIdOrMessageId;
          messageId = messageIdOrUndefined;
        } else {
          messageId = channelIdOrMessageId;
        }

        const resolvedChannelId = resolveId(channelId || 'current', 'channel');
        if (!resolvedChannelId) {
          throw new Error('Channel ID is required');
        }

        const result = await markMessageRead(resolvedChannelId, messageId);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(result.message);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net channels mark-unread <channelId> <messageId>
  channelsCommand
    .command('mark-unread [channelId] <messageId>')
    .description('Mark a message as unread')
    .action(async (channelIdOrMessageId, messageIdOrUndefined) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        let channelId: string | undefined;
        let messageId: string;

        if (messageIdOrUndefined) {
          channelId = channelIdOrMessageId;
          messageId = messageIdOrUndefined;
        } else {
          messageId = channelIdOrMessageId;
        }

        const resolvedChannelId = resolveId(channelId || 'current', 'channel');
        if (!resolvedChannelId) {
          throw new Error('Channel ID is required');
        }

        const result = await markMessageUnread(resolvedChannelId, messageId);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(result.message);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net channels read-all <channelId>
  channelsCommand
    .command('read-all [channelId]')
    .description('Mark all messages in a channel as read (use "current" for stored context)')
    .action(async (channelId) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(channelId || 'current', 'channel');
        if (!resolvedId) {
          throw new Error('Channel ID is required');
        }

        const result = await markAllRead(resolvedId);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(`${result.messages_marked} message(s) marked as read`);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net channels use <channelId>
  channelsCommand
    .command('use <channelId>')
    .description('Set a channel as current context')
    .action(async (channelId) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const channel = await getChannelById(channelId);
        setContext('channel', channel.id);

        if (isJsonOutput()) {
          output({ success: true, channel_id: channel.id });
        } else {
          success(`Set current channel to: ${channel.id}`);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
