import axios from 'axios';
import { getApiBaseUrl } from '../utils/config';
import { getApiClient } from './client';
import { UserProfile } from '../types';

export async function validateApiKey(apiKey: string, baseUrl?: string): Promise<UserProfile> {
  const url = baseUrl || getApiBaseUrl();
  const response = await axios.get<UserProfile>(`${url}/v1/user/profile`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  return response.data;
}

export async function getUserProfile(): Promise<UserProfile> {
  const client = getApiClient();
  const response = await client.get<UserProfile>('/v1/user/profile');
  return response.data;
}
