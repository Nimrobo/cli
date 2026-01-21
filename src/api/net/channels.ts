import { getNetApiClient, resetNetApiClient } from './client';
import {
  NetChannel,
  NetMessage,
  NetApiResponse,
  NetPaginatedResponse,
} from '../../types';

// GET /v1/channels
export async function listChannels(params?: {
  limit?: number;
  skip?: number;
  status?: string;
  application_id?: string;
  post_id?: string;
}): Promise<NetPaginatedResponse<NetChannel>> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetPaginatedResponse<NetChannel>>('/v1/channels', { params });
  return response.data;
}

// GET /v1/channels/:id
export async function getChannelById(channelId: string): Promise<NetChannel> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetApiResponse<NetChannel>>(`/v1/channels/${channelId}`);
  return response.data.data;
}

// GET /v1/channels/:id/messages
export async function getChannelMessages(channelId: string, params?: { limit?: number; skip?: number }): Promise<NetPaginatedResponse<NetMessage>> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetPaginatedResponse<NetMessage>>(`/v1/channels/${channelId}/messages`, { params });
  return response.data;
}

// POST /v1/channels/:id/messages
export async function sendMessage(channelId: string, content_md: string): Promise<NetMessage> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<NetMessage>>(`/v1/channels/${channelId}/messages`, { content_md });
  return response.data.data;
}

// GET /v1/channels/:id/messages/:messageId
export async function getMessageById(channelId: string, messageId: string): Promise<NetMessage> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetApiResponse<NetMessage>>(`/v1/channels/${channelId}/messages/${messageId}`);
  return response.data.data;
}

// POST /v1/channels/:id/messages/:messageId/read
export async function markMessageRead(channelId: string, messageId: string): Promise<{ message: string; message_id: string; read_at: string }> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<{ message: string; message_id: string; read_at: string }>>(
    `/v1/channels/${channelId}/messages/${messageId}/read`
  );
  return response.data.data;
}

// DELETE /v1/channels/:id/messages/:messageId/read
export async function markMessageUnread(channelId: string, messageId: string): Promise<{ message: string; message_id: string }> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.delete<NetApiResponse<{ message: string; message_id: string }>>(
    `/v1/channels/${channelId}/messages/${messageId}/read`
  );
  return response.data.data;
}

// POST /v1/channels/:id/read-all
export async function markAllRead(channelId: string): Promise<{ message: string; channel_id: string; messages_marked: number }> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<{ message: string; channel_id: string; messages_marked: number }>>(
    `/v1/channels/${channelId}/read-all`
  );
  return response.data.data;
}
