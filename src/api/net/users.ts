import { getNetApiClient, resetNetApiClient } from './client';
import {
  NetUser,
  NetUserProfile,
  NetOrg,
  NetPost,
  NetApplication,
  OrgInvite,
  OrgJoinRequest,
  NetUserSummary,
  NetApiResponse,
  NetPaginatedResponse,
} from '../../types';

export interface UserSearchFilters {
  name?: string;
  location_city?: string;
  location_country?: string;
}

export interface UserSearchParams {
  filters?: UserSearchFilters;
  keyword?: string;
  pagination?: { limit?: number; skip?: number };
  sort?: { field: string; order: 'asc' | 'desc' };
}

// GET /v1/users/me
export async function getMyProfile(): Promise<NetUser> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetApiResponse<NetUser>>('/v1/users/me');
  return response.data.data;
}

// GET /v1/users/:id
export async function getUserById(userId: string): Promise<NetUser> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetApiResponse<NetUser>>(`/v1/users/${userId}`);
  return response.data.data;
}

// PATCH /v1/users/me
export async function updateMyProfile(profile: NetUserProfile): Promise<NetUser> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.patch<NetApiResponse<NetUser>>('/v1/users/me', { profile });
  return response.data.data;
}

// GET /v1/users/me/orgs
export async function getMyOrgs(params?: { limit?: number; skip?: number }): Promise<NetPaginatedResponse<NetOrg>> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetPaginatedResponse<NetOrg>>('/v1/users/me/orgs', { params });
  return response.data;
}

// GET /v1/users/me/posts
export async function getMyPosts(params?: { limit?: number; skip?: number }): Promise<NetPaginatedResponse<NetPost>> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetPaginatedResponse<NetPost>>('/v1/users/me/posts', { params });
  return response.data;
}

// GET /v1/users/me/applications
export async function getMyApplications(params?: {
  limit?: number;
  skip?: number;
  status?: string;
  keyword?: string;
}): Promise<NetPaginatedResponse<NetApplication>> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetPaginatedResponse<NetApplication>>('/v1/users/me/applications', { params });
  return response.data;
}

// GET /v1/users/me/invites
export async function getMyInvites(params?: { limit?: number; skip?: number }): Promise<NetPaginatedResponse<OrgInvite>> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetPaginatedResponse<OrgInvite>>('/v1/users/me/invites', { params });
  return response.data;
}

// GET /v1/users/me/join-requests
export async function getMyJoinRequests(params?: { limit?: number; skip?: number }): Promise<NetPaginatedResponse<OrgJoinRequest>> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetPaginatedResponse<OrgJoinRequest>>('/v1/users/me/join-requests', { params });
  return response.data;
}

// GET /v1/users/me/summary
export async function getMySummary(): Promise<NetUserSummary> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetApiResponse<NetUserSummary>>('/v1/users/me/summary');
  return response.data.data;
}

// POST /v1/users/search
export async function searchUsers(params: UserSearchParams): Promise<NetPaginatedResponse<NetUser>> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetPaginatedResponse<NetUser>>('/v1/users/search', params);
  return response.data;
}
