import { getNetApiClient, resetNetApiClient } from './client';
import {
  NetPost,
  NetApplication,
  ApplicationData,
  NetApiResponse,
  NetPaginatedResponse,
} from '../../types';

export interface PostSearchParams {
  limit?: number;
  skip?: number;
  status?: string;
  org_id?: string;
  expires_after?: string;
  expires_before?: string;
  query?: string;
  filter?: Record<string, unknown>;
  sort_field?: string;
  sort_order?: 'asc' | 'desc';
  exclude_applied?: boolean;
}

export interface CreatePostInput {
  title: string;
  short_content?: string;
  long_content?: string;
  expires_at: string;
  org_id?: string;
}

export interface UpdatePostInput {
  title?: string;
  short_content?: string;
  long_content?: string;
  expires_at?: string;
  org_id?: string | null;
}

// POST /v1/posts/create
export async function createPost(input: CreatePostInput): Promise<NetPost> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<NetPost>>('/v1/posts/create', input);
  return response.data.data;
}

// GET /v1/posts
export async function listPosts(params?: PostSearchParams): Promise<NetPaginatedResponse<NetPost>> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetPaginatedResponse<NetPost>>('/v1/posts', { params });
  return response.data;
}

// GET /v1/posts/:id
export async function getPostById(postId: string): Promise<NetPost> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetApiResponse<NetPost>>(`/v1/posts/${postId}`);
  return response.data.data;
}

// PATCH /v1/posts/:id
export async function updatePost(postId: string, updates: UpdatePostInput): Promise<NetPost> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.patch<NetApiResponse<NetPost>>(`/v1/posts/${postId}`, updates);
  return response.data.data;
}

// POST /v1/posts/:id/close
export async function closePost(postId: string): Promise<{ message: string; id: string }> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<{ message: string; id: string }>>(`/v1/posts/${postId}/close`);
  return response.data.data;
}

// DELETE /v1/posts/:id
export async function deletePost(postId: string): Promise<{ message: string; id: string }> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.delete<NetApiResponse<{ message: string; id: string }>>(`/v1/posts/${postId}`);
  return response.data.data;
}

// POST /v1/posts/:id/applications
export async function applyToPost(postId: string, data?: ApplicationData, content_md?: string): Promise<NetApplication> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<NetApplication>>(`/v1/posts/${postId}/applications`, { data, content_md });
  return response.data.data;
}

// GET /v1/posts/:id/applications
export async function getPostApplications(
  postId: string,
  params?: { limit?: number; skip?: number; status?: string; keyword?: string }
): Promise<NetPaginatedResponse<NetApplication>> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetPaginatedResponse<NetApplication>>(`/v1/posts/${postId}/applications`, { params });
  return response.data;
}

// GET /v1/posts/:id/applications/me
export async function checkMyApplication(postId: string): Promise<NetApplication | null> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetApiResponse<NetApplication | null>>(`/v1/posts/${postId}/applications/me`);
  return response.data.data;
}
