import { Command } from 'commander';
import { getApiKey, setContext, resolveId } from '../../../utils/config';
import { requireAuth, handleError } from '../../../utils/errors';
import { success, output, isJsonOutput, printKeyValue, printTable, info } from '../../../utils/output';
import {
  readJsonInput,
  readContentFile,
  validateNetPostInput,
  validateNetApplicationInput,
} from '../../../utils/file-input';
import {
  createPost,
  listPosts,
  getPostById,
  updatePost,
  closePost,
  deletePost,
  applyToPost,
  getPostApplications,
  checkMyApplication,
  PostSearchParams,
} from '../../../api/net/posts';
import { ApplicationData } from '../../../types';

export function registerPostsCommands(program: Command): void {
  const postsCommand = program
    .command('posts')
    .description('Manage job posts');

  // net posts create
  postsCommand
    .command('create')
    .description('Create a new post')
    .option('-f, --file <path>', 'JSON file with post data')
    .option('--stdin', 'Read JSON input from stdin')
    .option('--title <title>', 'Post title (required)')
    .option('--short-content <content>', 'Short description')
    .option('--short-content-file <path>', 'Read short content from file')
    .option('--long-content <content>', 'Long-form content')
    .option('--long-content-file <path>', 'Read long content from file')
    .option('--expires <date>', 'Expiration date (ISO format)')
    .option('--org <orgId>', 'Organization ID (use "current" for stored context)')
    .option('--use', 'Set as current post context after creation')
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
          validateNetPostInput(inputData, true);
        }

        // Build input from JSON input and CLI flags (CLI flags override JSON)
        const title = options.title || inputData.title as string;
        const expires = options.expires || inputData.expires;
        const org = options.org || inputData.org;

        // Handle short_content: CLI flag > file > JSON input
        let shortContent = options.shortContent || inputData.short_content as string | undefined;
        if (options.shortContentFile) {
          shortContent = readContentFile(options.shortContentFile);
        }

        // Handle long_content: CLI flag > file > JSON input
        let longContent = options.longContent || inputData.long_content as string | undefined;
        if (options.longContentFile) {
          longContent = readContentFile(options.longContentFile);
        }

        // Validate required fields
        if (!title) {
          throw new Error('Title is required. Provide via --title or in JSON input.');
        }
        if (!expires) {
          throw new Error('Expiration date is required. Provide via --expires or in JSON input.');
        }

        let orgId: string | null = null;
        if (org) {
          orgId = resolveId(org as string, 'org');
        }

        const post = await createPost({
          title,
          short_content: shortContent,
          long_content: longContent,
          expires_at: expires as string,
          org_id: orgId || undefined,
        });

        if (options.use) {
          setContext('post', post.id);
        }

        if (isJsonOutput()) {
          output(post);
        } else {
          success(`Post created: ${post.title || post.id}`);
          console.log();
          printKeyValue({
            'ID': post.id,
            'Title': post.title,
            'Status': post.status,
            'Expires': post.expires_at,
          });
          if (options.use) {
            console.log();
            success('Set as current post context');
          }
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net posts list
  postsCommand
    .command('list')
    .description('List posts')
    .option('--query <query>', 'Search query (text search)')
    .option('--filter <json>', 'Filter as JSON string (e.g., \'{"key": "value"}\')')
    .option('--status <status>', 'Filter by status (active, closed)')
    .option('--org <orgId>', 'Filter by organization')
    .option('--include-applied', 'Include posts you already applied to')
    .option('--limit <limit>', 'Number of results', '20')
    .option('--skip <skip>', 'Number of results to skip', '0')
    .option('--sort <field>', 'Sort field (created_at, expires_at)')
    .option('--order <order>', 'Sort order (asc, desc)', 'desc')
    .action(async (options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const params: PostSearchParams = {
          limit: parseInt(options.limit),
          skip: parseInt(options.skip),
          exclude_applied: !options.includeApplied,
        };

        if (options.query) params.query = options.query;
        if (options.status) params.status = options.status;
        if (options.org) params.org_id = resolveId(options.org, 'org') || undefined;
        if (options.filter) {
          try {
            params.filter = JSON.parse(options.filter);
          } catch {
            throw new Error('Invalid JSON for --filter option');
          }
        }
        if (options.sort) params.sort_field = options.sort;
        if (options.order) params.sort_order = options.order;

        const result = await listPosts(params);

        if (isJsonOutput()) {
          output(result);
        } else {
          if (result.data.length === 0) {
            success('No posts found');
            return;
          }

          success(`Posts (${result.data.length}${result.pagination.has_more ? '+' : ''}):`);
          console.log();
          printTable(
            ['ID', 'Title', 'Org', 'Status', 'Applications', 'Expires'],
            result.data.map(post => [
              post.id,
              (post.title || '(untitled)').substring(0, 30),
              post.org_name || '',
              post.status,
              String(post.application_count || 0),
              new Date(post.expires_at).toLocaleDateString(),
            ])
          );
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net posts get <postId>
  postsCommand
    .command('get [postId]')
    .description('Get post details (use "current" for stored context)')
    .option('--use', 'Set this post as current context')
    .action(async (postId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(postId || 'current', 'post');
        if (!resolvedId) {
          throw new Error('Post ID is required. Provide it as argument or set context with "net posts use <id>"');
        }

        const post = await getPostById(resolvedId);

        if (options.use) {
          setContext('post', post.id);
        }

        if (isJsonOutput()) {
          output(post);
        } else {
          success('Post details:');
          console.log();
          printKeyValue({
            'ID': post.id,
            'Title': post.title,
            'Status': post.status,
            'Organization': post.org_name || post.org_id,
            'Applications': post.application_count,
            'Expires': post.expires_at,
            'Created': post.created_at,
          });
          if (post.short_content) {
            console.log();
            console.log('Short content:');
            console.log(post.short_content);
          }
          if (post.long_content) {
            console.log();
            console.log('Long content:');
            console.log(post.long_content);
          }
          if (options.use) {
            console.log();
            success('Set as current post context');
          }
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net posts update <postId>
  postsCommand
    .command('update [postId]')
    .description('Update a post (use "current" for stored context)')
    .option('-f, --file <path>', 'JSON file with update data')
    .option('--stdin', 'Read JSON input from stdin')
    .option('--title <title>', 'Post title')
    .option('--short-content <content>', 'Short description')
    .option('--short-content-file <path>', 'Read short content from file')
    .option('--long-content <content>', 'Long-form content')
    .option('--long-content-file <path>', 'Read long content from file')
    .option('--expires <date>', 'New expiration date')
    .action(async (postId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(postId || 'current', 'post');
        if (!resolvedId) {
          throw new Error('Post ID is required');
        }

        // Parse JSON input if provided
        let inputData: Record<string, unknown> = {};
        if (options.file || options.stdin) {
          inputData = await readJsonInput<Record<string, unknown>>({
            file: options.file,
            stdin: options.stdin,
          });
          validateNetPostInput(inputData, false);
        }

        const updates: {
          title?: string;
          short_content?: string;
          long_content?: string;
          expires_at?: string;
        } = {};

        // Merge JSON input with CLI flags (CLI overrides JSON)
        const title = options.title || inputData.title;
        if (title) updates.title = title as string;

        const expires = options.expires || inputData.expires;
        if (expires) updates.expires_at = expires as string;

        // Handle short_content: CLI flag > file > JSON input
        let shortContent = options.shortContent || inputData.short_content as string | undefined;
        if (options.shortContentFile) {
          shortContent = readContentFile(options.shortContentFile);
        }
        if (shortContent) updates.short_content = shortContent;

        // Handle long_content: CLI flag > file > JSON input
        let longContent = options.longContent || inputData.long_content as string | undefined;
        if (options.longContentFile) {
          longContent = readContentFile(options.longContentFile);
        }
        if (longContent) updates.long_content = longContent;

        if (Object.keys(updates).length === 0) {
          throw new Error('At least one update option is required');
        }

        const post = await updatePost(resolvedId, updates);

        if (isJsonOutput()) {
          output(post);
        } else {
          success('Post updated');
          console.log();
          printKeyValue({
            'ID': post.id,
            'Title': post.title,
            'Status': post.status,
            'Expires': post.expires_at,
          });
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net posts close <postId>
  postsCommand
    .command('close [postId]')
    .description('Close a post (use "current" for stored context)')
    .action(async (postId) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(postId || 'current', 'post');
        if (!resolvedId) {
          throw new Error('Post ID is required');
        }

        const result = await closePost(resolvedId);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(result.message);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net posts delete <postId>
  postsCommand
    .command('delete [postId]')
    .description('Delete a post (use "current" for stored context)')
    .action(async (postId) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(postId || 'current', 'post');
        if (!resolvedId) {
          throw new Error('Post ID is required');
        }

        const result = await deletePost(resolvedId);

        if (isJsonOutput()) {
          output(result);
        } else {
          success(result.message);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net posts apply <postId>
  postsCommand
    .command('apply [postId]')
    .description('Apply to a post (use "current" for stored context)')
    .option('-f, --file <path>', 'JSON file with application data')
    .option('--stdin', 'Read JSON input from stdin')
    .option('--content-file <path>', 'Read application content from file')
    .option('--cover-note <note>', 'Cover note for application')
    .option('--expected-salary <salary>', 'Expected salary')
    .option('--availability <date>', 'Availability')
    .option('--content <markdown>', 'Application content (markdown)')
    .action(async (postId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(postId || 'current', 'post');
        if (!resolvedId) {
          throw new Error('Post ID is required');
        }

        // Parse JSON input if provided
        let inputData: Record<string, unknown> = {};
        if (options.file || options.stdin) {
          inputData = await readJsonInput<Record<string, unknown>>({
            file: options.file,
            stdin: options.stdin,
          });
          validateNetApplicationInput(inputData);
        }

        // Merge JSON input with CLI flags (CLI overrides JSON)
        const data: ApplicationData = {};
        const coverNote = options.coverNote || inputData.cover_note;
        const expectedSalary = options.expectedSalary
          ? parseFloat(options.expectedSalary)
          : inputData.expected_salary as number | undefined;
        const availability = options.availability || inputData.availability;

        if (coverNote) data.cover_note = coverNote as string;
        if (expectedSalary) data.expected_salary = expectedSalary;
        if (availability) data.availability = availability as string;

        // Handle content: CLI flag > content-file > JSON input
        let contentMd = options.content || inputData.content_md as string | undefined;
        if (options.contentFile) {
          contentMd = readContentFile(options.contentFile);
        }

        const application = await applyToPost(
          resolvedId,
          Object.keys(data).length > 0 ? data : undefined,
          contentMd
        );

        if (isJsonOutput()) {
          output(application);
        } else {
          success('Application submitted!');
          console.log();
          printKeyValue({
            'Application ID': application.id,
            'Post ID': application.post_id,
            'Status': application.status,
            'Created': application.created_at,
          });
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net posts applications <postId>
  postsCommand
    .command('applications [postId]')
    .description('List applications for a post (use "current" for stored context)')
    .option('--status <status>', 'Filter by status (pending, accepted, rejected, withdrawn)')
    .option('--keyword <keyword>', 'Search keyword')
    .option('--limit <limit>', 'Number of results', '20')
    .option('--skip <skip>', 'Number of results to skip', '0')
    .action(async (postId, options) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(postId || 'current', 'post');
        if (!resolvedId) {
          throw new Error('Post ID is required');
        }

        const result = await getPostApplications(resolvedId, {
          status: options.status,
          keyword: options.keyword,
          limit: parseInt(options.limit),
          skip: parseInt(options.skip),
        });

        if (isJsonOutput()) {
          output(result);
        } else {
          if (result.data.length === 0) {
            success('No applications found');
            return;
          }

          success(`Applications (${result.data.length}${result.pagination.has_more ? '+' : ''}):`);
          console.log();
          printTable(
            ['ID', 'Applicant', 'Status', 'Created'],
            result.data.map(app => [
              app.id,
              app.applicant_name || app.applicant_id,
              app.status,
              new Date(app.created_at).toLocaleDateString(),
            ])
          );
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net posts check-applied <postId>
  postsCommand
    .command('check-applied [postId]')
    .description('Check if you applied to a post (use "current" for stored context)')
    .action(async (postId) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const resolvedId = resolveId(postId || 'current', 'post');
        if (!resolvedId) {
          throw new Error('Post ID is required');
        }

        const application = await checkMyApplication(resolvedId);

        if (isJsonOutput()) {
          output(application);
        } else {
          if (!application) {
            info('You have not applied to this post');
          } else {
            success('Your application:');
            console.log();
            printKeyValue({
              'Application ID': application.id,
              'Status': application.status,
              'Created': application.created_at,
              'Rejection Reason': application.rejection_reason,
            });
          }
        }
      } catch (err) {
        handleError(err);
      }
    });

  // net posts use <postId>
  postsCommand
    .command('use <postId>')
    .description('Set a post as current context')
    .action(async (postId) => {
      try {
        const apiKey = getApiKey();
        requireAuth(apiKey);

        const post = await getPostById(postId);
        setContext('post', post.id);

        if (isJsonOutput()) {
          output({ success: true, post_id: post.id, post_title: post.title });
        } else {
          success(`Set current post to: ${post.title || post.id}`);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
