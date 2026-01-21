import axios, { AxiosInstance } from 'axios';
import { getNetApiBaseUrl, getApiKey } from '../../utils/config';

let netClientInstance: AxiosInstance | null = null;

export function createNetApiClient(): AxiosInstance {
  const apiKey = getApiKey();
  const baseURL = getNetApiBaseUrl();

  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    },
  });

  return client;
}

export function getNetApiClient(): AxiosInstance {
  if (!netClientInstance) {
    netClientInstance = createNetApiClient();
  }
  return netClientInstance;
}

export function resetNetApiClient(): void {
  netClientInstance = null;
}
