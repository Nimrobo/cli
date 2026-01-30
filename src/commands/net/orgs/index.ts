import { Command } from 'commander';
import { getApiKey, setContext, resolveId } from '../../../utils/config';
import { requireAuth, handleError } from '../../../utils/errors';
import { success, output, isJsonOutput, printKeyValue, printTable, info } from '../../../utils/output';
import {
  readJsonInput,
  validateNetOrgInput,
  validateNetOrgInviteInput,
} from '../../../utils/file-input';
import {
  createOrg,
  listOrgs,
  getOrgById,
  updateOrg,
  deleteOrg,
  leaveOrg,
  getOrgMembers,
  removeOrgMember,
  updateMemberRole,
  sendOrgInvite,
  getOrgInvites,
  cancelOrgInvite,
  sendJoinRequest,
  getOrgJoinRequests,
  getOrgPosts,
  acceptOrgInvite,
  declineOrgInvite,
  approveJoinRequest,
  rejectJoinRequest,
  cancelJoinRequest,
} from '../../../api/net/orgs';
import { OrgRole } from '../../../types';

export function registerOrgsCommands(program: Command): void {
  const orgsCommand = program
    .command('orgs')
    .description('Manage organizations');

  // net orgs create
  orgsCommand
    .command('create')
    .description('Create a new organization')
    .option('-f, --file <path>', 'JSON file with organization data')
    .option('--stdin', 'Read JSON input from stdin')
    .option('--name <name>', 'Organization name')
    .option('--description <description>', 'Organization description')
    .option('--website <website>', 'Organization website')
    .option('--use', 'Set as current org context after creation')
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
          validateNetOrgInput(inputData, true);
        }

        // Merge JSON input with CLI flags (CLI overrides JSON)
        const name = options.name || inputData.name as string;
        const description = options.description || inputData.description as string | undefined;
        const website = options.website || inputData.website as string | undefined;

        if (!name) {
          throw new Error('Organization name is required. Provide via --name or in JSON input.');
        }

        const data: { description?: string; website?: string } = {};
        if (description) data.description = description;
        if (website) data.website = website;

        const org = await createOrg(name, Object.keys(data).length > 0 ? data : undefined);

        if (options.use) {
          setContext('org', org.id);
        }

        if (isJsonOutput()) {
          output(org);
        } else {
          success(`Organization created: ${org.name}`);
          console.log();
          printKeyValue({
            'ID': org.id,
            'Name': org.name,
            'Slug': org.slug,
            'Status': org.status,
          });
          if (options.use) {
            console.log();
            success('Set as current org context');
          }
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs list
  orgsCommand
    .command('list')
    .description('List organizations')
    .option('--keyword <keyword>', 'Search keyword')
    .option('--name <name>', 'Filter by name')
    .option('--status <status>', 'Filter by status')
    .option('--website <website>', 'Filter by website')
    .option('--limit <limit>', 'Number of results', '20')
    .option('--skip <skip>', 'Number of results to skip', '0')
    .option('--sort <field>', 'Sort field (created_at, name)')
    .option('--order <order>', 'Sort order (asc, desc)', 'desc')
    .action(async (options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const result = await listOrgs({
          keyword: options.keyword,
          name: options.name,
          status: options.status,
          website: options.website,
          limit: parseInt(options.limit),
          skip: parseInt(options.skip),
          sort_field: options.sort,
          sort_order: options.order,
        });

        if (isJsonOutput()) {
          output(result);
        } else {
          if (result.data.length === 0) {
            success('No organizations found');
            return;
          }

          success(`Organizations (${result.data.length}${result.pagination.has_more ? '+' : ''}):`);
          console.log();
          printTable(
            ['ID', 'Name', 'Slug', 'Status'],
            result.data.map(org => [org.id, org.name, org.slug, org.status])
          );
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs get <orgId>
  orgsCommand
    .command('get [orgId]')
    .description('Get organization details (use "current" for stored context)')
    .option('--use', 'Set this org as current context')
    .action(async (orgId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(orgId || 'current', 'org');
        if (!resolvedId) {
          throw new Error('Organization ID is required. Provide it as argument or set context with "net orgs use <id>"');
        }

        const org = await getOrgById(resolvedId);

        if (options.use) {
          setContext('org', org.id);
        }

        if (isJsonOutput()) {
          output(org);
        } else {
          success('Organization details:');
          console.log();
          printKeyValue({
            'ID': org.id,
            'Name': org.name,
            'Slug': org.slug,
            'Description': org.data?.description,
            'Website': org.data?.website,
            'Status': org.status,
            'Created': org.created_at,
          });
          if (options.use) {
            console.log();
            success('Set as current org context');
          }
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs update <orgId>
  orgsCommand
    .command('update [orgId]')
    .description('Update organization (use "current" for stored context)')
    .option('-f, --file <path>', 'JSON file with update data')
    .option('--stdin', 'Read JSON input from stdin')
    .option('--name <name>', 'Organization name')
    .option('--description <description>', 'Organization description')
    .option('--website <website>', 'Organization website')
    .action(async (orgId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(orgId || 'current', 'org');
        if (!resolvedId) {
          throw new Error('Organization ID is required');
        }

        // Parse JSON input if provided
        let inputData: Record<string, unknown> = {};
        if (options.file || options.stdin) {
          inputData = await readJsonInput<Record<string, unknown>>({
            file: options.file,
            stdin: options.stdin,
          });
          validateNetOrgInput(inputData, false);
        }

        // Merge JSON input with CLI flags (CLI overrides JSON)
        const name = options.name || inputData.name as string | undefined;
        const description = options.description !== undefined
          ? options.description
          : inputData.description as string | undefined;
        const website = options.website !== undefined
          ? options.website
          : inputData.website as string | undefined;

        const updates: { name?: string; data?: { description?: string; website?: string } } = {};
        if (name) updates.name = name;
        if (description !== undefined || website !== undefined) {
          updates.data = {};
          if (description) updates.data.description = description;
          if (website) updates.data.website = website;
        }

        if (Object.keys(updates).length === 0) {
          throw new Error('At least one update option is required');
        }

        const org = await updateOrg(resolvedId, updates);

        if (isJsonOutput()) {
          output(org);
        } else {
          success('Organization updated');
          console.log();
          printKeyValue({
            'ID': org.id,
            'Name': org.name,
            'Description': org.data?.description,
            'Website': org.data?.website,
          });
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs delete <orgId>
  orgsCommand
    .command('delete [orgId]')
    .description('Delete organization (use "current" for stored context)')
    .action(async (orgId) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(orgId || 'current', 'org');
        if (!resolvedId) {
          throw new Error('Organization ID is required');
        }

        const result = await deleteOrg(resolvedId);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(result.message);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs leave <orgId>
  orgsCommand
    .command('leave [orgId]')
    .description('Leave organization (use "current" for stored context)')
    .action(async (orgId) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(orgId || 'current', 'org');
        if (!resolvedId) {
          throw new Error('Organization ID is required');
        }

        const result = await leaveOrg(resolvedId);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(result.message);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs posts <orgId>
  orgsCommand
    .command('posts [orgId]')
    .description('List posts for an organization (use "current" for stored context)')
    .option('--limit <limit>', 'Number of results', '20')
    .option('--skip <skip>', 'Number of results to skip', '0')
    .action(async (orgId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(orgId || 'current', 'org');
        if (!resolvedId) {
          throw new Error('Organization ID is required');
        }

        const result = await getOrgPosts(resolvedId, {
          limit: parseInt(options.limit),
          skip: parseInt(options.skip),
        });

        if (isJsonOutput()) {
          output(result);
        } else {
          if (result.data.length === 0) {
            success('No posts found for this organization');
            return;
          }

          success(`Organization posts (${result.data.length}${result.pagination.has_more ? '+' : ''}):`);
          console.log();
          printTable(
            ['ID', 'Title', 'Status', 'Applications'],
            result.data.map(post => [
              post.id,
              post.title || '(untitled)',
              post.status,
              String(post.application_count || 0),
            ])
          );
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs use <orgId>
  orgsCommand
    .command('use <orgId>')
    .description('Set an organization as current context')
    .action(async (orgId) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const org = await getOrgById(orgId);
        setContext('org', org.id);

        if (isJsonOutput()) {
          output({ success: true, org_id: org.id, org_name: org.name });
        } else {
          success(`Set current org to: ${org.name} (${org.id})`);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // Management subcommands
  const manageCommand = orgsCommand
    .command('manage')
    .description('Organization management commands');

  // net orgs manage members <orgId>
  manageCommand
    .command('members [orgId]')
    .description('List organization members')
    .option('--limit <limit>', 'Number of results', '20')
    .option('--skip <skip>', 'Number of results to skip', '0')
    .action(async (orgId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(orgId || 'current', 'org');
        if (!resolvedId) {
          throw new Error('Organization ID is required');
        }

        const result = await getOrgMembers(resolvedId, {
          limit: parseInt(options.limit),
          skip: parseInt(options.skip),
        });

        if (isJsonOutput()) {
          output(result);
        } else {
          if (result.data.length === 0) {
            success('No members found');
            return;
          }

          success(`Members (${result.data.length}${result.pagination.has_more ? '+' : ''}):`);
          console.log();
          printTable(
            ['ID', 'User ID', 'Name', 'Role', 'Joined'],
            result.data.map(m => [
              m.id,
              m.user_id,
              m.user_name || '',
              m.role,
              new Date(m.created_at).toLocaleDateString(),
            ])
          );
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs manage remove-member <orgId> <userId>
  manageCommand
    .command('remove-member [orgId] <userId>')
    .description('Remove a member from organization')
    .action(async (orgIdOrUserId, userIdOrUndefined) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        let orgId: string | undefined;
        let userId: string;

        // Handle both "remove-member orgId userId" and "remove-member userId" (using context)
        if (userIdOrUndefined) {
          orgId = orgIdOrUserId;
          userId = userIdOrUndefined;
        } else {
          userId = orgIdOrUserId;
        }

        const resolvedOrgId = resolveId(orgId || 'current', 'org');
        if (!resolvedOrgId) {
          throw new Error('Organization ID is required');
        }

        const result = await removeOrgMember(resolvedOrgId, userId);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(result.message);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs manage update-role <orgId> <userId>
  manageCommand
    .command('update-role [orgId] <userId>')
    .description('Update a member\'s role')
    .requiredOption('--role <role>', 'New role (owner, admin, member)')
    .action(async (orgIdOrUserId, userIdOrOptions, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        let orgId: string | undefined;
        let userId: string;
        let opts = options;

        if (typeof userIdOrOptions === 'string') {
          orgId = orgIdOrUserId;
          userId = userIdOrOptions;
        } else {
          userId = orgIdOrUserId;
          opts = userIdOrOptions;
        }

        const resolvedOrgId = resolveId(orgId || 'current', 'org');
        if (!resolvedOrgId) {
          throw new Error('Organization ID is required');
        }

        const member = await updateMemberRole(resolvedOrgId, userId, opts.role as OrgRole);

        if (isJsonOutput()) {
          output(member);
        } else {
          success(`Member role updated to: ${member.role}`);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs manage invite <orgId>
  manageCommand
    .command('invite [orgId]')
    .description('Send an invite to join organization')
    .option('-f, --file <path>', 'JSON file with invite data')
    .option('--stdin', 'Read JSON input from stdin')
    .option('--email <email>', 'Email to invite')
    .option('--role <role>', 'Role to assign (admin, member)', 'member')
    .action(async (orgId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(orgId || 'current', 'org');
        if (!resolvedId) {
          throw new Error('Organization ID is required');
        }

        // Parse JSON input if provided
        let inputData: Record<string, unknown> = {};
        if (options.file || options.stdin) {
          inputData = await readJsonInput<Record<string, unknown>>({
            file: options.file,
            stdin: options.stdin,
          });
          validateNetOrgInviteInput(inputData);
        }

        // Merge JSON input with CLI flags (CLI overrides JSON)
        const email = options.email || inputData.email as string;
        const role = options.role || inputData.role as string || 'member';

        if (!email) {
          throw new Error('Email is required. Provide via --email or in JSON input.');
        }

        const invite = await sendOrgInvite(resolvedId, email, role as OrgRole);

        if (isJsonOutput()) {
          output(invite);
        } else {
          success(`Invite sent to: ${invite.invitee_email}`);
          console.log();
          printKeyValue({
            'Invite ID': invite.id,
            'Role': invite.role,
            'Expires': invite.expires_at,
          });
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs manage invites <orgId>
  manageCommand
    .command('invites [orgId]')
    .description('List pending invites')
    .option('--limit <limit>', 'Number of results', '20')
    .option('--skip <skip>', 'Number of results to skip', '0')
    .action(async (orgId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(orgId || 'current', 'org');
        if (!resolvedId) {
          throw new Error('Organization ID is required');
        }

        const result = await getOrgInvites(resolvedId, {
          limit: parseInt(options.limit),
          skip: parseInt(options.skip),
        });

        if (isJsonOutput()) {
          output(result);
        } else {
          if (result.data.length === 0) {
            success('No pending invites');
            return;
          }

          success(`Pending invites (${result.data.length}${result.pagination.has_more ? '+' : ''}):`);
          console.log();
          printTable(
            ['ID', 'Email', 'Role', 'Expires'],
            result.data.map(i => [
              i.id,
              i.invitee_email || '',
              i.role,
              new Date(i.expires_at).toLocaleDateString(),
            ])
          );
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs manage cancel-invite <orgId> <inviteId>
  manageCommand
    .command('cancel-invite [orgId] <inviteId>')
    .description('Cancel a pending invite')
    .action(async (orgIdOrInviteId, inviteIdOrUndefined) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        let orgId: string | undefined;
        let inviteId: string;

        if (inviteIdOrUndefined) {
          orgId = orgIdOrInviteId;
          inviteId = inviteIdOrUndefined;
        } else {
          inviteId = orgIdOrInviteId;
        }

        const resolvedOrgId = resolveId(orgId || 'current', 'org');
        if (!resolvedOrgId) {
          throw new Error('Organization ID is required');
        }

        const result = await cancelOrgInvite(resolvedOrgId, inviteId);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(result.message);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs manage join-requests <orgId>
  manageCommand
    .command('join-requests [orgId]')
    .description('List pending join requests')
    .option('--limit <limit>', 'Number of results', '20')
    .option('--skip <skip>', 'Number of results to skip', '0')
    .action(async (orgId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(orgId || 'current', 'org');
        if (!resolvedId) {
          throw new Error('Organization ID is required');
        }

        const result = await getOrgJoinRequests(resolvedId, {
          limit: parseInt(options.limit),
          skip: parseInt(options.skip),
        });

        if (isJsonOutput()) {
          output(result);
        } else {
          if (result.data.length === 0) {
            success('No pending join requests');
            return;
          }

          success(`Join requests (${result.data.length}${result.pagination.has_more ? '+' : ''}):`);
          console.log();
          printTable(
            ['ID', 'User', 'Message', 'Created'],
            result.data.map(r => [
              r.id,
              r.user_name || r.user_id || '',
              (r.message || '').substring(0, 30),
              new Date(r.created_at).toLocaleDateString(),
            ])
          );
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs manage approve-request <requestId>
  manageCommand
    .command('approve-request <requestId>')
    .description('Approve a join request')
    .option('--role <role>', 'Role to assign (admin, member)', 'member')
    .action(async (requestId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const result = await approveJoinRequest(requestId, options.role as OrgRole);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(`Request approved. User added as ${result.role}`);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs manage reject-request <requestId>
  manageCommand
    .command('reject-request <requestId>')
    .description('Reject a join request')
    .action(async (requestId) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const result = await rejectJoinRequest(requestId);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(result.message);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // Actions on invites/requests (user perspective)
  // net orgs join <orgId>
  orgsCommand
    .command('join [orgId]')
    .description('Request to join an organization (use "current" for stored context)')
    .option('-f, --file <path>', 'JSON file with join request data')
    .option('--stdin', 'Read JSON input from stdin')
    .option('--message <message>', 'Message to include with request')
    .action(async (orgId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(orgId || 'current', 'org');
        if (!resolvedId) {
          throw new Error('Organization ID is required');
        }

        // Parse JSON input if provided
        let inputData: Record<string, unknown> = {};
        if (options.file || options.stdin) {
          inputData = await readJsonInput<Record<string, unknown>>({
            file: options.file,
            stdin: options.stdin,
          });
        }

        // Merge JSON input with CLI flags (CLI overrides JSON)
        const message = options.message || inputData.message as string | undefined;

        const request = await sendJoinRequest(resolvedId, message);

        if (isJsonOutput()) {
          output(request);
        } else {
          success('Join request sent');
          info(`Request ID: ${request.id}`);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs accept-invite <inviteId>
  orgsCommand
    .command('accept-invite <inviteId>')
    .description('Accept an organization invite')
    .action(async (inviteId) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const result = await acceptOrgInvite(inviteId);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(`Invite accepted! You joined as ${result.role}`);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs decline-invite <inviteId>
  orgsCommand
    .command('decline-invite <inviteId>')
    .description('Decline an organization invite')
    .action(async (inviteId) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const result = await declineOrgInvite(inviteId);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(result.message);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net orgs cancel-join-request <requestId>
  orgsCommand
    .command('cancel-join-request <requestId>')
    .description('Cancel your join request')
    .action(async (requestId) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const result = await cancelJoinRequest(requestId);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(result.message);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
