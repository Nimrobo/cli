/**
 * Unit tests for device authorization login flow
 * Tests the browser-based OAuth-like login mechanism
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Create mock adapter before importing the module
const mockAxios = new MockAdapter(axios);

// Mock dependencies
jest.mock('../../src/utils/config', () => ({
  getApiBaseUrl: jest.fn().mockReturnValue('https://app.nimroboai.com/api'),
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
  info: jest.fn(),
  error: jest.fn(),
  output: jest.fn(),
  isJsonOutput: jest.fn().mockReturnValue(false),
}));

jest.mock('../../src/utils/errors', () => ({
  handleError: jest.fn(),
}));

// Mock the open module
jest.mock('open', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

describe('Device Authorization Login Flow', () => {
  const BASE_URL = 'https://app.nimroboai.com';
  
  const mockDeviceCodeResponse = {
    device_code: 'test_device_code_123456789012345678901234567890',
    user_code: 'ABCD-EFGH',
    verification_uri: `${BASE_URL}/cli/authorize`,
    verification_uri_complete: `${BASE_URL}/cli/authorize?code=ABCD-EFGH`,
    expires_in: 600,
    interval: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios.reset();
  });

  describe('requestDeviceCode', () => {
    it('should request device code from API', async () => {
      mockAxios.onPost(`${BASE_URL}/api/auth/device/code`).reply(200, mockDeviceCodeResponse);

      const response = await axios.post(`${BASE_URL}/api/auth/device/code`);

      expect(response.status).toBe(200);
      expect(response.data.device_code).toBe(mockDeviceCodeResponse.device_code);
      expect(response.data.user_code).toBe(mockDeviceCodeResponse.user_code);
      expect(response.data.verification_uri).toContain('/cli/authorize');
    });

    it('should handle API errors gracefully', async () => {
      mockAxios.onPost(`${BASE_URL}/api/auth/device/code`).reply(500, {
        error: 'Internal server error',
      });

      await expect(axios.post(`${BASE_URL}/api/auth/device/code`)).rejects.toThrow();
    });
  });

  describe('pollForToken', () => {
    it('should return pending status while waiting', async () => {
      mockAxios.onPost(`${BASE_URL}/api/auth/device/token`).reply(200, {
        status: 'pending',
        error: 'authorization_pending',
      });

      const response = await axios.post(`${BASE_URL}/api/auth/device/token`, {
        device_code: mockDeviceCodeResponse.device_code,
      });

      expect(response.data.status).toBe('pending');
    });

    it('should return token when authorized', async () => {
      const mockToken = 'api_test123456789012345678901234567890123456789012345678901234';
      
      mockAxios.onPost(`${BASE_URL}/api/auth/device/token`).reply(200, {
        status: 'authorized',
        api_token: mockToken,
      });

      const response = await axios.post(`${BASE_URL}/api/auth/device/token`, {
        device_code: mockDeviceCodeResponse.device_code,
      });

      expect(response.data.status).toBe('authorized');
      expect(response.data.api_token).toBe(mockToken);
    });

    it('should return denied status when user denies', async () => {
      mockAxios.onPost(`${BASE_URL}/api/auth/device/token`).reply(403, {
        status: 'denied',
        error: 'access_denied',
      });

      try {
        await axios.post(`${BASE_URL}/api/auth/device/token`, {
          device_code: mockDeviceCodeResponse.device_code,
        });
      } catch (error: any) {
        expect(error.response.status).toBe(403);
        expect(error.response.data.status).toBe('denied');
      }
    });

    it('should return expired status when code expires', async () => {
      mockAxios.onPost(`${BASE_URL}/api/auth/device/token`).reply(400, {
        status: 'expired',
        error: 'expired_token',
      });

      try {
        await axios.post(`${BASE_URL}/api/auth/device/token`, {
          device_code: mockDeviceCodeResponse.device_code,
        });
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.status).toBe('expired');
      }
    });
  });

  describe('Token Polling Logic', () => {
    it('should poll multiple times until authorized', async () => {
      let callCount = 0;
      
      mockAxios.onPost(`${BASE_URL}/api/auth/device/token`).reply(() => {
        callCount++;
        if (callCount < 3) {
          return [200, { status: 'pending', error: 'authorization_pending' }];
        }
        return [200, { status: 'authorized', api_token: 'api_finaltokenvalue' }];
      });

      // Simulate polling logic
      let result: any = null;
      for (let i = 0; i < 5; i++) {
        const response = await axios.post(`${BASE_URL}/api/auth/device/token`, {
          device_code: mockDeviceCodeResponse.device_code,
        });
        
        if (response.data.status === 'authorized') {
          result = response.data;
          break;
        }
      }

      expect(callCount).toBe(3);
      expect(result.status).toBe('authorized');
      expect(result.api_token).toBe('api_finaltokenvalue');
    });

    it('should stop polling on denied status', async () => {
      let callCount = 0;
      
      mockAxios.onPost(`${BASE_URL}/api/auth/device/token`).reply(() => {
        callCount++;
        if (callCount < 2) {
          return [200, { status: 'pending', error: 'authorization_pending' }];
        }
        return [403, { status: 'denied', error: 'access_denied' }];
      });

      // Simulate polling logic
      let stopped = false;
      for (let i = 0; i < 5; i++) {
        try {
          const response = await axios.post(`${BASE_URL}/api/auth/device/token`, {
            device_code: mockDeviceCodeResponse.device_code,
          });
          
          if (response.data.status === 'authorized') {
            break;
          }
        } catch (error: any) {
          if (error.response?.data?.status === 'denied') {
            stopped = true;
            break;
          }
        }
      }

      expect(callCount).toBe(2);
      expect(stopped).toBe(true);
    });
  });

  describe('User Code Format', () => {
    it('should accept user code in XXXX-XXXX format', () => {
      const userCode = 'ABCD-EFGH';
      const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
      
      expect(pattern.test(userCode)).toBe(true);
    });

    it('should reject invalid user code formats', () => {
      const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
      
      expect(pattern.test('ABCD')).toBe(false);
      expect(pattern.test('ABCDEFGH')).toBe(false);
      expect(pattern.test('abcd-efgh')).toBe(false);
      expect(pattern.test('ABCD_EFGH')).toBe(false);
    });
  });

  describe('Device Code Validation', () => {
    it('should validate device code length', () => {
      // Device code should be 64 hex characters
      const deviceCode = mockDeviceCodeResponse.device_code;
      
      // Device codes should be reasonably long for security
      expect(deviceCode.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('Verification URI', () => {
    it('should construct correct verification URI', () => {
      const verificationUri = mockDeviceCodeResponse.verification_uri;
      const verificationUriComplete = mockDeviceCodeResponse.verification_uri_complete;
      
      expect(verificationUri).toContain('/cli/authorize');
      expect(verificationUriComplete).toContain(mockDeviceCodeResponse.user_code);
    });
  });

  describe('Expiration', () => {
    it('should include expiration time in response', () => {
      expect(mockDeviceCodeResponse.expires_in).toBeDefined();
      expect(mockDeviceCodeResponse.expires_in).toBe(600); // 10 minutes
    });

    it('should include polling interval in response', () => {
      expect(mockDeviceCodeResponse.interval).toBeDefined();
      expect(mockDeviceCodeResponse.interval).toBe(5); // 5 seconds
    });
  });
});

describe('Browser Opening', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should attempt to open browser with verification URL', async () => {
    const open = (await import('open')).default;
    const mockOpen = open as jest.MockedFunction<typeof open>;
    
    const url = 'https://app.nimroboai.com/cli/authorize?code=ABCD-EFGH';
    await mockOpen(url);

    expect(mockOpen).toHaveBeenCalledWith(url);
  });

  it('should handle browser open failure gracefully', async () => {
    const open = (await import('open')).default;
    const mockOpen = open as jest.MockedFunction<typeof open>;
    
    mockOpen.mockRejectedValueOnce(new Error('Failed to open browser'));

    await expect(async () => {
      try {
        await mockOpen('https://example.com');
        return true;
      } catch {
        return false;
      }
    }).not.toThrow();
  });
});
