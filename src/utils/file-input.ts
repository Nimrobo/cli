import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

export function readJsonFile<T>(filePath: string): T {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error(`Invalid JSON in file: ${filePath}`);
  }
}

/**
 * Read and parse JSON from stdin
 */
export async function readJsonFromStdin<T>(): Promise<T> {
  return new Promise((resolve, reject) => {
    let data = '';

    // Check if stdin is a TTY (interactive terminal)
    if (process.stdin.isTTY) {
      reject(new Error('No input provided via stdin. Use --file instead or pipe JSON data.'));
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      terminal: false,
    });

    rl.on('line', (line) => {
      data += line + '\n';
    });

    rl.on('close', () => {
      if (!data.trim()) {
        reject(new Error('No input received from stdin'));
        return;
      }

      try {
        resolve(JSON.parse(data.trim()) as T);
      } catch {
        reject(new Error('Invalid JSON from stdin'));
      }
    });

    rl.on('error', (err) => {
      reject(new Error(`Error reading from stdin: ${err.message}`));
    });
  });
}

/**
 * Read content from a file (markdown, text, etc.)
 */
export function readContentFile(filePath: string): string {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Content file not found: ${filePath}`);
  }

  return fs.readFileSync(absolutePath, 'utf-8');
}

export interface JsonInputOptions {
  file?: string;
  stdin?: boolean;
}

/**
 * Unified JSON input handler - reads from file or stdin
 */
export async function readJsonInput<T>(options: JsonInputOptions): Promise<T> {
  if (options.file && options.stdin) {
    throw new Error('Cannot use both --file and --stdin. Choose one.');
  }

  if (options.file) {
    return readJsonFile<T>(options.file);
  }

  if (options.stdin) {
    return readJsonFromStdin<T>();
  }

  throw new Error('No input source specified. Use --file or --stdin.');
}

export function validateProjectInput(data: unknown): void {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid project data: expected an object');
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.name !== 'string' || obj.name.trim().length === 0) {
    throw new Error('Invalid project data: name is required');
  }

  if (typeof obj.prompt !== 'string' || obj.prompt.trim().length === 0) {
    throw new Error('Invalid project data: prompt is required');
  }

  if (obj.evaluator !== undefined && obj.evaluator !== null) {
    validateEvaluator(obj.evaluator);
  }
}

export function validateLinksInput(data: unknown, isInstant: boolean): void {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid links data: expected an object');
  }

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.labels) || obj.labels.length === 0) {
    throw new Error('Invalid links data: labels array is required');
  }

  for (const label of obj.labels) {
    if (typeof label !== 'string' || label.trim().length === 0) {
      throw new Error('Invalid links data: all labels must be non-empty strings');
    }
  }

  const validExpiry = ['1_day', '1_week', '1_month'];
  if (!validExpiry.includes(obj.expiryPreset as string)) {
    throw new Error('Invalid links data: expiryPreset must be 1_day, 1_week, or 1_month');
  }

  if (isInstant) {
    if (typeof obj.prompt !== 'string' || obj.prompt.trim().length === 0) {
      throw new Error('Invalid links data: prompt is required for instant links');
    }

    if (obj.evaluator !== undefined && obj.evaluator !== null) {
      validateEvaluator(obj.evaluator);
    }
  }
}

export function validateUpdateLinkInput(data: unknown): void {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid update data: expected an object');
  }

  const obj = data as Record<string, unknown>;

  if (obj.expiryPreset !== undefined) {
    const validExpiry = ['1_day', '1_week', '1_month'];
    if (!validExpiry.includes(obj.expiryPreset as string)) {
      throw new Error('Invalid update data: expiryPreset must be 1_day, 1_week, or 1_month');
    }
  }

  if (obj.evaluator !== undefined && obj.evaluator !== null) {
    validateEvaluator(obj.evaluator);
  }
}

function validateEvaluator(evaluator: unknown): void {
  if (typeof evaluator !== 'object' || evaluator === null) {
    throw new Error('Invalid evaluator: expected an object');
  }

  const eval_ = evaluator as Record<string, unknown>;

  if (typeof eval_.prompt !== 'string' || eval_.prompt.trim().length === 0) {
    throw new Error('Invalid evaluator: prompt is required');
  }

  if (!Array.isArray(eval_.questions) || eval_.questions.length === 0) {
    throw new Error('Invalid evaluator: questions array is required');
  }

  for (const q of eval_.questions) {
    if (typeof q !== 'object' || q === null) {
      throw new Error('Invalid evaluator question: expected an object');
    }

    const question = q as Record<string, unknown>;

    if (typeof question.id !== 'string' || question.id.trim().length === 0) {
      throw new Error('Invalid evaluator question: id is required');
    }

    if (typeof question.label !== 'string' || question.label.trim().length === 0) {
      throw new Error('Invalid evaluator question: label is required');
    }

    if (question.type !== 'text' && question.type !== 'number') {
      throw new Error('Invalid evaluator question: type must be "text" or "number"');
    }
  }
}

// ============================================
// Net Command Validators
// ============================================

const VALID_COMPENSATION_TYPES = ['salary', 'hourly', 'equity', 'unpaid'];
const VALID_EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'freelance'];
const VALID_REMOTE_TYPES = ['remote', 'hybrid', 'onsite'];
const VALID_EDUCATION_LEVELS = ['high_school', 'bachelors', 'masters', 'phd', 'any'];

/**
 * Validate post create/update input
 */
export function validateNetPostInput(data: unknown, isCreate = false): void {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid post data: expected an object');
  }

  const obj = data as Record<string, unknown>;

  // Title is required for create
  if (isCreate && (typeof obj.title !== 'string' || obj.title.trim().length === 0)) {
    throw new Error('Invalid post data: title is required');
  }

  // Expires is required for create
  if (isCreate && !obj.expires) {
    throw new Error('Invalid post data: expires is required');
  }

  // Validate optional enum fields
  if (obj.compensation !== undefined && !VALID_COMPENSATION_TYPES.includes(obj.compensation as string)) {
    throw new Error(`Invalid post data: compensation must be one of: ${VALID_COMPENSATION_TYPES.join(', ')}`);
  }

  if (obj.employment !== undefined && !VALID_EMPLOYMENT_TYPES.includes(obj.employment as string)) {
    throw new Error(`Invalid post data: employment must be one of: ${VALID_EMPLOYMENT_TYPES.join(', ')}`);
  }

  if (obj.remote !== undefined && !VALID_REMOTE_TYPES.includes(obj.remote as string)) {
    throw new Error(`Invalid post data: remote must be one of: ${VALID_REMOTE_TYPES.join(', ')}`);
  }

  if (obj.education !== undefined && !VALID_EDUCATION_LEVELS.includes(obj.education as string)) {
    throw new Error(`Invalid post data: education must be one of: ${VALID_EDUCATION_LEVELS.join(', ')}`);
  }

  // Validate numeric fields
  if (obj.salary !== undefined && typeof obj.salary !== 'number') {
    throw new Error('Invalid post data: salary must be a number');
  }

  if (obj.hourly_rate !== undefined && typeof obj.hourly_rate !== 'number') {
    throw new Error('Invalid post data: hourly_rate must be a number');
  }

  if (obj.experience !== undefined && typeof obj.experience !== 'number') {
    throw new Error('Invalid post data: experience must be a number');
  }

  // Validate skills array
  if (obj.skills !== undefined) {
    if (!Array.isArray(obj.skills)) {
      throw new Error('Invalid post data: skills must be an array');
    }
    for (const skill of obj.skills) {
      if (typeof skill !== 'string') {
        throw new Error('Invalid post data: all skills must be strings');
      }
    }
  }
}

/**
 * Validate application input (for posts apply)
 */
export function validateNetApplicationInput(data: unknown): void {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid application data: expected an object');
  }

  const obj = data as Record<string, unknown>;

  if (obj.cover_note !== undefined && typeof obj.cover_note !== 'string') {
    throw new Error('Invalid application data: cover_note must be a string');
  }

  if (obj.expected_salary !== undefined && typeof obj.expected_salary !== 'number') {
    throw new Error('Invalid application data: expected_salary must be a number');
  }

  if (obj.availability !== undefined && typeof obj.availability !== 'string') {
    throw new Error('Invalid application data: availability must be a string');
  }
}

/**
 * Validate organization create/update input
 */
export function validateNetOrgInput(data: unknown, isCreate = false): void {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid org data: expected an object');
  }

  const obj = data as Record<string, unknown>;

  // Name is required for create
  if (isCreate && (typeof obj.name !== 'string' || obj.name.trim().length === 0)) {
    throw new Error('Invalid org data: name is required');
  }

  if (obj.description !== undefined && typeof obj.description !== 'string') {
    throw new Error('Invalid org data: description must be a string');
  }

  if (obj.website !== undefined && typeof obj.website !== 'string') {
    throw new Error('Invalid org data: website must be a string');
  }
}

/**
 * Validate user profile update input
 */
export function validateNetProfileInput(data: unknown): void {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid profile data: expected an object');
  }

  const obj = data as Record<string, unknown>;

  if (obj.name !== undefined && typeof obj.name !== 'string') {
    throw new Error('Invalid profile data: name must be a string');
  }

  if (obj.city !== undefined && typeof obj.city !== 'string') {
    throw new Error('Invalid profile data: city must be a string');
  }

  if (obj.country !== undefined && typeof obj.country !== 'string') {
    throw new Error('Invalid profile data: country must be a string');
  }

  if (obj.bio !== undefined && typeof obj.bio !== 'string') {
    throw new Error('Invalid profile data: bio must be a string');
  }

  if (obj.content !== undefined && typeof obj.content !== 'string') {
    throw new Error('Invalid profile data: content must be a string');
  }
}

/**
 * Validate batch action input
 */
export function validateNetBatchActionInput(data: unknown): void {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid batch action data: expected an object');
  }

  const obj = data as Record<string, unknown>;

  if (!['accept', 'reject'].includes(obj.action as string)) {
    throw new Error('Invalid batch action data: action must be "accept" or "reject"');
  }

  if (!Array.isArray(obj.ids) || obj.ids.length === 0) {
    throw new Error('Invalid batch action data: ids array is required');
  }

  for (const id of obj.ids) {
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Invalid batch action data: all ids must be non-empty strings');
    }
  }

  if (obj.channel_expires !== undefined && typeof obj.channel_expires !== 'string') {
    throw new Error('Invalid batch action data: channel_expires must be an ISO date string');
  }

  if (obj.reason !== undefined && typeof obj.reason !== 'string') {
    throw new Error('Invalid batch action data: reason must be a string');
  }
}

/**
 * Validate org invite input
 */
export function validateNetOrgInviteInput(data: unknown): void {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid invite data: expected an object');
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.email !== 'string' || obj.email.trim().length === 0) {
    throw new Error('Invalid invite data: email is required');
  }

  if (obj.role !== undefined && !['admin', 'member'].includes(obj.role as string)) {
    throw new Error('Invalid invite data: role must be "admin" or "member"');
  }
}

/**
 * Validate message/channel send input
 */
export function validateNetMessageInput(data: unknown): void {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid message data: expected an object');
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.message !== 'string' || obj.message.trim().length === 0) {
    throw new Error('Invalid message data: message is required');
  }
}

/**
 * Validate application accept input
 */
export function validateNetAcceptInput(data: unknown): void {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid accept data: expected an object');
  }

  const obj = data as Record<string, unknown>;

  if (obj.channel_expires !== undefined && typeof obj.channel_expires !== 'string') {
    throw new Error('Invalid accept data: channel_expires must be an ISO date string');
  }

  if (obj.context !== undefined && typeof obj.context !== 'string') {
    throw new Error('Invalid accept data: context must be a string');
  }
}

/**
 * Validate application reject input
 */
export function validateNetRejectInput(data: unknown): void {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid reject data: expected an object');
  }

  const obj = data as Record<string, unknown>;

  if (obj.reason !== undefined && typeof obj.reason !== 'string') {
    throw new Error('Invalid reject data: reason must be a string');
  }
}

// ============================================
// Onboarding Validator
// ============================================

export interface OnboardProfileInput {
  name?: string;
  city?: string;
  country?: string;
  bio?: string;
  content?: string;
}

export interface OnboardOrgInput {
  name: string;
  description?: string;
  website?: string;
}

export interface OnboardInput {
  profile: OnboardProfileInput;
  org?: OnboardOrgInput;
}

/**
 * Validate onboarding input data
 */
export function validateOnboardInput(data: unknown): OnboardInput {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid onboard data: expected an object');
  }

  const obj = data as Record<string, unknown>;

  // Profile is required
  if (!obj.profile || typeof obj.profile !== 'object') {
    throw new Error('Invalid onboard data: profile section is required');
  }

  const profile = obj.profile as Record<string, unknown>;

  // Validate profile fields
  if (profile.name !== undefined && typeof profile.name !== 'string') {
    throw new Error('Invalid onboard data: profile.name must be a string');
  }

  if (profile.city !== undefined && typeof profile.city !== 'string') {
    throw new Error('Invalid onboard data: profile.city must be a string');
  }

  if (profile.country !== undefined && typeof profile.country !== 'string') {
    throw new Error('Invalid onboard data: profile.country must be a string');
  }

  if (profile.bio !== undefined && typeof profile.bio !== 'string') {
    throw new Error('Invalid onboard data: profile.bio must be a string');
  }

  if (profile.content !== undefined && typeof profile.content !== 'string') {
    throw new Error('Invalid onboard data: profile.content must be a string');
  }

  // Org is optional, but if provided, validate it
  if (obj.org !== undefined) {
    if (typeof obj.org !== 'object' || obj.org === null) {
      throw new Error('Invalid onboard data: org must be an object');
    }

    const org = obj.org as Record<string, unknown>;

    // Org name is required if org section is provided
    if (typeof org.name !== 'string' || org.name.trim().length === 0) {
      throw new Error('Invalid onboard data: org.name is required');
    }

    if (org.description !== undefined && typeof org.description !== 'string') {
      throw new Error('Invalid onboard data: org.description must be a string');
    }

    if (org.website !== undefined && typeof org.website !== 'string') {
      throw new Error('Invalid onboard data: org.website must be a string');
    }
  }

  return data as OnboardInput;
}
