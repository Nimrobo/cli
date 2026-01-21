import { Command } from 'commander';
import { getApiKey } from '../../../utils/config';
import { requireAuth, handleError } from '../../../utils/errors';
import { success, output, isJsonOutput, printKeyValue, printTable } from '../../../utils/output';
import {
  readJsonInput,
  readContentFile,
  validateNetProfileInput,
} from '../../../utils/file-input';
import {
  getMyProfile,
  updateMyProfile,
  getMyOrgs,
  getMyPosts,
  getMyApplications,
  getMyInvites,
  getMyJoinRequests,
  getMySummary,
} from '../../../api/net/users';
import { NetUserProfile } from '../../../types';

export function registerMyCommands(program: Command): void {
  const myCommand = program
    .command('my')
    .description('Manage your profile and view your data');

  // net my profile
  myCommand
    .command('profile')
    .description('Get your profile')
    .action(async () => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const profile = await getMyProfile();

        if (isJsonOutput()) {
          output(profile);
        } else {
          success('Your profile:');
          console.log();
          printKeyValue({
            'ID': profile.id,
            'Email': profile.email,
            'Name': profile.profile?.data?.name,
            'Location': profile.profile?.data?.location
              ? `${profile.profile.data.location.city || ''}${profile.profile.data.location.city && profile.profile.data.location.country ? ', ' : ''}${profile.profile.data.location.country || ''}`
              : null,
            'Bio': profile.profile?.data?.short_bio,
            'Created': profile.created_at,
          });
          if (profile.profile?.content) {
            console.log();
            console.log('Content:');
            console.log(profile.profile.content);
          }
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net my update
  myCommand
    .command('update')
    .description('Update your profile')
    .option('-f, --file <path>', 'JSON file with profile data')
    .option('--stdin', 'Read JSON input from stdin')
    .option('--content-file <path>', 'Read profile content from file')
    .option('--name <name>', 'Your display name')
    .option('--city <city>', 'Your city')
    .option('--country <country>', 'Your country')
    .option('--bio <bio>', 'Short bio')
    .option('--content <content>', 'Long-form profile content')
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
          validateNetProfileInput(inputData);
        }

        const profile: NetUserProfile = {};

        // Merge JSON input with CLI flags (CLI overrides JSON)
        const name = options.name || inputData.name;
        const city = options.city || inputData.city;
        const country = options.country || inputData.country;
        const bio = options.bio || inputData.bio;

        if (name || city || country || bio) {
          profile.data = {};
          if (name) profile.data.name = name as string;
          if (city || country) {
            profile.data.location = {};
            if (city) profile.data.location.city = city as string;
            if (country) profile.data.location.country = country as string;
          }
          if (bio) profile.data.short_bio = bio as string;
        }

        // Handle content: CLI flag > content-file > JSON input
        let content = options.content || inputData.content as string | undefined;
        if (options.contentFile) {
          content = readContentFile(options.contentFile);
        }
        if (content) {
          profile.content = content;
        }

        if (Object.keys(profile).length === 0) {
          throw new Error('At least one update option is required');
        }

        const updated = await updateMyProfile(profile);

        if (isJsonOutput()) {
          output(updated);
        } else {
          success('Profile updated');
          console.log();
          printKeyValue({
            'Name': updated.profile?.data?.name,
            'Location': updated.profile?.data?.location
              ? `${updated.profile.data.location.city || ''}${updated.profile.data.location.city && updated.profile.data.location.country ? ', ' : ''}${updated.profile.data.location.country || ''}`
              : null,
            'Bio': updated.profile?.data?.short_bio,
          });
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net my orgs
  myCommand
    .command('orgs')
    .description('List your organizations')
    .option('--limit <limit>', 'Number of results', '20')
    .option('--skip <skip>', 'Number of results to skip', '0')
    .action(async (options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const result = await getMyOrgs({
          limit: parseInt(options.limit),
          skip: parseInt(options.skip),
        });

        if (isJsonOutput()) {
          output(result);
        } else {
          if (result.data.length === 0) {
            success('You are not a member of any organizations');
            return;
          }

          success(`Your organizations (${result.data.length}${result.pagination.has_more ? '+' : ''}):`);
          console.log();
          printTable(
            ['ID', 'Name', 'Slug', 'Role', 'Status'],
            result.data.map(org => [org.id, org.name, org.slug, org.role || '', org.status])
          );
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net my posts
  myCommand
    .command('posts')
    .description('List posts you created')
    .option('--limit <limit>', 'Number of results', '20')
    .option('--skip <skip>', 'Number of results to skip', '0')
    .action(async (options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const result = await getMyPosts({
          limit: parseInt(options.limit),
          skip: parseInt(options.skip),
        });

        if (isJsonOutput()) {
          output(result);
        } else {
          if (result.data.length === 0) {
            success('You have not created any posts');
            return;
          }

          success(`Your posts (${result.data.length}${result.pagination.has_more ? '+' : ''}):`);
          console.log();
          printTable(
            ['ID', 'Title', 'Type', 'Status', 'Applications'],
            result.data.map(post => [
              post.id,
              post.data?.title || '(untitled)',
              post.post_type,
              post.status,
              String(post.application_count || 0),
            ])
          );
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net my applications
  myCommand
    .command('applications')
    .description('List your applications')
    .option('--limit <limit>', 'Number of results', '20')
    .option('--skip <skip>', 'Number of results to skip', '0')
    .option('--status <status>', 'Filter by status (pending, accepted, rejected, withdrawn)')
    .option('--keyword <keyword>', 'Search keyword')
    .action(async (options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const result = await getMyApplications({
          limit: parseInt(options.limit),
          skip: parseInt(options.skip),
          status: options.status,
          keyword: options.keyword,
        });

        if (isJsonOutput()) {
          output(result);
        } else {
          if (result.data.length === 0) {
            success('You have not submitted any applications');
            return;
          }

          success(`Your applications (${result.data.length}${result.pagination.has_more ? '+' : ''}):`);
          console.log();
          printTable(
            ['ID', 'Post', 'Status', 'Created'],
            result.data.map(app => [
              app.id,
              app.post_title || app.post_id,
              app.status,
              new Date(app.created_at).toLocaleDateString(),
            ])
          );
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net my invites
  myCommand
    .command('invites')
    .description('List your pending organization invites')
    .option('--limit <limit>', 'Number of results', '20')
    .option('--skip <skip>', 'Number of results to skip', '0')
    .action(async (options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const result = await getMyInvites({
          limit: parseInt(options.limit),
          skip: parseInt(options.skip),
        });

        if (isJsonOutput()) {
          output(result);
        } else {
          if (result.data.length === 0) {
            success('You have no pending invites');
            return;
          }

          success(`Your invites (${result.data.length}${result.pagination.has_more ? '+' : ''}):`);
          console.log();
          printTable(
            ['ID', 'Organization', 'Role', 'From', 'Expires'],
            result.data.map(inv => [
              inv.id,
              inv.org_name || inv.org_id,
              inv.role,
              inv.inviter_name || '',
              new Date(inv.expires_at).toLocaleDateString(),
            ])
          );
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net my join-requests
  myCommand
    .command('join-requests')
    .description('List your pending join requests')
    .option('--limit <limit>', 'Number of results', '20')
    .option('--skip <skip>', 'Number of results to skip', '0')
    .action(async (options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const result = await getMyJoinRequests({
          limit: parseInt(options.limit),
          skip: parseInt(options.skip),
        });

        if (isJsonOutput()) {
          output(result);
        } else {
          if (result.data.length === 0) {
            success('You have no pending join requests');
            return;
          }

          success(`Your join requests (${result.data.length}${result.pagination.has_more ? '+' : ''}):`);
          console.log();
          printTable(
            ['ID', 'Organization', 'Status', 'Created'],
            result.data.map(req => [
              req.id,
              req.org_name || req.org_id,
              req.status,
              new Date(req.created_at).toLocaleDateString(),
            ])
          );
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net my summary
  myCommand
    .command('summary')
    .description('Get a summary of your activity (for agentic AI)')
    .action(async () => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const summary = await getMySummary();

        if (isJsonOutput()) {
          output(summary);
        } else {
          success('Activity summary:');
          console.log();

          console.log(`📬 Unread messages: ${summary.unread_messages.total}`);
          if (summary.unread_messages.channels.length > 0) {
            summary.unread_messages.channels.slice(0, 5).forEach(ch => {
              console.log(`   Channel ${ch.channel_id}: ${ch.unread_count} unread`);
            });
          }

          console.log();
          console.log(`📋 Pending applicants: ${summary.pending_applicants.total}`);
          if (summary.pending_applicants.posts.length > 0) {
            summary.pending_applicants.posts.slice(0, 5).forEach(p => {
              console.log(`   ${p.title || p.post_id}: ${p.pending_count} pending`);
            });
          }

          console.log();
          console.log(`📝 My applications:`);
          console.log(`   Pending: ${summary.my_applications.pending.count}`);
          console.log(`   Accepted: ${summary.my_applications.accepted.count}`);
          console.log(`   Rejected: ${summary.my_applications.rejected.count}`);

          console.log();
          console.log(`📨 Org invites: ${summary.org_invites.count}`);
          console.log(`📤 Join requests to review: ${summary.org_join_requests.count}`);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
