/**
 * Unit tests for status command
 */

import { Command } from 'commander';

// Mock chalk
jest.mock('chalk', () => ({
  green: jest.fn((str: string) => `[green]${str}[/green]`),
  red: jest.fn((str: string) => `[red]${str}[/red]`),
  yellow: jest.fn((str: string) => `[yellow]${str}[/yellow]`),
  gray: jest.fn((str: string) => `[gray]${str}[/gray]`),
}));

// Mock dependencies
jest.mock('../../src/utils/config', () => ({
  getApiKey: jest.fn(),
  getDefaultProject: jest.fn(),
  getApiBaseUrl: jest.fn(),
}));

jest.mock('../../src/api/user', () => ({
  getUserProfile: jest.fn(),
}));

jest.mock('../../src/api/projects', () => ({
  getProject: jest.fn(),
}));

jest.mock('../../src/utils/output', () => ({
  output: jest.fn(),
  isJsonOutput: jest.fn().mockReturnValue(false),
}));

jest.mock('../../src/utils/errors', () => ({
  handleError: jest.fn(),
}));

import { registerStatusCommand } from '../../src/commands/status';
import { getApiKey, getDefaultProject, getApiBaseUrl } from '../../src/utils/config';
import { getUserProfile } from '../../src/api/user';
import { getProject } from '../../src/api/projects';
import { output, isJsonOutput } from '../../src/utils/output';
import { handleError } from '../../src/utils/errors';

const mockGetApiKey = getApiKey as jest.MockedFunction<typeof getApiKey>;
const mockGetDefaultProject = getDefaultProject as jest.MockedFunction<typeof getDefaultProject>;
const mockGetApiBaseUrl = getApiBaseUrl as jest.MockedFunction<typeof getApiBaseUrl>;
const mockGetUserProfile = getUserProfile as jest.MockedFunction<typeof getUserProfile>;
const mockGetProject = getProject as jest.MockedFunction<typeof getProject>;
const mockOutput = output as jest.MockedFunction<typeof output>;
const mockIsJsonOutput = isJsonOutput as jest.MockedFunction<typeof isJsonOutput>;
const mockHandleError = handleError as jest.MockedFunction<typeof handleError>;

describe('status command', () => {
  let program: Command;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    program = new Command();
    registerStatusCommand(program);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockGetApiBaseUrl.mockReturnValue('https://app.nimroboai.com/api');
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('registerStatusCommand', () => {
    it('should register status command with correct name', () => {
      const statusCmd = program.commands.find((cmd) => cmd.name() === 'status');
      expect(statusCmd).toBeDefined();
    });

    it('should have correct description', () => {
      const statusCmd = program.commands.find((cmd) => cmd.name() === 'status');
      expect(statusCmd?.description()).toBe('Display current authentication status and configuration');
    });
  });

  describe('unauthenticated status', () => {
    beforeEach(() => {
      mockGetApiKey.mockReturnValue(null);
    });

    it('should show not authenticated in text mode', async () => {
      mockIsJsonOutput.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'status']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[red]'), 'Not authenticated');
    });

    it('should show API URL when not authenticated', async () => {
      mockIsJsonOutput.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'status']);

      expect(consoleLogSpy).toHaveBeenCalledWith('  API: https://app.nimroboai.com/api');
    });

    it('should show login hint when not authenticated', async () => {
      mockIsJsonOutput.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'status']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Run 'nimrobo login' to authenticate"));
    });

    it('should output JSON when not authenticated and json flag set', async () => {
      mockIsJsonOutput.mockReturnValue(true);

      await program.parseAsync(['node', 'test', 'status']);

      expect(mockOutput).toHaveBeenCalledWith({
        authenticated: false,
        apiUrl: 'https://app.nimroboai.com/api',
      });
    });
  });

  describe('authenticated status', () => {
    const createMockUser = (overrides: Partial<{ id: string; email: string; name: string }> = {}) => ({
      id: 'usr_123',
      email: 'test@example.com',
      name: 'Test User',
      profileCompleted: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-15T00:00:00Z',
      ...overrides,
    });

    const mockUser = createMockUser();

    beforeEach(() => {
      mockGetApiKey.mockReturnValue('api_test_key');
      mockGetDefaultProject.mockReturnValue(null);
      mockGetUserProfile.mockResolvedValue(mockUser);
    });

    it('should fetch user profile when authenticated', async () => {
      await program.parseAsync(['node', 'test', 'status']);

      expect(mockGetUserProfile).toHaveBeenCalled();
    });

    it('should show authenticated status with user name and email in text mode', async () => {
      mockIsJsonOutput.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'status']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[green]'),
        'Authenticated as Test User (test@example.com)'
      );
    });

    it('should show email when name is not provided', async () => {
      mockGetUserProfile.mockResolvedValue(createMockUser({ name: undefined }));
      mockIsJsonOutput.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'status']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[green]'),
        'Authenticated as test@example.com (test@example.com)'
      );
    });

    it('should show ID when name and email are not provided', async () => {
      mockGetUserProfile.mockResolvedValue(createMockUser({ name: undefined, email: undefined }));
      mockIsJsonOutput.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'status']);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[green]'),
        'Authenticated as usr_123'
      );
    });

    it('should show API URL when authenticated', async () => {
      mockIsJsonOutput.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'status']);

      expect(consoleLogSpy).toHaveBeenCalledWith('  API: https://app.nimroboai.com/api');
    });

    it('should output JSON when authenticated and json flag set', async () => {
      mockIsJsonOutput.mockReturnValue(true);

      await program.parseAsync(['node', 'test', 'status']);

      expect(mockOutput).toHaveBeenCalledWith({
        authenticated: true,
        user: mockUser,
        defaultProject: null,
        apiUrl: 'https://app.nimroboai.com/api',
      });
    });
  });

  describe('with default project', () => {
    const createMockUser = () => ({
      id: 'usr_123',
      email: 'test@example.com',
      name: 'Test User',
      profileCompleted: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-15T00:00:00Z',
    });

    const createMockProject = () => ({
      id: 'proj_123',
      name: 'My Project',
      description: 'Test project description',
      prompt: 'Test prompt',
      landingPageTitle: 'Welcome',
      landingPageInfo: 'Info text',
      timeLimitMinutes: 30,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    });

    const mockUser = createMockUser();
    const mockProject = createMockProject();

    beforeEach(() => {
      mockGetApiKey.mockReturnValue('api_test_key');
      mockGetDefaultProject.mockReturnValue('proj_123');
      mockGetUserProfile.mockResolvedValue(mockUser);
      mockGetProject.mockResolvedValue(mockProject);
    });

    it('should fetch default project details', async () => {
      await program.parseAsync(['node', 'test', 'status']);

      expect(mockGetProject).toHaveBeenCalledWith('proj_123');
    });

    it('should show default project in text mode', async () => {
      mockIsJsonOutput.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'status']);

      expect(consoleLogSpy).toHaveBeenCalledWith('  Default project: My Project (proj_123)');
    });

    it('should include project in JSON output', async () => {
      mockIsJsonOutput.mockReturnValue(true);

      await program.parseAsync(['node', 'test', 'status']);

      expect(mockOutput).toHaveBeenCalledWith({
        authenticated: true,
        user: mockUser,
        defaultProject: { id: 'proj_123', name: 'My Project' },
        apiUrl: 'https://app.nimroboai.com/api',
      });
    });

    it('should handle deleted project gracefully', async () => {
      mockGetProject.mockRejectedValue(new Error('Project not found'));
      mockIsJsonOutput.mockReturnValue(false);

      await program.parseAsync(['node', 'test', 'status']);

      // When project is deleted, it shows "(not found)" with the project ID
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Default project:.*proj_123/)
      );
    });

    it('should show null project in JSON when project is deleted', async () => {
      mockGetProject.mockRejectedValue(new Error('Project not found'));
      mockIsJsonOutput.mockReturnValue(true);

      await program.parseAsync(['node', 'test', 'status']);

      expect(mockOutput).toHaveBeenCalledWith({
        authenticated: true,
        user: mockUser,
        defaultProject: null,
        apiUrl: 'https://app.nimroboai.com/api',
      });
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetApiKey.mockReturnValue('api_test_key');
      mockGetDefaultProject.mockReturnValue(null);
    });

    it('should handle user profile fetch errors', async () => {
      const mockError = new Error('Network error');
      mockGetUserProfile.mockRejectedValue(mockError);

      await program.parseAsync(['node', 'test', 'status']);

      expect(mockHandleError).toHaveBeenCalledWith(mockError);
    });
  });
});
