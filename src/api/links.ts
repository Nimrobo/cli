import { getApiClient } from './client';
import {
  VoiceLink,
  InstantVoiceLink,
  LinksListResponse,
  LinksCreateResponse,
  CreateProjectLinksInput,
  CreateInstantLinksInput,
  UpdateInstantLinkInput,
} from '../types';

// Project links
export async function listProjectLinks(projectId: string): Promise<VoiceLink[]> {
  const client = getApiClient();
  const response = await client.get<LinksListResponse>(`/v1/projects/${projectId}/links`);
  return response.data.links as VoiceLink[];
}

export async function createProjectLinks(
  projectId: string,
  data: CreateProjectLinksInput
): Promise<VoiceLink[]> {
  const client = getApiClient();
  const response = await client.post<LinksCreateResponse>(
    `/v1/projects/${projectId}/links`,
    data
  );
  return response.data.links as VoiceLink[];
}

export async function cancelProjectLink(
  linkId: string,
  projectId: string
): Promise<void> {
  const client = getApiClient();
  await client.post(`/v1/projects/links/${linkId}/cancel`, null, {
    params: { projectId },
  });
}

// Instant links
export async function listInstantLinks(): Promise<InstantVoiceLink[]> {
  const client = getApiClient();
  const response = await client.get<LinksListResponse>('/v1/instant-voice-links');
  return response.data.links as InstantVoiceLink[];
}

export async function createInstantLinks(
  data: CreateInstantLinksInput
): Promise<InstantVoiceLink[]> {
  const client = getApiClient();
  const response = await client.post<LinksCreateResponse>('/v1/instant-voice-links', data);
  return response.data.links as InstantVoiceLink[];
}

export async function updateInstantLink(
  linkId: string,
  data: UpdateInstantLinkInput
): Promise<void> {
  const client = getApiClient();
  await client.patch(`/v1/instant-voice-links/${linkId}`, data);
}
