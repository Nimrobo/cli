import { getNetApiClient, resetNetApiClient } from './client';
import {
  NetPost,
  PostData,
  PostType,
  NetApplication,
  ApplicationData,
  NetApiResponse,
  NetPaginatedResponse,
} from '../../types';

export interface PostSearchParams {
  // Basic filters
  post_type?: PostType;
  status?: string;
  org_id?: string;
  // Job-specific filters
  compensation_type?: string;
  employment_type?: string;
  remote?: string;
  education_level?: string;
  // Range filters
  salary_min?: number;
  salary_max?: number;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  experience_min?: number;
  experience_max?: number;
  // Array filters (comma-separated)
  skills?: string;
  // Location filters
  location_country?: string;
  location_city?: string;
  // Boolean filters
  urgent?: boolean;
  // Date filters
  expires_after?: string;
  expires_before?: string;
  // Search
  keyword?: string;
  sort_field?: string;
  sort_order?: 'asc' | 'desc';
  // Pagination
  limit?: number;
  skip?: number;
  // Exclude already applied
  exclude_applied?: boolean;
}

export interface CreatePostInput {
  post_type: PostType;
  data: PostData;
  content_md?: string;
  expires_at: string;
  org_id?: string;
}

export interface UpdatePostInput {
  post_type?: PostType;
  data?: PostData;
  content_md?: string;
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
