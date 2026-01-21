import axios, { AxiosInstance } from 'axios';
import { getApiBaseUrl, getApiKey } from '../utils/config';

let clientInstance: AxiosInstance | null = null;

export function createApiClient(): AxiosInstance {
  const apiKey = getApiKey();
  const baseURL = getApiBaseUrl();

  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    },
  });

  return client;
}

export function getApiClient(): AxiosInstance {
  if (!clientInstance) {
    clientInstance = createApiClient();
  }
  return clientInstance;
}

export function resetApiClient(): void {
  clientInstance = null;
}
