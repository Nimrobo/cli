/**
 * Integration tests for Net API client
 */

// Mock config before importing client
jest.mock('../../src/utils/config', () => ({
  getApiKey: jest.fn().mockReturnValue('test-net-api-key'),
  getNetApiBaseUrl: jest.fn().mockReturnValue('http://localhost:3000'),
}));

import { createNetApiClient, getNetApiClient, resetNetApiClient } from '../../src/api/net/client';
import { getApiKey, getNetApiBaseUrl } from '../../src/utils/config';

describe('Net API Client', () => {
  beforeEach(() => {
    resetNetApiClient();
    jest.clearAllMocks();
  });

  describe('createNetApiClient', () => {
    it('should create axios instance with Net API baseURL', () => {
      const client = createNetApiClient();
      expect(client.defaults.baseURL).toBe('http://localhost:3000');
    });

    it('should include Authorization header with API key', () => {
      const client = createNetApiClient();
      expect(client.defaults.headers['Authorization']).toBe('Bearer test-net-api-key');
    });

    it('should set Content-Type header', () => {
      const client = createNetApiClient();
      expect(client.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('should not include Authorization when no API key', () => {
      (getApiKey as jest.Mock).mockReturnValueOnce(null);
      
      const client = createNetApiClient();
      expect(client.defaults.headers['Authorization']).toBeUndefined();
    });
  });

  describe('getNetApiClient', () => {
    it('should return singleton instance', () => {
      const client1 = getNetApiClient();
      const client2 = getNetApiClient();
      
      expect(client1).toBe(client2);
    });

    it('should return new instance after reset', () => {
      const client1 = getNetApiClient();
      resetNetApiClient();
      const client2 = getNetApiClient();
      
      expect(client1).not.toBe(client2);
    });
  });
});
