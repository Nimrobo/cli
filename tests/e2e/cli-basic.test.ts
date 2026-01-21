/**
 * E2E tests for basic CLI commands
 * Tests CLI as a subprocess to verify end-to-end behavior
 */

import { execSync, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Path to the CLI binary
const CLI_PATH = path.join(__dirname, '../../bin/nimrobo');

// Test config directory
const TEST_CONFIG_DIR = path.join(os.tmpdir(), `.nimrobo-e2e-${process.pid}`);
const TEST_CONFIG_FILE = path.join(TEST_CONFIG_DIR, 'config.json');

// Helper to run CLI commands
function runCli(args: string, options: { env?: NodeJS.ProcessEnv } = {}): { stdout: string; stderr: string; exitCode: number } {
  const env = {
    ...process.env,
    HOME: os.tmpdir(), // Use temp as home to isolate config
    ...options.env,
  };

  try {
    const stdout = execSync(`node ${CLI_PATH} ${args}`, {
      env,
      encoding: 'utf-8',
      timeout: 30000,
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

// Helper to run CLI with JSON output
function runCliJson(args: string): { data: any; exitCode: number } {
  const result = runCli(`${args} --json`);
  try {
    const data = JSON.parse(result.stdout);
    return { data, exitCode: result.exitCode };
  } catch {
    return { data: null, exitCode: result.exitCode };
  }
}

describe('CLI E2E Tests', () => {
  beforeAll(() => {
    // Ensure CLI is built
    try {
      execSync('npm run build', { cwd: path.join(__dirname, '../..'), stdio: 'pipe' });
    } catch (e) {
      console.warn('Build failed or already built');
    }
  });

  beforeEach(() => {
    // Clean up test config
    if (fs.existsSync(TEST_CONFIG_DIR)) {
      fs.rmSync(TEST_CONFIG_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(TEST_CONFIG_DIR)) {
      fs.rmSync(TEST_CONFIG_DIR, { recursive: true });
    }
  });

  describe('Help command', () => {
    it('should display help information', () => {
      const result = runCli('--help');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('nimrobo');
      expect(result.stdout).toContain('screen');
      expect(result.stdout).toContain('net');
    });

    it('should display screen help', () => {
      const result = runCli('screen --help');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('login');
      expect(result.stdout).toContain('logout');
      expect(result.stdout).toContain('status');
    });

    it('should display net help', () => {
      const result = runCli('net --help');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('my');
      expect(result.stdout).toContain('users');
      expect(result.stdout).toContain('orgs');
      expect(result.stdout).toContain('posts');
      expect(result.stdout).toContain('applications');
      expect(result.stdout).toContain('channels');
    });
  });

  describe('Version', () => {
    it('should display version', () => {
      const result = runCli('--version');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('Status command (unauthenticated)', () => {
    it('should show not authenticated status', () => {
      const result = runCli('screen status');

      // Should indicate not authenticated
      expect(result.stdout.toLowerCase()).toMatch(/not (authenticated|logged in)/i);
    });
  });

  describe('Net context commands', () => {
    it('should show context help', () => {
      const result = runCli('net context --help');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('show');
      expect(result.stdout).toContain('clear');
    });
  });

  describe('Net my commands (unauthenticated)', () => {
    it('should show my profile help', () => {
      const result = runCli('net my --help');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('profile');
      expect(result.stdout).toContain('orgs');
      expect(result.stdout).toContain('posts');
      expect(result.stdout).toContain('applications');
    });

    it('should fail profile command when not authenticated', () => {
      const result = runCli('net my profile');

      // Should fail with auth error
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('Net orgs commands', () => {
    it('should show orgs help', () => {
      const result = runCli('net orgs --help');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('create');
      expect(result.stdout).toContain('list');
      expect(result.stdout).toContain('get');
      expect(result.stdout).toContain('update');
      expect(result.stdout).toContain('delete');
    });
  });

  describe('Net posts commands', () => {
    it('should show posts help', () => {
      const result = runCli('net posts --help');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('create');
      expect(result.stdout).toContain('list');
      expect(result.stdout).toContain('get');
      expect(result.stdout).toContain('apply');
    });
  });

  describe('Net applications commands', () => {
    it('should show applications help', () => {
      const result = runCli('net applications --help');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('get');
      expect(result.stdout).toContain('accept');
      expect(result.stdout).toContain('reject');
      expect(result.stdout).toContain('withdraw');
    });
  });

  describe('Net channels commands', () => {
    it('should show channels help', () => {
      const result = runCli('net channels --help');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('list');
      expect(result.stdout).toContain('get');
      expect(result.stdout).toContain('messages');
      expect(result.stdout).toContain('send');
    });
  });

  describe('Invalid commands', () => {
    it('should show error for unknown command', () => {
      const result = runCli('unknowncommand');

      expect(result.exitCode).not.toBe(0);
    });

    it('should show error for unknown subcommand', () => {
      const result = runCli('net unknownsub');

      expect(result.exitCode).not.toBe(0);
    });
  });
});
