import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { getApiKey, setContext } from '../utils/config';
import { requireAuth, handleError } from '../utils/errors';
import { success, output, isJsonOutput, printKeyValue, info, warn } from '../utils/output';
import { readJsonFile, validateOnboardInput, OnboardInput } from '../utils/file-input';
import { getMyProfile, updateMyProfile, getMyOrgs } from '../api/net/users';
import { createOrg } from '../api/net/orgs';
import { NetUserProfile } from '../types';

const TEMPLATE_FILENAME = 'onboard-template.json';

const ONBOARD_TEMPLATE: OnboardInput = {
  profile: {
    name: 'Your Name',
    city: 'San Francisco',
    country: 'USA',
    bio: 'A short bio about yourself',
    content: 'Long-form profile content (markdown supported)',
  },
  org: {
    name: 'Your Organization',
    description: 'What your organization does',
    website: 'https://example.com',
  },
};

/**
 * Format JSON with syntax highlighting
 */
function formatJsonWithColors(obj: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent);
  
  if (obj === null) {
    return chalk.gray('null');
  }
  
  if (typeof obj === 'string') {
    return chalk.green(`"${obj}"`);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return chalk.yellow(String(obj));
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj.map(item => `${spaces}  ${formatJsonWithColors(item, indent + 1)}`);
    return `[\n${items.join(',\n')}\n${spaces}]`;
  }
  
  if (typeof obj === 'object') {
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    const lines = entries.map(([key, value]) => {
      return `${spaces}  ${chalk.cyan(`"${key}"`)}: ${formatJsonWithColors(value, indent + 1)}`;
    });
    return `{\n${lines.join(',\n')}\n${spaces}}`;
  }
  
  return String(obj);
}

function printInstructions(): void {
  console.log(chalk.bold.cyan('\nNimrobo Onboarding\n'));
  console.log('Welcome! This command helps you set up your profile and optionally create an organization.\n');

  console.log(chalk.bold('How to use:\n'));
  console.log('1. Generate a template JSON file:');
  console.log(`   ${chalk.yellow('nimrobo onboard --generate-template')}\n`);
  console.log('2. Edit the generated file with your information');
  console.log('3. Apply your configuration:');
  console.log(`   ${chalk.yellow('nimrobo onboard --file onboard-template.json')}\n`);

  console.log(chalk.bold('JSON Schema:\n'));
  console.log(formatJsonWithColors(ONBOARD_TEMPLATE));

  console.log(chalk.bold('\n\nNotes:'));
  console.log(`- The ${chalk.cyan('"profile"')} section is required`);
  console.log(`- The ${chalk.cyan('"org"')} section is optional - remove it if you don't need an organization`);
  console.log('- All fields within profile are optional, but we recommend at least setting your name');
  console.log(`- If you include an org, the ${chalk.cyan('org.name')} field is required\n`);
}

function generateTemplate(): void {
  const templatePath = path.resolve(process.cwd(), TEMPLATE_FILENAME);

  if (fs.existsSync(templatePath)) {
    throw new Error(`File already exists: ${TEMPLATE_FILENAME}. Please remove it first or use a different directory.`);
  }

  fs.writeFileSync(templatePath, JSON.stringify(ONBOARD_TEMPLATE, null, 2) + '\n', 'utf-8');

  if (isJsonOutput()) {
    output({ success: true, file: templatePath });
  } else {
    success(`Template created: ${TEMPLATE_FILENAME}`);
    console.log();
    info('Edit the file with your information, then run:');
    console.log(`   ${chalk.yellow(`nimrobo onboard --file ${TEMPLATE_FILENAME}`)}`);
    console.log();
  }
}

async function applyOnboarding(filePath: string): Promise<void> {
  // Check if user already has profile/orgs set up
  const existingProfile = await getMyProfile();
  const existingOrgs = await getMyOrgs({ limit: 1 });

  const hasProfile = existingProfile.profile?.data?.name;
  const hasOrgs = existingOrgs.data.length > 0;

  if (hasProfile || hasOrgs) {
    if (isJsonOutput()) {
      output({
        success: false,
        error: 'Profile or organization already exists',
        has_profile: !!hasProfile,
        has_orgs: hasOrgs,
      });
      process.exit(1);
    }

    console.log();
    warn('It looks like you already have an account set up:\n');
    
    if (hasProfile) {
      console.log(`  Profile name: ${chalk.cyan(existingProfile.profile?.data?.name)}`);
    }
    if (hasOrgs) {
      console.log(`  Organizations: ${chalk.cyan(existingOrgs.data.length)} org(s)`);
    }

    console.log();
    console.log('To update your existing profile, use:');
    console.log(`   ${chalk.yellow('nimrobo net my update --file <path>')}`);
    console.log();
    console.log('To create a new organization, use:');
    console.log(`   ${chalk.yellow('nimrobo net orgs create --name "Org Name"')}`);
    console.log();
    return;
  }

  // Read and validate input
  const data = readJsonFile<unknown>(filePath);
  const onboardData = validateOnboardInput(data);

  // Build profile update payload
  const profile: NetUserProfile = {};

  if (onboardData.profile.name || onboardData.profile.city || onboardData.profile.country || onboardData.profile.bio) {
    profile.data = {};
    if (onboardData.profile.name) {
      profile.data.name = onboardData.profile.name;
    }
    if (onboardData.profile.city || onboardData.profile.country) {
      profile.data.location = {};
      if (onboardData.profile.city) {
        profile.data.location.city = onboardData.profile.city;
      }
      if (onboardData.profile.country) {
        profile.data.location.country = onboardData.profile.country;
      }
    }
    if (onboardData.profile.bio) {
      profile.data.short_bio = onboardData.profile.bio;
    }
  }

  if (onboardData.profile.content) {
    profile.content = onboardData.profile.content;
  }

  // Update profile
  const updatedUser = await updateMyProfile(profile);

  // Create org if specified
  let createdOrg = null;
  if (onboardData.org) {
    createdOrg = await createOrg(
      onboardData.org.name,
      onboardData.org.description,
      onboardData.org.website
    );

    // Set the new org as context
    setContext('org', createdOrg.id);
  }

  // Output results
  if (isJsonOutput()) {
    output({
      success: true,
      profile: updatedUser,
      org: createdOrg,
    });
  } else {
    success('Onboarding complete!\n');

    console.log(chalk.bold('Profile updated:'));
    printKeyValue({
      'Name': updatedUser.profile?.data?.name,
      'Location': updatedUser.profile?.data?.location
        ? `${updatedUser.profile.data.location.city || ''}${updatedUser.profile.data.location.city && updatedUser.profile.data.location.country ? ', ' : ''}${updatedUser.profile.data.location.country || ''}`
        : null,
      'Bio': updatedUser.profile?.data?.short_bio,
    });

    if (createdOrg) {
      console.log();
      console.log(chalk.bold('Organization created:'));
      printKeyValue({
        'ID': createdOrg.id,
        'Name': createdOrg.name,
        'Slug': createdOrg.slug,
        'Description': createdOrg.description,
        'Website': createdOrg.website,
      });
      console.log();
      info(`Organization "${createdOrg.name}" set as current context`);
    }
  }
}

export function registerOnboardCommand(program: Command): void {
  program
    .command('onboard')
    .description('Set up your profile and optionally create an organization')
    .option('--generate-template', 'Generate a template JSON file for onboarding')
    .option('-f, --file <path>', 'JSON file with onboarding data')
    .action(async (options) => {
      try {
        if (options.file) {
          // Apply onboarding from file
          const apiKey = getApiKey();
          requireAuth(apiKey);
          await applyOnboarding(options.file);
        } else if (options.generateTemplate) {
          // Generate template file
          generateTemplate();
        } else {
          // Show instructions
          printInstructions();
        }
      } catch (err) {
        handleError(err);
      }
    });
}
