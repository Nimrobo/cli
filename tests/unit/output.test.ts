/**
 * Unit tests for output.ts
 */

import {
  setJsonOutput,
  isJsonOutput,
  success,
  error,
  info,
  warn,
  printJson,
  printTable,
  printKeyValue,
  output,
} from '../../src/utils/output';

describe('output.ts', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    // Reset JSON output mode
    setJsonOutput(false);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('JSON output mode', () => {
    it('isJsonOutput should return false by default', () => {
      expect(isJsonOutput()).toBe(false);
    });

    it('setJsonOutput should enable JSON mode', () => {
      setJsonOutput(true);
      expect(isJsonOutput()).toBe(true);
    });

    it('setJsonOutput should disable JSON mode', () => {
      setJsonOutput(true);
      setJsonOutput(false);
      expect(isJsonOutput()).toBe(false);
    });
  });

  describe('success', () => {
    it('should print message with checkmark in non-JSON mode', () => {
      success('Operation completed');
      
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0].join(' ');
      expect(output).toContain('Operation completed');
    });

    it('should not print in JSON mode', () => {
      setJsonOutput(true);
      success('Operation completed');
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should print error message in non-JSON mode', () => {
      error('Something went wrong');
      
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0].join(' ');
      expect(output).toContain('Something went wrong');
    });

    it('should not print in JSON mode', () => {
      setJsonOutput(true);
      error('Something went wrong');
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should print info message in non-JSON mode', () => {
      info('FYI message');
      
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0].join(' ');
      expect(output).toContain('FYI message');
    });

    it('should not print in JSON mode', () => {
      setJsonOutput(true);
      info('FYI message');
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should print warning in non-JSON mode', () => {
      warn('Be careful');
      
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0].join(' ');
      expect(output).toContain('Be careful');
    });

    it('should not print in JSON mode', () => {
      setJsonOutput(true);
      warn('Be careful');
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('printJson', () => {
    it('should output formatted JSON', () => {
      const data = { key: 'value', number: 42 };
      printJson(data);
      
      expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    });

    it('should handle nested objects', () => {
      const data = { nested: { deep: { value: true } } };
      printJson(data);
      
      const output = consoleSpy.mock.calls[0][0];
      expect(JSON.parse(output)).toEqual(data);
    });
  });

  describe('printTable', () => {
    it('should print formatted table in non-JSON mode', () => {
      const headers = ['ID', 'Name', 'Status'];
      const rows = [
        ['1', 'Alice', 'active'],
        ['2', 'Bob', 'pending'],
      ];
      
      printTable(headers, rows);
      
      // Should have header, separator, and data rows
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should not print in JSON mode', () => {
      setJsonOutput(true);
      
      printTable(['Header'], [['row']]);
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should handle empty cells', () => {
      const headers = ['ID', 'Name'];
      const rows = [['1', ''], ['2', 'Bob']];
      
      printTable(headers, rows);
      
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('printKeyValue', () => {
    it('should print key-value pairs in non-JSON mode', () => {
      const data = {
        'Name': 'Test',
        'Status': 'active',
      };
      
      printKeyValue(data);
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle null/undefined values', () => {
      const data = {
        'Present': 'value',
        'Missing': null,
        'AlsoMissing': undefined,
      };
      
      printKeyValue(data);
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle nested objects', () => {
      const data = {
        'Simple': 'value',
        'Nested': { inner: 'value' },
      };
      
      printKeyValue(data);
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle arrays', () => {
      const data = {
        'Items': ['a', 'b', 'c'],
      };
      
      printKeyValue(data);
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should not print in JSON mode', () => {
      setJsonOutput(true);
      
      printKeyValue({ key: 'value' });
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('output', () => {
    it('should print JSON when in JSON mode', () => {
      setJsonOutput(true);
      
      const data = { result: 'success' };
      output(data);
      
      expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    });

    it('should not print when not in JSON mode', () => {
      setJsonOutput(false);
      
      output({ data: 'test' });
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
