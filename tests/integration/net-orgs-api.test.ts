/**
 * Integration tests for Net Organizations API functions
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Mock config
jest.mock('../../src/utils/config', () => ({
  getApiKey: jest.fn().mockReturnValue('test-api-key'),
  getNetApiBaseUrl: jest.fn().mockReturnValue('http://localhost:3000'),
}));

// Mock the client module
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
  createOrg,
  listOrgs,
  getOrgById,
  updateOrg,
  deleteOrg,
  leaveOrg,
  getOrgMembers,
  removeOrgMember,
  updateMemberRole,
  sendOrgInvite,
  getOrgInvites,
  cancelOrgInvite,
  sendJoinRequest,
  getOrgJoinRequests,
  getOrgPosts,
  acceptOrgInvite,
  declineOrgInvite,
  approveJoinRequest,
  rejectJoinRequest,
  cancelJoinRequest,
} from '../../src/api/net/orgs';

const { __mockAxiosInstance } = require('../../src/api/net/client');
let mock: MockAdapter;

describe('Net Organizations API', () => {
  beforeEach(() => {
    mock = new MockAdapter(__mockAxiosInstance);
  });

  afterEach(() => {
    mock.reset();
  });

  describe('createOrg', () => {
    it('should create new organization', async () => {
      const mockOrg = {
        id: 'org-123',
        name: 'Test Org',
        slug: 'test-org',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mock.onPost('/v1/orgs/create').reply(200, { data: mockOrg });

      const result = await createOrg('Test Org', 'A test org');

      expect(result.name).toBe('Test Org');
      expect(result.slug).toBe('test-org');
    });
  });

  describe('listOrgs', () => {
    it('should list organizations', async () => {
      const mockOrgs = [
        { id: 'org-1', name: 'Org One', slug: 'org-one', status: 'active' },
        { id: 'org-2', name: 'Org Two', slug: 'org-two', status: 'active' },
      ];

      mock.onGet('/v1/orgs').reply(200, {
        data: mockOrgs,
        pagination: { limit: 20, skip: 0, has_more: false },
      });

      const result = await listOrgs();

      expect(result.data).toHaveLength(2);
    });

    it('should support search params', async () => {
      mock.onGet('/v1/orgs').reply(200, {
        data: [],
        pagination: { limit: 10, skip: 0, has_more: false },
      });

      await listOrgs({ keyword: 'tech', limit: 10 });

      expect(mock.history.get[0].params).toMatchObject({ keyword: 'tech', limit: 10 });
    });

    it('should support website filter for partial matching', async () => {
      const mockOrgs = [
        { id: 'org-1', name: 'GitHub', slug: 'github', status: 'active', data: { website: 'https://github.com' } },
      ];

      mock.onGet('/v1/orgs').reply(200, {
        data: mockOrgs,
        pagination: { limit: 20, skip: 0, has_more: false },
      });

      const result = await listOrgs({ website: 'github' });

      expect(mock.history.get[0].params).toMatchObject({ website: 'github' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('GitHub');
    });

    it('should support combining website filter with other params', async () => {
      mock.onGet('/v1/orgs').reply(200, {
        data: [],
        pagination: { limit: 10, skip: 0, has_more: false },
      });

      await listOrgs({ website: 'example.com', status: 'active', limit: 10 });

      expect(mock.history.get[0].params).toMatchObject({
        website: 'example.com',
        status: 'active',
        limit: 10,
      });
    });
  });

  describe('getOrgById', () => {
    it('should fetch organization by ID', async () => {
      const mockOrg = {
        id: 'org-123',
        name: 'My Org',
        slug: 'my-org',
        status: 'active',
      };

      mock.onGet('/v1/orgs/org-123').reply(200, { data: mockOrg });

      const result = await getOrgById('org-123');

      expect(result.id).toBe('org-123');
    });
  });

  describe('updateOrg', () => {
    it('should update organization', async () => {
      const mockOrg = {
        id: 'org-123',
        name: 'Updated Org',
        slug: 'updated-org',
        status: 'active',
      };

      mock.onPatch('/v1/orgs/org-123').reply(200, { data: mockOrg });

      const result = await updateOrg('org-123', { name: 'Updated Org' });

      expect(result.name).toBe('Updated Org');
    });
  });

  describe('deleteOrg', () => {
    it('should delete organization', async () => {
      mock.onDelete('/v1/orgs/org-123').reply(200, {
        data: { message: 'Organization deleted', id: 'org-123' },
      });

      const result = await deleteOrg('org-123');

      expect(result.message).toBe('Organization deleted');
    });
  });

  describe('leaveOrg', () => {
    it('should leave organization', async () => {
      mock.onPost('/v1/orgs/org-123/leave').reply(200, {
        data: { message: 'Left organization' },
      });

      const result = await leaveOrg('org-123');

      expect(result.message).toBe('Left organization');
    });
  });

  describe('getOrgMembers', () => {
    it('should fetch organization members', async () => {
      const mockMembers = [
        { id: 'mem-1', user_id: 'user-1', role: 'owner' },
        { id: 'mem-2', user_id: 'user-2', role: 'member' },
      ];

      mock.onGet('/v1/orgs/org-123/members').reply(200, {
        data: mockMembers,
        pagination: { limit: 20, skip: 0, has_more: false },
      });

      const result = await getOrgMembers('org-123');

      expect(result.data).toHaveLength(2);
    });
  });

  describe('removeOrgMember', () => {
    it('should remove member from organization', async () => {
      mock.onDelete('/v1/orgs/org-123/members/user-456').reply(200, {
        data: { message: 'Member removed' },
      });

      const result = await removeOrgMember('org-123', 'user-456');

      expect(result.message).toBe('Member removed');
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', async () => {
      const mockMember = {
        id: 'mem-1',
        user_id: 'user-456',
        role: 'admin',
      };

      mock.onPatch('/v1/orgs/org-123/members/user-456').reply(200, { data: mockMember });

      const result = await updateMemberRole('org-123', 'user-456', 'admin');

      expect(result.role).toBe('admin');
    });
  });

  describe('sendOrgInvite', () => {
    it('should send organization invite', async () => {
      const mockInvite = {
        id: 'inv-123',
        org_id: 'org-123',
        invitee_email: 'new@example.com',
        role: 'member',
        status: 'pending',
      };

      mock.onPost('/v1/orgs/org-123/sendinvite').reply(200, { data: mockInvite });

      const result = await sendOrgInvite('org-123', 'new@example.com', 'member');

      expect(result.invitee_email).toBe('new@example.com');
    });
  });

  describe('getOrgInvites', () => {
    it('should fetch organization invites', async () => {
      mock.onGet('/v1/orgs/org-123/invites').reply(200, {
        data: [{ id: 'inv-1', role: 'member', status: 'pending' }],
        pagination: { limit: 20, skip: 0, has_more: false },
      });

      const result = await getOrgInvites('org-123');

      expect(result.data).toHaveLength(1);
    });
  });

  describe('cancelOrgInvite', () => {
    it('should cancel organization invite', async () => {
      mock.onDelete('/v1/orgs/org-123/invites/inv-456').reply(200, {
        data: { message: 'Invite cancelled' },
      });

      const result = await cancelOrgInvite('org-123', 'inv-456');

      expect(result.message).toBe('Invite cancelled');
    });
  });

  describe('sendJoinRequest', () => {
    it('should send join request', async () => {
      const mockRequest = {
        id: 'req-123',
        org_id: 'org-123',
        status: 'pending',
      };

      mock.onPost('/v1/orgs/org-123/sendjoinrequest').reply(200, { data: mockRequest });

      const result = await sendJoinRequest('org-123', 'Please let me join');

      expect(result.status).toBe('pending');
    });
  });

  describe('getOrgJoinRequests', () => {
    it('should fetch join requests', async () => {
      mock.onGet('/v1/orgs/org-123/join-requests').reply(200, {
        data: [{ id: 'req-1', status: 'pending' }],
        pagination: { limit: 20, skip: 0, has_more: false },
      });

      const result = await getOrgJoinRequests('org-123');

      expect(result.data).toHaveLength(1);
    });
  });

  describe('getOrgPosts', () => {
    it('should fetch organization posts', async () => {
      const mockPosts = [
        { id: 'post-1', post_type: 'job', status: 'active' },
      ];

      mock.onGet('/v1/orgs/org-123/posts').reply(200, {
        data: mockPosts,
        pagination: { limit: 20, skip: 0, has_more: false },
      });

      const result = await getOrgPosts('org-123');

      expect(result.data).toHaveLength(1);
    });
  });

  describe('acceptOrgInvite', () => {
    it('should accept invite', async () => {
      mock.onPost('/v1/org/invites/inv-123/accept').reply(200, {
        data: { message: 'Invite accepted', org_id: 'org-123', role: 'member' },
      });

      const result = await acceptOrgInvite('inv-123');

      expect(result.message).toBe('Invite accepted');
      expect(result.role).toBe('member');
    });
  });

  describe('declineOrgInvite', () => {
    it('should decline invite', async () => {
      mock.onPost('/v1/org/invites/inv-123/decline').reply(200, {
        data: { message: 'Invite declined' },
      });

      const result = await declineOrgInvite('inv-123');

      expect(result.message).toBe('Invite declined');
    });
  });

  describe('approveJoinRequest', () => {
    it('should approve join request', async () => {
      mock.onPost('/v1/org/join-requests/req-123/approve').reply(200, {
        data: { message: 'Request approved', user_id: 'user-1', org_id: 'org-1', role: 'member' },
      });

      const result = await approveJoinRequest('req-123', 'member');

      expect(result.message).toBe('Request approved');
    });
  });

  describe('rejectJoinRequest', () => {
    it('should reject join request', async () => {
      mock.onPost('/v1/org/join-requests/req-123/reject').reply(200, {
        data: { message: 'Request rejected' },
      });

      const result = await rejectJoinRequest('req-123');

      expect(result.message).toBe('Request rejected');
    });
  });

  describe('cancelJoinRequest', () => {
    it('should cancel own join request', async () => {
      mock.onDelete('/v1/org/join-requests/req-123').reply(200, {
        data: { message: 'Request cancelled' },
      });

      const result = await cancelJoinRequest('req-123');

      expect(result.message).toBe('Request cancelled');
    });
  });
});
