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
import { PostData, ApplicationData } from '../../../types';

export function registerPostsCommands(program: Command): void {
  const postsCommand = program
    .command('posts')
    .description('Manage job posts');

  // net posts create
  postsCommand
    .command('create')
    .description('Create a new job post')
    .option('-f, --file <path>', 'JSON file with post data')
    .option('--stdin', 'Read JSON input from stdin')
    .option('--content-file <path>', 'Read job description from file')
    .option('--title <title>', 'Job title')
    .option('--expires <date>', 'Expiration date (ISO format)')
    .option('--org <orgId>', 'Organization ID (use "current" for stored context)')
    .option('--compensation <type>', 'Compensation type (salary, hourly, equity, unpaid)')
    .option('--employment <type>', 'Employment type (full_time, part_time, contract, internship, freelance)')
    .option('--remote <type>', 'Remote type (remote, hybrid, onsite)')
    .option('--education <level>', 'Education level (high_school, bachelors, masters, phd, any)')
    .option('--salary <amount>', 'Salary amount')
    .option('--salary-currency <code>', 'Salary currency (e.g., USD)', 'USD')
    .option('--hourly-rate <amount>', 'Hourly rate')
    .option('--hourly-currency <code>', 'Hourly rate currency', 'USD')
    .option('--experience <years>', 'Minimum years of experience')
    .option('--skills <skills>', 'Required skills (comma-separated)')
    .option('--city <city>', 'Job location city')
    .option('--country <country>', 'Job location country')
    .option('--urgent', 'Mark as urgent')
    .option('--content <markdown>', 'Job description (markdown)')
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

        // Build data from JSON input and CLI flags (CLI flags override JSON)
        const data: PostData = {
          title: options.title || inputData.title as string,
        };

        const compensation = options.compensation || inputData.compensation;
        const employment = options.employment || inputData.employment;
        const remote = options.remote || inputData.remote;
        const education = options.education || inputData.education;
        const salary = options.salary ? parseFloat(options.salary) : inputData.salary as number | undefined;
        const salaryCurrency = options.salaryCurrency || inputData.salary_currency || 'USD';
        const hourlyRate = options.hourlyRate ? parseFloat(options.hourlyRate) : inputData.hourly_rate as number | undefined;
        const hourlyCurrency = options.hourlyCurrency || inputData.hourly_rate_currency || 'USD';
        const experience = options.experience ? parseInt(options.experience) : inputData.experience as number | undefined;
        const skills = options.skills
          ? options.skills.split(',').map((s: string) => s.trim())
          : inputData.skills as string[] | undefined;
        const city = options.city || inputData.city;
        const country = options.country || inputData.country;
        const urgent = options.urgent || inputData.urgent;
        const expires = options.expires || inputData.expires;
        const org = options.org || inputData.org;

        if (compensation) data.compensation_type = compensation as PostData['compensation_type'];
        if (employment) data.employment_type = employment as PostData['employment_type'];
        if (remote) data.remote = remote as PostData['remote'];
        if (education) data.education_level = education as PostData['education_level'];
        if (salary) {
          data.salary = salary;
          data.salary_currency = salaryCurrency as string;
        }
        if (hourlyRate) {
          data.hourly_rate = hourlyRate;
          data.hourly_rate_currency = hourlyCurrency as string;
        }
        if (experience) data.min_years_experience = experience;
        if (skills) data.required_skills = skills;
        if (city || country) {
          data.location = {};
          if (city) data.location.city = city as string;
          if (country) data.location.country = country as string;
        }
        if (urgent) data.urgent = true;

        // Handle content: CLI flag > content-file > JSON input
        let contentMd = options.content || inputData.content_md as string | undefined;
        if (options.contentFile) {
          contentMd = readContentFile(options.contentFile);
        }

        // Validate required fields
        if (!data.title) {
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
          post_type: 'job',
          data,
          content_md: contentMd,
          expires_at: expires as string,
          org_id: orgId || undefined,
        });

        if (options.use) {
          setContext('post', post.id);
        }

        if (isJsonOutput()) {
          output(post);
        } else {
          success(`Post created: ${post.data?.title || post.id}`);
          console.log();
          printKeyValue({
            'ID': post.id,
            'Title': post.data?.title,
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
    .description('List job posts')
    .option('--keyword <keyword>', 'Search keyword')
    .option('--status <status>', 'Filter by status (active, closed)')
    .option('--org <orgId>', 'Filter by organization')
    .option('--compensation <type>', 'Filter by compensation type')
    .option('--employment <type>', 'Filter by employment type')
    .option('--remote <type>', 'Filter by remote type')
    .option('--education <level>', 'Filter by education level')
    .option('--salary-min <amount>', 'Minimum salary (USD)')
    .option('--salary-max <amount>', 'Maximum salary (USD)')
    .option('--hourly-min <amount>', 'Minimum hourly rate (USD)')
    .option('--hourly-max <amount>', 'Maximum hourly rate (USD)')
    .option('--experience-min <years>', 'Minimum years experience')
    .option('--experience-max <years>', 'Maximum years experience')
    .option('--skills <skills>', 'Required skills (comma-separated)')
    .option('--city <city>', 'Filter by city')
    .option('--country <country>', 'Filter by country')
    .option('--urgent', 'Filter urgent posts only')
    .option('--include-applied', 'Include posts you already applied to')
    .option('--limit <limit>', 'Number of results', '20')
    .option('--skip <skip>', 'Number of results to skip', '0')
    .option('--sort <field>', 'Sort field (created_at, expires_at, salary_in_usd)')
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

        if (options.keyword) params.keyword = options.keyword;
        if (options.status) params.status = options.status;
        if (options.org) params.org_id = resolveId(options.org, 'org') || undefined;
        if (options.compensation) params.compensation_type = options.compensation;
        if (options.employment) params.employment_type = options.employment;
        if (options.remote) params.remote = options.remote;
        if (options.education) params.education_level = options.education;
        if (options.salaryMin) params.salary_min = parseFloat(options.salaryMin);
        if (options.salaryMax) params.salary_max = parseFloat(options.salaryMax);
        if (options.hourlyMin) params.hourly_rate_min = parseFloat(options.hourlyMin);
        if (options.hourlyMax) params.hourly_rate_max = parseFloat(options.hourlyMax);
        if (options.experienceMin) params.experience_min = parseInt(options.experienceMin);
        if (options.experienceMax) params.experience_max = parseInt(options.experienceMax);
        if (options.skills) params.skills = options.skills;
        if (options.city) params.location_city = options.city;
        if (options.country) params.location_country = options.country;
        if (options.urgent) params.urgent = true;
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
              (post.data?.title || '(untitled)').substring(0, 30),
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
            'Title': post.data?.title,
            'Type': post.post_type,
            'Status': post.status,
            'Organization': post.org_name || post.org_id,
            'Compensation': post.data?.compensation_type,
            'Employment': post.data?.employment_type,
            'Remote': post.data?.remote,
            'Salary': post.data?.salary ? `${post.data.salary} ${post.data.salary_currency}` : null,
            'Hourly': post.data?.hourly_rate ? `${post.data.hourly_rate} ${post.data.hourly_rate_currency}` : null,
            'Experience': post.data?.min_years_experience ? `${post.data.min_years_experience}+ years` : null,
            'Skills': post.data?.required_skills?.join(', '),
            'Location': post.data?.location
              ? `${post.data.location.city || ''}${post.data.location.city && post.data.location.country ? ', ' : ''}${post.data.location.country || ''}`
              : null,
            'Urgent': post.data?.urgent,
            'Applications': post.application_count,
            'Expires': post.expires_at,
            'Created': post.created_at,
          });
          if (post.content_md) {
            console.log();
            console.log('Description:');
            console.log(post.content_md);
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
    .option('--content-file <path>', 'Read description from file')
    .option('--expires <date>', 'New expiration date')
    .option('--content <markdown>', 'Updated description')
    .option('--title <title>', 'Job title (only before applications)')
    .option('--compensation <type>', 'Compensation type (only before applications)')
    .option('--employment <type>', 'Employment type (only before applications)')
    .option('--remote <type>', 'Remote type (only before applications)')
    .option('--salary <amount>', 'Salary amount (only before applications)')
    .option('--hourly-rate <amount>', 'Hourly rate (only before applications)')
    .option('--experience <years>', 'Min experience (only before applications)')
    .option('--skills <skills>', 'Required skills (only before applications)')
    .option('--city <city>', 'Location city (only before applications)')
    .option('--country <country>', 'Location country (only before applications)')
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
          expires_at?: string;
          content_md?: string;
          data?: PostData;
        } = {};

        // Merge JSON input with CLI flags (CLI overrides JSON)
        const expires = options.expires || inputData.expires;
        if (expires) updates.expires_at = expires as string;

        // Handle content: CLI flag > content-file > JSON input
        let contentMd = options.content || inputData.content_md as string | undefined;
        if (options.contentFile) {
          contentMd = readContentFile(options.contentFile);
        }
        if (contentMd) updates.content_md = contentMd;

        // Data updates (only work before applications)
        const dataUpdates: PostData = {};
        const title = options.title || inputData.title;
        const compensation = options.compensation || inputData.compensation;
        const employment = options.employment || inputData.employment;
        const remote = options.remote || inputData.remote;
        const salary = options.salary ? parseFloat(options.salary) : inputData.salary as number | undefined;
        const hourlyRate = options.hourlyRate ? parseFloat(options.hourlyRate) : inputData.hourly_rate as number | undefined;
        const experience = options.experience ? parseInt(options.experience) : inputData.experience as number | undefined;
        const skills = options.skills
          ? options.skills.split(',').map((s: string) => s.trim())
          : inputData.skills as string[] | undefined;
        const city = options.city || inputData.city;
        const country = options.country || inputData.country;

        if (title) dataUpdates.title = title as string;
        if (compensation) dataUpdates.compensation_type = compensation as PostData['compensation_type'];
        if (employment) dataUpdates.employment_type = employment as PostData['employment_type'];
        if (remote) dataUpdates.remote = remote as PostData['remote'];
        if (salary) dataUpdates.salary = salary;
        if (hourlyRate) dataUpdates.hourly_rate = hourlyRate;
        if (experience) dataUpdates.min_years_experience = experience;
        if (skills) dataUpdates.required_skills = skills;
        if (city || country) {
          dataUpdates.location = {};
          if (city) dataUpdates.location.city = city as string;
          if (country) dataUpdates.location.country = country as string;
        }

        if (Object.keys(dataUpdates).length > 0) {
          updates.data = dataUpdates;
        }

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
            'Title': post.data?.title,
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
          output({ success: true, post_id: post.id, post_title: post.data?.title });
        } else {
          success(`Set current post to: ${post.data?.title || post.id}`);
        }
      } catch (err) {
        handleError(err);
      }
    });
}
