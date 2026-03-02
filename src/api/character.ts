import * as fs from 'fs';
import FormData from 'form-data';
import { getApiClient } from './client';
import { getApiKey } from '../utils/config';
import {
  CharacterPublishResult,
  CharacterStatusResult,
  CharacterListItem,
  ReviewDecisionResult,
} from '../types';

export async function publishCharacter(zipPath: string, draft: boolean): Promise<CharacterPublishResult> {
  const apiKey = getApiKey();
  const form = new FormData();
  form.append('file', fs.createReadStream(zipPath));
  if (draft) {
    form.append('draft', 'true');
  }

  const client = getApiClient();
  const response = await client.post('/api/character-hub/publish', form, {
    headers: {
      ...form.getHeaders(),
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    },
    maxContentLength: 20 * 1024 * 1024,
  });
  return response.data;
}

export async function getCharacterStatus(name: string): Promise<CharacterStatusResult> {
  const client = getApiClient();
  const response = await client.get(`/api/character-hub/${name}/status`);
  return response.data;
}

export async function listMyCharacters(): Promise<CharacterListItem[]> {
  const client = getApiClient();
  const response = await client.get('/api/character-hub/my-characters');
  return response.data.characters;
}

export async function downloadCharacterForReview(name: string, version: string): Promise<string> {
  const client = getApiClient();
  const response = await client.get(`/api/character-hub/review/${name}/${version}/download`);
  return response.data.downloadUrl;
}

export async function submitReviewDecision(
  name: string,
  version: string,
  decision: 'approve' | 'reject',
  comment?: string,
): Promise<ReviewDecisionResult> {
  const client = getApiClient();
  const response = await client.post(`/api/character-hub/review/${name}/${version}/decision`, {
    decision,
    ...(comment !== undefined && { comment }),
  });
  return response.data;
}
