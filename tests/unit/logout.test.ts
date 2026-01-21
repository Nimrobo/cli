/**
 * Unit tests for logout command
 */

import { Command } from 'commander';

// Mock dependencies
jest.mock('../../src/utils/config', () => ({
  clearApiKey: jest.fn(),
}));

jest.mock('../../src/api/client', () => ({
  resetApiClient: jest.fn(),
}));

jest.mock('../../src/utils/output', () => ({
  success: jest.fn(),
  output: jest.fn(),
  isJsonOutput: jest.fn().mockReturnValue(false),
}));

import { registerLogoutCommand } from '../../src/commands/logout';
import { clearApiKey } from '../../src/utils/config';
import { resetApiClient } from '../../src/api/client';
import { success, output, isJsonOutput } from '../../src/utils/output';

const mockClearApiKey = clearApiKey as jest.MockedFunction<typeof clearApiKey>;
const mockResetApiClient = resetApiClient as jest.MockedFunction<typeof resetApiClient>;
const mockSuccess = success as jest.MockedFunction<typeof success>;
const mockOutput = output as jest.MockedFunction<typeof output>;
const mockIsJsonOutput = isJsonOutput as jest.MockedFunction<typeof isJsonOutput>;

describe('logout command', () => {
  let program: Command;

  beforeEach(() => {
    jest.clearAllMocks();
    program = new Command();
    registerLogoutCommand(program);
  });

  describe('registerLogoutCommand', () => {
    it('should register logout command with correct name', () => {
      const logoutCmd = program.commands.find((cmd) => cmd.name() === 'logout');
      expect(logoutCmd).toBeDefined();
    });

    it('should have correct description', () => {
      const logoutCmd = program.commands.find((cmd) => cmd.name() === 'logout');
      expect(logoutCmd?.description()).toBe('Remove stored credentials');
    });
  });

  describe('logout action', () => {
    it('should clear API key', async () => {
      await program.parseAsync(['node', 'test', 'logout']);

      expect(mockClearApiKey).toHaveBeenCalled();
    });

    it('should reset API client', async () => {
      await program.parseAsync(['node', 'test', 'logout']);

      expect(mockResetApiClient).toHaveBeenCalled();
    });

    it('should show success message in text mode', async () => {
      mockIsJsonOutput.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'logout']);

      expect(mockSuccess).toHaveBeenCalledWith('Logged out successfully');
      expect(mockOutput).not.toHaveBeenCalled();
    });

    it('should output JSON when json flag is set', async () => {
      mockIsJsonOutput.mockReturnValue(true);

      await program.parseAsync(['node', 'test', 'logout']);

      expect(mockOutput).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
      expect(mockSuccess).not.toHaveBeenCalled();
    });

    it('should clear key and reset client in correct order', async () => {
      const callOrder: string[] = [];
      mockClearApiKey.mockImplementation(() => {
        callOrder.push('clearApiKey');
      });
      mockResetApiClient.mockImplementation(() => {
        callOrder.push('resetApiClient');
      });

      await program.parseAsync(['node', 'test', 'logout']);

      expect(callOrder).toEqual(['clearApiKey', 'resetApiClient']);
    });
  });
});
