/**
 * E2E tests for authentication commands
 * Tests login/logout flows
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Path to CLI binary
const CLI_PATH = path.join(__dirname, '../../bin/nimrobo');

// Test config directory - use a unique path for auth tests
const TEST_HOME = path.join(os.tmpdir(), `.nimrobo-auth-test-${process.pid}`);
const TEST_CONFIG_DIR = path.join(TEST_HOME, '.nimrobo');
const TEST_CONFIG_FILE = path.join(TEST_CONFIG_DIR, 'config.json');

// Helper to run CLI
function runCli(args: string, input?: string): { stdout: string; stderr: string; exitCode: number } {
  const env = {
    ...process.env,
    HOME: TEST_HOME,
    // Skip interactive prompts
    CI: 'true',
  };

  try {
    const stdout = execSync(`node ${CLI_PATH} ${args}`, {
      env,
      encoding: 'utf-8',
      timeout: 30000,
      input,
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.status || 1,
    };
  }
}

// Helper to set up config directly
function setConfig(config: Record<string, any>): void {
  if (!fs.existsSync(TEST_CONFIG_DIR)) {
    fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(TEST_CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Helper to read config
function getConfig(): Record<string, any> | null {
  if (!fs.existsSync(TEST_CONFIG_FILE)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(TEST_CONFIG_FILE, 'utf-8'));
}

describe('CLI Authentication E2E Tests', () => {
  beforeAll(() => {
    // Ensure CLI is built
    try {
      execSync('npm run build', { cwd: path.join(__dirname, '../..'), stdio: 'pipe' });
    } catch (e) {
      // Ignore - might already be built
    }
  });

  beforeEach(() => {
    // Clean up test config
    if (fs.existsSync(TEST_HOME)) {
      fs.rmSync(TEST_HOME, { recursive: true });
    }
    fs.mkdirSync(TEST_HOME, { recursive: true });
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(TEST_HOME)) {
      fs.rmSync(TEST_HOME, { recursive: true });
    }
  });

  describe('Logout command', () => {
    it('should clear API key on logout', () => {
      // Set up authenticated config
      setConfig({
        API_BASE_URL: 'https://app.nimroboai.com/api',
        NET_API_BASE_URL: 'http://localhost:3000',
        API_KEY: 'test-key-to-clear',
        defaultProject: 'proj-123',
        context: { orgId: null, postId: null, channelId: null, userId: null },
      });

      // Verify key is set
      let config = getConfig();
      expect(config?.API_KEY).toBe('test-key-to-clear');

      // Run logout (now a global command)
      const result = runCli('logout');

      // Check key is cleared
      config = getConfig();
      expect(config?.API_KEY).toBeNull();
    });

    it('should show success message after logout', () => {
      setConfig({
        API_BASE_URL: 'https://app.nimroboai.com/api',
        API_KEY: 'some-key',
        context: { orgId: null, postId: null, channelId: null, userId: null },
      });

      const result = runCli('logout');

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toContain('logged out');
    });
  });

  describe('Status command', () => {
    it('should show unauthenticated status when no API key', () => {
      // No config or null API key
      setConfig({
        API_BASE_URL: 'https://app.nimroboai.com/api',
        API_KEY: null,
        context: { orgId: null, postId: null, channelId: null, userId: null },
      });

      const result = runCli('status');

      expect(result.stdout.toLowerCase()).toMatch(/not (authenticated|logged)/i);
    });

    it('should attempt to validate when API key is set', () => {
      // When API key is set, status command tries to validate against API
      // Without a real API, this will fail with a network/auth error
      setConfig({
        API_BASE_URL: 'https://app.nimroboai.com/api',
        NET_API_BASE_URL: 'http://localhost:3000',
        API_KEY: 'test-key-without-real-api',
        defaultProject: null,
        context: { orgId: null, postId: null, channelId: null, userId: null },
      });

      const result = runCli('status');

      // Since there's no real API, this will fail with an error
      // The command attempts to fetch user profile which requires a real API connection
      expect(result.exitCode).not.toBe(0);
    });

    it('should show API URL in output', () => {
      setConfig({
        API_BASE_URL: 'https://custom-api.example.com/api',
        API_KEY: null,
        context: { orgId: null, postId: null, channelId: null, userId: null },
      });

      const result = runCli('status');

      expect(result.stdout).toContain('https://custom-api.example.com/api');
    });
  });

  describe('Context commands', () => {
    it('should show empty context when nothing set', () => {
      setConfig({
        API_BASE_URL: 'https://app.nimroboai.com/api',
        NET_API_BASE_URL: 'http://localhost:3000',
        API_KEY: 'test-key',
        defaultProject: null,
        context: { orgId: null, postId: null, channelId: null, userId: null },
      });

      const result = runCli('net context show');

      expect(result.exitCode).toBe(0);
    });

    it('should clear all context', () => {
      setConfig({
        API_BASE_URL: 'https://app.nimroboai.com/api',
        NET_API_BASE_URL: 'http://localhost:3000',
        API_KEY: 'test-key',
        defaultProject: null,
        context: { orgId: 'org-123', postId: 'post-456', channelId: null, userId: null },
      });

      const result = runCli('net context clear');

      expect(result.exitCode).toBe(0);

      // Verify context is cleared
      const config = getConfig();
      expect(config?.context?.orgId).toBeNull();
      expect(config?.context?.postId).toBeNull();
    });
  });
});
