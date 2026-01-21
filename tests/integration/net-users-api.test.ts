/**
 * Integration tests for Net Users API functions
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Mock config
jest.mock('../../src/utils/config', () => ({
  getApiKey: jest.fn().mockReturnValue('test-api-key'),
  getNetApiBaseUrl: jest.fn().mockReturnValue('http://localhost:3000'),
}));

// Mock the client module to use our mock
jest.mock('../../src/api/net/client', () => {
  const mockAxiosInstance = axios.create({
    baseURL: 'http://localhost:3000',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-api-key' },
  });
  
  return {
    getNetApiClient: jest.fn().mockReturnValue(mockAxiosInstance),
    resetNetApiClient: jest.fn(),
    __mockAxiosInstance: mockAxiosInstance,
  };
});

import {
  getMyProfile,
  getUserById,
  updateMyProfile,
  getMyOrgs,
  getMyPosts,
  getMyApplications,
  getMyInvites,
  getMyJoinRequests,
  getMySummary,
  searchUsers,
} from '../../src/api/net/users';

// Access the mock instance for setting up mock responses
const { __mockAxiosInstance } = require('../../src/api/net/client');
let mock: MockAdapter;

describe('Net Users API', () => {
  beforeEach(() => {
    mock = new MockAdapter(__mockAxiosInstance);
  });

  afterEach(() => {
    mock.reset();
  });

  describe('getMyProfile', () => {
    it('should fetch current user profile', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        profile: { data: { name: 'Test User' } },
        created_at: '2024-01-01T00:00:00Z',
      };

      mock.onGet('/v1/users/me').reply(200, { data: mockUser });

      const result = await getMyProfile();

      expect(result).toEqual(mockUser);
      expect(result.id).toBe('user-123');
    });

    it('should handle API errors', async () => {
      mock.onGet('/v1/users/me').reply(401, { error: 'Unauthorized' });

      await expect(getMyProfile()).rejects.toThrow();
    });
  });

  describe('getUserById', () => {
    it('should fetch user by ID', async () => {
      const mockUser = {
        id: 'user-456',
        profile: { data: { name: 'Another User' } },
        created_at: '2024-01-01T00:00:00Z',
      };

      mock.onGet('/v1/users/user-456').reply(200, { data: mockUser });

      const result = await getUserById('user-456');

      expect(result.id).toBe('user-456');
    });
  });

  describe('updateMyProfile', () => {
    it('should update profile and return updated user', async () => {
      const profileUpdate = {
        data: { name: 'Updated Name', location: { city: 'NYC' } },
      };
      const mockUpdatedUser = {
        id: 'user-123',
        profile: profileUpdate,
        created_at: '2024-01-01T00:00:00Z',
      };

      mock.onPatch('/v1/users/me').reply(200, { data: mockUpdatedUser });

      const result = await updateMyProfile(profileUpdate);

      expect(result.profile?.data?.name).toBe('Updated Name');
    });
  });

  describe('getMyOrgs', () => {
    it('should fetch user organizations', async () => {
      const mockOrgs = [
        { id: 'org-1', name: 'Org One', slug: 'org-one', status: 'active', role: 'owner' },
        { id: 'org-2', name: 'Org Two', slug: 'org-two', status: 'active', role: 'member' },
      ];

      mock.onGet('/v1/users/me/orgs').reply(200, {
        data: mockOrgs,
        pagination: { limit: 20, skip: 0, has_more: false },
      });

      const result = await getMyOrgs();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Org One');
    });

    it('should support pagination params', async () => {
      mock.onGet('/v1/users/me/orgs', { params: { limit: 5, skip: 10 } }).reply(200, {
        data: [],
        pagination: { limit: 5, skip: 10, has_more: false },
      });

      const result = await getMyOrgs({ limit: 5, skip: 10 });

      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.skip).toBe(10);
    });
  });

  describe('getMyPosts', () => {
    it('should fetch user posts', async () => {
      const mockPosts = [
        { id: 'post-1', post_type: 'job', status: 'active', data: { title: 'Job 1' } },
      ];

      mock.onGet('/v1/users/me/posts').reply(200, {
        data: mockPosts,
        pagination: { limit: 20, skip: 0, has_more: false },
      });

      const result = await getMyPosts();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].data?.title).toBe('Job 1');
    });
  });

  describe('getMyApplications', () => {
    it('should fetch user applications', async () => {
      const mockApps = [
        { id: 'app-1', post_id: 'post-1', status: 'pending', applicant_id: 'user-123' },
      ];

      mock.onGet('/v1/users/me/applications').reply(200, {
        data: mockApps,
        pagination: { limit: 20, skip: 0, has_more: false },
      });

      const result = await getMyApplications();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('pending');
    });

    it('should support status filter', async () => {
      mock.onGet('/v1/users/me/applications').reply(200, {
        data: [],
        pagination: { limit: 20, skip: 0, has_more: false },
      });

      await getMyApplications({ status: 'accepted' });

      expect(mock.history.get[0].params).toMatchObject({ status: 'accepted' });
    });
  });

  describe('getMyInvites', () => {
    it('should fetch pending invites', async () => {
      const mockInvites = [
        { id: 'inv-1', org_id: 'org-1', role: 'member', status: 'pending' },
      ];

      mock.onGet('/v1/users/me/invites').reply(200, {
        data: mockInvites,
        pagination: { limit: 20, skip: 0, has_more: false },
      });

      const result = await getMyInvites();

      expect(result.data).toHaveLength(1);
    });
  });

  describe('getMyJoinRequests', () => {
    it('should fetch join requests', async () => {
      const mockRequests = [
        { id: 'req-1', org_id: 'org-1', status: 'pending' },
      ];

      mock.onGet('/v1/users/me/join-requests').reply(200, {
        data: mockRequests,
        pagination: { limit: 20, skip: 0, has_more: false },
      });

      const result = await getMyJoinRequests();

      expect(result.data).toHaveLength(1);
    });
  });

  describe('getMySummary', () => {
    it('should fetch user summary', async () => {
      const mockSummary = {
        unread_messages: { total: 5, channels: [] },
        pending_applicants: { total: 3, posts: [] },
        my_applications: {
          pending: { count: 1, items: [] },
          accepted: { count: 2, items: [] },
          rejected: { count: 0, items: [] },
        },
        org_invites: { count: 0, items: [] },
        org_join_requests: { count: 1, items: [] },
      };

      mock.onGet('/v1/users/me/summary').reply(200, { data: mockSummary });

      const result = await getMySummary();

      expect(result.unread_messages.total).toBe(5);
      expect(result.pending_applicants.total).toBe(3);
    });
  });

  describe('searchUsers', () => {
    it('should search users with keyword', async () => {
      const mockUsers = [
        { id: 'user-1', profile: { data: { name: 'John Doe' } } },
      ];

      mock.onPost('/v1/users/search').reply(200, {
        data: mockUsers,
        pagination: { limit: 20, skip: 0, has_more: false },
      });

      const result = await searchUsers({ keyword: 'John' });

      expect(result.data).toHaveLength(1);
    });

    it('should search with filters', async () => {
      mock.onPost('/v1/users/search').reply(200, {
        data: [],
        pagination: { limit: 20, skip: 0, has_more: false },
      });

      await searchUsers({
        filters: { location_city: 'NYC' },
        pagination: { limit: 10 },
      });

      expect(mock.history.post[0].data).toContain('NYC');
    });
  });
});
