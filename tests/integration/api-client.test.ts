/**
 * Integration tests for API client (screen API)
 */

// Mock config before importing client
jest.mock('../../src/utils/config', () => ({
  getApiKey: jest.fn().mockReturnValue('test-api-key'),
  getApiBaseUrl: jest.fn().mockReturnValue('https://test-api.example.com'),
}));

import { createApiClient, getApiClient, resetApiClient } from '../../src/api/client';
import { getApiKey, getApiBaseUrl } from '../../src/utils/config';

describe('API Client (Screen)', () => {
  beforeEach(() => {
    resetApiClient();
    jest.clearAllMocks();
  });

  describe('createApiClient', () => {
    it('should create axios instance with correct baseURL', () => {
      const client = createApiClient();
      expect(client.defaults.baseURL).toBe('https://test-api.example.com');
    });

    it('should include Authorization header when API key exists', () => {
      const client = createApiClient();
      expect(client.defaults.headers['Authorization']).toBe('Bearer test-api-key');
    });

    it('should set Content-Type to application/json', () => {
      const client = createApiClient();
      expect(client.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('should not include Authorization header when no API key', () => {
      (getApiKey as jest.Mock).mockReturnValueOnce(null);
      
      const client = createApiClient();
      expect(client.defaults.headers['Authorization']).toBeUndefined();
    });
  });

  describe('getApiClient', () => {
    it('should return singleton instance', () => {
      const client1 = getApiClient();
      const client2 = getApiClient();
      
      expect(client1).toBe(client2);
    });

    it('should create new instance after reset', () => {
      const client1 = getApiClient();
      resetApiClient();
      const client2 = getApiClient();
      
      expect(client1).not.toBe(client2);
    });
  });
});
