/**
 * Jest test setup file
 * Common utilities and mocks for all tests
 */

import * as path from 'path';
import * as os from 'os';

// Mock config directory to use a temp directory for tests
const TEST_CONFIG_DIR = path.join(os.tmpdir(), '.nimrobo-test-' + process.pid);

// Store original env
const originalEnv = process.env;

beforeAll(() => {
  // Silence console output during tests unless debugging
  if (!process.env.DEBUG_TESTS) {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  }
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Helper to reset modules between tests
export function resetModules(): void {
  jest.resetModules();
}

// Helper to mock process.exit
export function mockProcessExit(): jest.SpyInstance {
  return jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
    throw new Error(`Process exited with code ${code}`);
  });
}

// Export test config dir
export { TEST_CONFIG_DIR };
