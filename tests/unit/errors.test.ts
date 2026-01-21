/**
 * Unit tests for errors.ts
 */

import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';

// Mock output module
jest.mock('../../src/utils/output', () => ({
  isJsonOutput: jest.fn(),
  printJson: jest.fn(),
}));

import { handleError, requireAuth } from '../../src/utils/errors';
import { isJsonOutput, printJson } from '../../src/utils/output';

const mockIsJsonOutput = isJsonOutput as jest.MockedFunction<typeof isJsonOutput>;
const mockPrintJson = printJson as jest.MockedFunction<typeof printJson>;

describe('errors.ts', () => {
  let consoleSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process exited with code ${code}`);
    });
    mockIsJsonOutput.mockReturnValue(false);
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('handleError', () => {
    it('should handle generic Error', () => {
      const error = new Error('Something went wrong');
      
      expect(() => handleError(error)).toThrow('Process exited with code 1');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle AxiosError with response', () => {
      const axiosError = new AxiosError(
        'Request failed',
        '404',
        {} as InternalAxiosRequestConfig,
        {},
        {
          data: { error: 'Resource not found' },
          status: 404,
          statusText: 'Not Found',
          headers: new AxiosHeaders(),
          config: {} as InternalAxiosRequestConfig,
        }
      );
      
      expect(() => handleError(axiosError)).toThrow('Process exited with code 1');
    });

    it('should handle unknown error type', () => {
      expect(() => handleError('string error')).toThrow('Process exited with code 1');
    });

    it('should output JSON in JSON mode', () => {
      mockIsJsonOutput.mockReturnValue(true);
      const error = new Error('Test error');
      
      expect(() => handleError(error)).toThrow('Process exited with code 1');
      expect(mockPrintJson).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Test error',
      }));
    });

    it('should show suggestions for "not found" errors', () => {
      const error = new Error('Resource not found');
      
      expect(() => handleError(error)).toThrow('Process exited with code 1');
      
      // Check that suggestions were printed
      const allOutput = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(allOutput).toContain('Suggestions');
    });

    it('should show suggestions for 401 errors', () => {
      const error = new Error('401 Unauthorized');
      
      expect(() => handleError(error)).toThrow('Process exited with code 1');
      
      const allOutput = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(allOutput).toContain('Suggestions');
    });

    it('should show suggestions for 403 errors', () => {
      const error = new Error('403 Forbidden');
      
      expect(() => handleError(error)).toThrow('Process exited with code 1');
      
      const allOutput = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(allOutput).toContain('Suggestions');
    });

    it('should show suggestions for network errors', () => {
      const error = new Error('ECONNREFUSED');
      
      expect(() => handleError(error)).toThrow('Process exited with code 1');
      
      const allOutput = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(allOutput).toContain('Suggestions');
    });

    it('should show suggestions for invalid expiry', () => {
      const error = new Error('invalid expiry value');
      
      expect(() => handleError(error)).toThrow('Process exited with code 1');
      
      const allOutput = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(allOutput).toContain('1_day');
    });
  });

  describe('requireAuth', () => {
    it('should not throw when API key exists', () => {
      expect(() => requireAuth('valid-key')).not.toThrow();
    });

    it('should exit when API key is null', () => {
      expect(() => requireAuth(null)).toThrow('Process exited with code 1');
    });

    it('should output JSON error in JSON mode when not authenticated', () => {
      mockIsJsonOutput.mockReturnValue(true);
      
      expect(() => requireAuth(null)).toThrow('Process exited with code 1');
      expect(mockPrintJson).toHaveBeenCalledWith({ error: 'Not authenticated' });
    });

    it('should show login suggestion when not authenticated', () => {
      mockIsJsonOutput.mockReturnValue(false);
      
      expect(() => requireAuth(null)).toThrow('Process exited with code 1');
      
      const allOutput = consoleSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(allOutput).toContain('nimrobo login');
    });
  });
});
