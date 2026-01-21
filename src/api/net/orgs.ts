import { getNetApiClient, resetNetApiClient } from './client';
import {
  NetOrg,
  OrgData,
  OrgMember,
  OrgInvite,
  OrgJoinRequest,
  OrgRole,
  NetPost,
  NetApiResponse,
  NetPaginatedResponse,
} from '../../types';

export interface OrgSearchParams {
  name?: string;
  status?: string;
  website?: string;
  keyword?: string;
  sort_field?: string;
  sort_order?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

// POST /v1/orgs/create
export async function createOrg(name: string, data?: OrgData): Promise<NetOrg> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<NetOrg>>('/v1/orgs/create', { name, data });
  return response.data.data;
}

// GET /v1/orgs
export async function listOrgs(params?: OrgSearchParams): Promise<NetPaginatedResponse<NetOrg>> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetPaginatedResponse<NetOrg>>('/v1/orgs', { params });
  return response.data;
}

// GET /v1/orgs/:id
export async function getOrgById(orgId: string): Promise<NetOrg> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetApiResponse<NetOrg>>(`/v1/orgs/${orgId}`);
  return response.data.data;
}

// PATCH /v1/orgs/:id
export async function updateOrg(orgId: string, updates: { name?: string; data?: OrgData }): Promise<NetOrg> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.patch<NetApiResponse<NetOrg>>(`/v1/orgs/${orgId}`, updates);
  return response.data.data;
}

// DELETE /v1/orgs/:id
export async function deleteOrg(orgId: string): Promise<{ message: string; id: string }> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.delete<NetApiResponse<{ message: string; id: string }>>(`/v1/orgs/${orgId}`);
  return response.data.data;
}

// POST /v1/orgs/:id/leave
export async function leaveOrg(orgId: string): Promise<{ message: string }> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<{ message: string }>>(`/v1/orgs/${orgId}/leave`);
  return response.data.data;
}

// GET /v1/orgs/:id/members
export async function getOrgMembers(orgId: string, params?: { limit?: number; skip?: number }): Promise<NetPaginatedResponse<OrgMember>> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetPaginatedResponse<OrgMember>>(`/v1/orgs/${orgId}/members`, { params });
  return response.data;
}

// DELETE /v1/orgs/:id/members/:userId
export async function removeOrgMember(orgId: string, userId: string): Promise<{ message: string }> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.delete<NetApiResponse<{ message: string }>>(`/v1/orgs/${orgId}/members/${userId}`);
  return response.data.data;
}

// PATCH /v1/orgs/:id/members/:userId
export async function updateMemberRole(orgId: string, userId: string, role: OrgRole): Promise<OrgMember> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.patch<NetApiResponse<OrgMember>>(`/v1/orgs/${orgId}/members/${userId}`, { role });
  return response.data.data;
}

// POST /v1/orgs/:id/sendinvite
export async function sendOrgInvite(orgId: string, email: string, role: OrgRole): Promise<OrgInvite> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<OrgInvite>>(`/v1/orgs/${orgId}/sendinvite`, { email, role });
  return response.data.data;
}

// GET /v1/orgs/:id/invites
export async function getOrgInvites(orgId: string, params?: { limit?: number; skip?: number }): Promise<NetPaginatedResponse<OrgInvite>> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetPaginatedResponse<OrgInvite>>(`/v1/orgs/${orgId}/invites`, { params });
  return response.data;
}

// DELETE /v1/orgs/:id/invites/:inviteId
export async function cancelOrgInvite(orgId: string, inviteId: string): Promise<{ message: string }> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.delete<NetApiResponse<{ message: string }>>(`/v1/orgs/${orgId}/invites/${inviteId}`);
  return response.data.data;
}

// POST /v1/orgs/:id/sendjoinrequest
export async function sendJoinRequest(orgId: string, message?: string): Promise<OrgJoinRequest> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<OrgJoinRequest>>(`/v1/orgs/${orgId}/sendjoinrequest`, { message });
  return response.data.data;
}

// GET /v1/orgs/:id/join-requests
export async function getOrgJoinRequests(orgId: string, params?: { limit?: number; skip?: number }): Promise<NetPaginatedResponse<OrgJoinRequest>> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetPaginatedResponse<OrgJoinRequest>>(`/v1/orgs/${orgId}/join-requests`, { params });
  return response.data;
}

// GET /v1/orgs/:id/posts
export async function getOrgPosts(orgId: string, params?: { limit?: number; skip?: number }): Promise<NetPaginatedResponse<NetPost>> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetPaginatedResponse<NetPost>>(`/v1/orgs/${orgId}/posts`, { params });
  return response.data;
}

// POST /v1/org/invites/:id/accept
export async function acceptOrgInvite(inviteId: string): Promise<{ message: string; org_id: string; role: OrgRole }> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<{ message: string; org_id: string; role: OrgRole }>>(`/v1/org/invites/${inviteId}/accept`);
  return response.data.data;
}

// POST /v1/org/invites/:id/decline
export async function declineOrgInvite(inviteId: string): Promise<{ message: string }> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<{ message: string }>>(`/v1/org/invites/${inviteId}/decline`);
  return response.data.data;
}

// POST /v1/org/join-requests/:id/approve
export async function approveJoinRequest(requestId: string, role?: OrgRole): Promise<{ message: string; user_id: string; org_id: string; role: OrgRole }> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<{ message: string; user_id: string; org_id: string; role: OrgRole }>>(`/v1/org/join-requests/${requestId}/approve`, { role });
  return response.data.data;
}

// POST /v1/org/join-requests/:id/reject
export async function rejectJoinRequest(requestId: string): Promise<{ message: string }> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<{ message: string }>>(`/v1/org/join-requests/${requestId}/reject`);
  return response.data.data;
}

// DELETE /v1/org/join-requests/:id
export async function cancelJoinRequest(requestId: string): Promise<{ message: string }> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.delete<NetApiResponse<{ message: string }>>(`/v1/org/join-requests/${requestId}`);
  return response.data.data;
}
