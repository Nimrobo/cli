/**
 * Unit tests for config.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Create a unique temp dir for this test file
const TEST_CONFIG_DIR = path.join(os.tmpdir(), `.nimrobo-test-config-${process.pid}-${Date.now()}`);
const TEST_CONFIG_FILE = path.join(TEST_CONFIG_DIR, 'config.json');

// Mock the config module to use test directory
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
  };
});

// Mock os.homedir to return our test directory parent
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: () => os.tmpdir(),
}));

import {
  loadConfig,
  saveConfig,
  getApiKey,
  setApiKey,
  clearApiKey,
  getDefaultProject,
  setDefaultProject,
  getApiBaseUrl,
  isAuthenticated,
  resolveProjectId,
  getNetApiBaseUrl,
  getContext,
  setContext,
  clearContext,
  clearAllContext,
  getAllContext,
  resolveId,
  requireId,
} from '../../src/utils/config';

const mockFs = fs as jest.Mocked<typeof fs>;

describe('config.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(false);
  });

  describe('loadConfig', () => {
    it('should return default config when config file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const config = loadConfig();
      
      expect(config.API_BASE_URL).toBe('https://app.nimroboai.com/api');
      expect(config.NET_API_BASE_URL).toBe('http://localhost:3000');
      expect(config.API_KEY).toBeNull();
      expect(config.defaultProject).toBeNull();
      expect(config.context).toEqual({
        orgId: null,
        postId: null,
        channelId: null,
        userId: null,
      });
    });

    it('should merge stored config with defaults', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        API_KEY: 'test-key',
        defaultProject: 'proj-123',
      }));
      
      const config = loadConfig();
      
      expect(config.API_KEY).toBe('test-key');
      expect(config.defaultProject).toBe('proj-123');
      expect(config.API_BASE_URL).toBe('https://app.nimroboai.com/api');
    });

    it('should return default config on parse error', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');
      
      const config = loadConfig();
      
      expect(config.API_KEY).toBeNull();
    });
  });

  describe('saveConfig', () => {
    it('should write config to file', () => {
      mockFs.existsSync.mockReturnValue(true);
      
      const config = {
        API_BASE_URL: 'https://app.nimroboai.com/api',
        NET_API_BASE_URL: 'http://localhost:3000',
        API_KEY: 'new-key',
        defaultProject: null,
        context: {
          orgId: null,
          postId: null,
          channelId: null,
          userId: null,
        },
      };
      
      saveConfig(config);
      
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      const [, content] = mockFs.writeFileSync.mock.calls[0];
      expect(JSON.parse(content as string)).toEqual(config);
    });
  });

  describe('API Key management', () => {
    it('getApiKey should return stored API key', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ API_KEY: 'my-api-key' }));
      
      expect(getApiKey()).toBe('my-api-key');
    });

    it('setApiKey should save API key', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({}));
      
      setApiKey('new-api-key');
      
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('clearApiKey should remove API key', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ API_KEY: 'to-remove' }));
      
      clearApiKey();
      
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      const [, content] = mockFs.writeFileSync.mock.calls[0];
      expect(JSON.parse(content as string).API_KEY).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when API key exists', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ API_KEY: 'valid-key' }));
      
      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when no API key', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('resolveProjectId', () => {
    it('should return null for undefined input', () => {
      expect(resolveProjectId(undefined)).toBeNull();
    });

    it('should return stored default for "default"', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ defaultProject: 'default-proj' }));
      
      expect(resolveProjectId('default')).toBe('default-proj');
    });

    it('should return the provided ID as-is', () => {
      expect(resolveProjectId('proj-123')).toBe('proj-123');
    });
  });

  describe('Context management', () => {
    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        context: {
          orgId: 'org-123',
          postId: null,
          channelId: null,
          userId: null,
        },
      }));
    });

    it('getContext should return context value', () => {
      expect(getContext('org')).toBe('org-123');
      expect(getContext('post')).toBeNull();
    });

    it('setContext should store context', () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ context: {} }));
      
      setContext('post', 'post-456');
      
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('clearContext should remove specific context', () => {
      clearContext('org');
      
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      const [, content] = mockFs.writeFileSync.mock.calls[0];
      expect(JSON.parse(content as string).context.orgId).toBeNull();
    });

    it('clearAllContext should remove all context', () => {
      clearAllContext();
      
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      const [, content] = mockFs.writeFileSync.mock.calls[0];
      const context = JSON.parse(content as string).context;
      expect(context.orgId).toBeNull();
      expect(context.postId).toBeNull();
      expect(context.channelId).toBeNull();
      expect(context.userId).toBeNull();
    });

    it('getAllContext should return full context object', () => {
      const context = getAllContext();
      
      expect(context.orgId).toBe('org-123');
      expect(context.postId).toBeNull();
    });
  });

  describe('resolveId', () => {
    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(true);
    });

    it('should return null for undefined input', () => {
      expect(resolveId(undefined, 'org')).toBeNull();
    });

    it('should resolve "current" to stored context', () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        context: { orgId: 'current-org-id', postId: null, channelId: null, userId: null },
      }));
      
      expect(resolveId('current', 'org')).toBe('current-org-id');
    });

    it('should throw error for "current" when no context set', () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        context: { orgId: null, postId: null, channelId: null, userId: null },
      }));
      
      expect(() => resolveId('current', 'org')).toThrow(/No org context set/);
    });

    it('should return provided ID directly', () => {
      expect(resolveId('specific-id', 'org')).toBe('specific-id');
    });
  });

  describe('requireId', () => {
    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        context: { orgId: 'ctx-org', postId: null, channelId: null, userId: null },
      }));
    });

    it('should return resolved ID', () => {
      expect(requireId('my-id', 'org', 'orgId')).toBe('my-id');
    });

    it('should resolve "current" to context', () => {
      expect(requireId('current', 'org', 'orgId')).toBe('ctx-org');
    });

    it('should throw error when no ID provided', () => {
      expect(() => requireId(undefined, 'org', 'orgId')).toThrow(/orgId is required/);
    });
  });
});
