/**
 * Unit tests for login command
 */

import { Command } from 'commander';

// Mock axios before importing the module
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

// Mock dependencies
jest.mock('../../src/utils/prompts', () => ({
  promptApiKey: jest.fn(),
}));

jest.mock('../../src/utils/config', () => ({
  setApiKey: jest.fn(),
  getApiBaseUrl: jest.fn().mockReturnValue('https://app.nimroboai.com/api'),
}));

jest.mock('../../src/api/client', () => ({
  resetApiClient: jest.fn(),
}));

jest.mock('../../src/api/user', () => ({
  validateApiKey: jest.fn(),
}));

jest.mock('../../src/utils/output', () => ({
  success: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  output: jest.fn(),
  isJsonOutput: jest.fn().mockReturnValue(false),
}));

jest.mock('../../src/utils/errors', () => ({
  handleError: jest.fn(),
}));

// Mock open for browser-based login
jest.mock('open', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

import axios from 'axios';
import { registerLoginCommand } from '../../src/commands/login';
import { promptApiKey } from '../../src/utils/prompts';
import { setApiKey } from '../../src/utils/config';
import { resetApiClient } from '../../src/api/client';
import { validateApiKey } from '../../src/api/user';
import { success, output, isJsonOutput, info } from '../../src/utils/output';
import { handleError } from '../../src/utils/errors';

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockPromptApiKey = promptApiKey as jest.MockedFunction<typeof promptApiKey>;
const mockSetApiKey = setApiKey as jest.MockedFunction<typeof setApiKey>;
const mockResetApiClient = resetApiClient as jest.MockedFunction<typeof resetApiClient>;
const mockValidateApiKey = validateApiKey as jest.MockedFunction<typeof validateApiKey>;
const mockSuccess = success as jest.MockedFunction<typeof success>;
const mockOutput = output as jest.MockedFunction<typeof output>;
const mockIsJsonOutput = isJsonOutput as jest.MockedFunction<typeof isJsonOutput>;
const mockHandleError = handleError as jest.MockedFunction<typeof handleError>;
const mockInfo = info as jest.MockedFunction<typeof info>;

describe('login command', () => {
  let program: Command;

  beforeEach(() => {
    jest.clearAllMocks();
    program = new Command();
    registerLoginCommand(program);
  });

  describe('registerLoginCommand', () => {
    it('should register login command with correct name', () => {
      const loginCmd = program.commands.find((cmd) => cmd.name() === 'login');
      expect(loginCmd).toBeDefined();
    });

    it('should have correct description', () => {
      const loginCmd = program.commands.find((cmd) => cmd.name() === 'login');
      expect(loginCmd?.description()).toBe('Authenticate with Nimrobo');
    });

    it('should have --api-key option', () => {
      const loginCmd = program.commands.find((cmd) => cmd.name() === 'login');
      const apiKeyOption = loginCmd?.options.find((opt) => opt.long === '--api-key');
      expect(apiKeyOption).toBeDefined();
    });
  });

  describe('manual API key login (--api-key flag)', () => {
    const createMockUser = (overrides: Partial<{ id: string; email: string; name: string }> = {}) => ({
      id: 'usr_123',
      email: 'test@example.com',
      name: 'Test User',
      profileCompleted: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-15T00:00:00Z',
      ...overrides,
    });

    it('should prompt for API key when --api-key flag is used', async () => {
      const mockUser = createMockUser();
      mockPromptApiKey.mockResolvedValue('api_test_key');
      mockValidateApiKey.mockResolvedValue(mockUser);

      await program.parseAsync(['node', 'test', 'login', '--api-key']);

      expect(mockPromptApiKey).toHaveBeenCalled();
      expect(mockValidateApiKey).toHaveBeenCalledWith('api_test_key');
    });

    it('should save API key after successful validation', async () => {
      const mockUser = createMockUser();
      mockPromptApiKey.mockResolvedValue('api_test_key');
      mockValidateApiKey.mockResolvedValue(mockUser);

      await program.parseAsync(['node', 'test', 'login', '--api-key']);

      expect(mockSetApiKey).toHaveBeenCalledWith('api_test_key');
      expect(mockResetApiClient).toHaveBeenCalled();
    });

    it('should show success message with user name and email', async () => {
      const mockUser = createMockUser();
      mockPromptApiKey.mockResolvedValue('api_test_key');
      mockValidateApiKey.mockResolvedValue(mockUser);
      mockIsJsonOutput.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'login', '--api-key']);

      expect(mockSuccess).toHaveBeenCalledWith('Logged in as Test User (test@example.com)');
    });

    it('should show success message with email when name is not provided', async () => {
      const mockUser = createMockUser({ name: undefined });
      mockPromptApiKey.mockResolvedValue('api_test_key');
      mockValidateApiKey.mockResolvedValue(mockUser);
      mockIsJsonOutput.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'login', '--api-key']);

      expect(mockSuccess).toHaveBeenCalledWith('Logged in as test@example.com (test@example.com)');
    });

    it('should show success message with ID when name and email are not provided', async () => {
      const mockUser = createMockUser({ name: undefined, email: undefined });
      mockPromptApiKey.mockResolvedValue('api_test_key');
      mockValidateApiKey.mockResolvedValue(mockUser);
      mockIsJsonOutput.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'login', '--api-key']);

      expect(mockSuccess).toHaveBeenCalledWith('Logged in as usr_123');
    });

    it('should output JSON when json flag is set', async () => {
      const mockUser = createMockUser();
      mockPromptApiKey.mockResolvedValue('api_test_key');
      mockValidateApiKey.mockResolvedValue(mockUser);
      mockIsJsonOutput.mockReturnValue(true);

      await program.parseAsync(['node', 'test', 'login', '--api-key']);

      expect(mockOutput).toHaveBeenCalledWith({ success: true, user: mockUser });
      expect(mockSuccess).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const mockError = new Error('Invalid API key');
      mockPromptApiKey.mockResolvedValue('invalid_key');
      mockValidateApiKey.mockRejectedValue(mockError);

      await program.parseAsync(['node', 'test', 'login', '--api-key']);

      expect(mockHandleError).toHaveBeenCalledWith(mockError);
      expect(mockSetApiKey).not.toHaveBeenCalled();
    });

    it('should handle prompt errors', async () => {
      const mockError = new Error('Prompt cancelled');
      mockPromptApiKey.mockRejectedValue(mockError);

      await program.parseAsync(['node', 'test', 'login', '--api-key']);

      expect(mockHandleError).toHaveBeenCalledWith(mockError);
      expect(mockValidateApiKey).not.toHaveBeenCalled();
    });
  });

  describe('device authorization login (default)', () => {
    const createMockUser = (overrides: Partial<{ id: string; email: string; name: string }> = {}) => ({
      id: 'usr_123',
      email: 'test@example.com',
      name: 'Test User',
      profileCompleted: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-15T00:00:00Z',
      ...overrides,
    });

    const mockDeviceCodeResponse = {
      data: {
        device_code: 'test_device_code_123',
        user_code: 'ABCD-EFGH',
        verification_uri: 'https://app.nimroboai.com/cli/authorize',
        verification_uri_complete: 'https://app.nimroboai.com/cli/authorize?code=ABCD-EFGH',
        expires_in: 600,
        interval: 5,
      },
    };

    it('should initiate device flow when no --api-key flag', async () => {
      const mockUser = createMockUser();
      const mockToken = 'api_test_token_from_device';

      // Mock device code request
      mockAxios.post.mockResolvedValueOnce(mockDeviceCodeResponse);
      
      // Mock token polling - return authorized immediately
      mockAxios.post.mockResolvedValueOnce({
        data: { status: 'authorized', api_token: mockToken },
      });

      // Mock validate API key
      mockValidateApiKey.mockResolvedValue(mockUser);

      await program.parseAsync(['node', 'test', 'login']);

      // Should have called device code endpoint
      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/device/code')
      );

      // Should show info message about browser login
      expect(mockInfo).toHaveBeenCalledWith('Starting browser-based login...');
    });

    it('should handle device code request failure', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await program.parseAsync(['node', 'test', 'login']);

      expect(mockHandleError).toHaveBeenCalled();
    });

    it('should handle authorization denied', async () => {
      // Mock device code request
      mockAxios.post.mockResolvedValueOnce(mockDeviceCodeResponse);
      
      // Mock token polling - return denied
      mockAxios.post.mockResolvedValueOnce({
        data: { status: 'denied', error: 'access_denied' },
      });

      await program.parseAsync(['node', 'test', 'login']);

      expect(mockHandleError).toHaveBeenCalled();
    });

    it('should handle authorization expired', async () => {
      // Mock device code request
      mockAxios.post.mockResolvedValueOnce(mockDeviceCodeResponse);
      
      // Mock token polling - return expired
      mockAxios.post.mockResolvedValueOnce({
        data: { status: 'expired', error: 'expired_token' },
      });

      await program.parseAsync(['node', 'test', 'login']);

      expect(mockHandleError).toHaveBeenCalled();
    });

    it('should save token after successful device authorization', async () => {
      const mockUser = createMockUser();
      const mockToken = 'api_test_token_from_device';

      // Mock device code request
      mockAxios.post.mockResolvedValueOnce(mockDeviceCodeResponse);
      
      // Mock token polling - return authorized immediately
      mockAxios.post.mockResolvedValueOnce({
        data: { status: 'authorized', api_token: mockToken },
      });

      // Mock validate API key
      mockValidateApiKey.mockResolvedValue(mockUser);

      await program.parseAsync(['node', 'test', 'login']);

      expect(mockSetApiKey).toHaveBeenCalledWith(mockToken);
      expect(mockResetApiClient).toHaveBeenCalled();
    });
  });
});
