import { getNetApiClient, resetNetApiClient } from './client';
import {
  NetApplication,
  NetChannel,
  BatchActionResult,
  NetApiResponse,
} from '../../types';

// GET /v1/applications/:id
export async function getApplicationById(applicationId: string): Promise<NetApplication> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.get<NetApiResponse<NetApplication>>(`/v1/applications/${applicationId}`);
  return response.data.data;
}

// POST /v1/applications/:id/accept
export async function acceptApplication(
  applicationId: string,
  options?: { channel_expires_at?: string; context?: string }
): Promise<{ message: string; application_id: string; channel: NetChannel }> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<{ message: string; application_id: string; channel: NetChannel }>>(
    `/v1/applications/${applicationId}/accept`,
    options
  );
  return response.data.data;
}

// POST /v1/applications/:id/reject
export async function rejectApplication(applicationId: string, reason?: string): Promise<{ message: string; application_id: string }> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<{ message: string; application_id: string }>>(
    `/v1/applications/${applicationId}/reject`,
    { reason }
  );
  return response.data.data;
}

// POST /v1/applications/:id/withdraw
export async function withdrawApplication(applicationId: string): Promise<{ message: string; application_id: string }> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<{ message: string; application_id: string }>>(
    `/v1/applications/${applicationId}/withdraw`
  );
  return response.data.data;
}

// POST /v1/applications/batch-action
export async function batchAction(
  action: 'accept' | 'reject',
  applicationIds: string[],
  options?: { channel_expires_at?: string; reason?: string }
): Promise<BatchActionResult> {
  resetNetApiClient();
  const client = getNetApiClient();
  const response = await client.post<NetApiResponse<BatchActionResult>>('/v1/applications/batch-action', {
    action,
    application_ids: applicationIds,
    ...options,
  });
  return response.data.data;
}
