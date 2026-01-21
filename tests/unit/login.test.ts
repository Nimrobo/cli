/**
 * Unit tests for login command
 */

import { Command } from 'commander';

// Mock dependencies
jest.mock('../../src/utils/prompts', () => ({
  promptApiKey: jest.fn(),
}));

jest.mock('../../src/utils/config', () => ({
  setApiKey: jest.fn(),
}));

jest.mock('../../src/api/client', () => ({
  resetApiClient: jest.fn(),
}));

jest.mock('../../src/api/user', () => ({
  validateApiKey: jest.fn(),
}));

jest.mock('../../src/utils/output', () => ({
  success: jest.fn(),
  output: jest.fn(),
  isJsonOutput: jest.fn().mockReturnValue(false),
}));

jest.mock('../../src/utils/errors', () => ({
  handleError: jest.fn(),
}));

import { registerLoginCommand } from '../../src/commands/login';
import { promptApiKey } from '../../src/utils/prompts';
import { setApiKey } from '../../src/utils/config';
import { resetApiClient } from '../../src/api/client';
import { validateApiKey } from '../../src/api/user';
import { success, output, isJsonOutput } from '../../src/utils/output';
import { handleError } from '../../src/utils/errors';

const mockPromptApiKey = promptApiKey as jest.MockedFunction<typeof promptApiKey>;
const mockSetApiKey = setApiKey as jest.MockedFunction<typeof setApiKey>;
const mockResetApiClient = resetApiClient as jest.MockedFunction<typeof resetApiClient>;
const mockValidateApiKey = validateApiKey as jest.MockedFunction<typeof validateApiKey>;
const mockSuccess = success as jest.MockedFunction<typeof success>;
const mockOutput = output as jest.MockedFunction<typeof output>;
const mockIsJsonOutput = isJsonOutput as jest.MockedFunction<typeof isJsonOutput>;
const mockHandleError = handleError as jest.MockedFunction<typeof handleError>;

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
      expect(loginCmd?.description()).toBe('Authenticate with your Nimrobo API key');
    });
  });

  describe('login action', () => {
    const createMockUser = (overrides: Partial<{ id: string; email: string; name: string }> = {}) => ({
      id: 'usr_123',
      email: 'test@example.com',
      name: 'Test User',
      profileCompleted: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-15T00:00:00Z',
      ...overrides,
    });

    it('should prompt for API key and validate it', async () => {
      const mockUser = createMockUser();
      mockPromptApiKey.mockResolvedValue('api_test_key');
      mockValidateApiKey.mockResolvedValue(mockUser);

      await program.parseAsync(['node', 'test', 'login']);

      expect(mockPromptApiKey).toHaveBeenCalled();
      expect(mockValidateApiKey).toHaveBeenCalledWith('api_test_key');
    });

    it('should save API key after successful validation', async () => {
      const mockUser = createMockUser();
      mockPromptApiKey.mockResolvedValue('api_test_key');
      mockValidateApiKey.mockResolvedValue(mockUser);

      await program.parseAsync(['node', 'test', 'login']);

      expect(mockSetApiKey).toHaveBeenCalledWith('api_test_key');
      expect(mockResetApiClient).toHaveBeenCalled();
    });

    it('should show success message with user name and email', async () => {
      const mockUser = createMockUser();
      mockPromptApiKey.mockResolvedValue('api_test_key');
      mockValidateApiKey.mockResolvedValue(mockUser);
      mockIsJsonOutput.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'login']);

      expect(mockSuccess).toHaveBeenCalledWith('Logged in as Test User (test@example.com)');
    });

    it('should show success message with email when name is not provided', async () => {
      const mockUser = createMockUser({ name: undefined });
      mockPromptApiKey.mockResolvedValue('api_test_key');
      mockValidateApiKey.mockResolvedValue(mockUser);
      mockIsJsonOutput.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'login']);

      expect(mockSuccess).toHaveBeenCalledWith('Logged in as test@example.com (test@example.com)');
    });

    it('should show success message with ID when name and email are not provided', async () => {
      const mockUser = createMockUser({ name: undefined, email: undefined });
      mockPromptApiKey.mockResolvedValue('api_test_key');
      mockValidateApiKey.mockResolvedValue(mockUser);
      mockIsJsonOutput.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'login']);

      expect(mockSuccess).toHaveBeenCalledWith('Logged in as usr_123');
    });

    it('should output JSON when json flag is set', async () => {
      const mockUser = createMockUser();
      mockPromptApiKey.mockResolvedValue('api_test_key');
      mockValidateApiKey.mockResolvedValue(mockUser);
      mockIsJsonOutput.mockReturnValue(true);

      await program.parseAsync(['node', 'test', 'login']);

      expect(mockOutput).toHaveBeenCalledWith({ success: true, user: mockUser });
      expect(mockSuccess).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const mockError = new Error('Invalid API key');
      mockPromptApiKey.mockResolvedValue('invalid_key');
      mockValidateApiKey.mockRejectedValue(mockError);

      await program.parseAsync(['node', 'test', 'login']);

      expect(mockHandleError).toHaveBeenCalledWith(mockError);
      expect(mockSetApiKey).not.toHaveBeenCalled();
    });

    it('should handle prompt errors', async () => {
      const mockError = new Error('Prompt cancelled');
      mockPromptApiKey.mockRejectedValue(mockError);

      await program.parseAsync(['node', 'test', 'login']);

      expect(mockHandleError).toHaveBeenCalledWith(mockError);
      expect(mockValidateApiKey).not.toHaveBeenCalled();
    });
  });
});
