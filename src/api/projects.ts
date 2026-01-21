import { getApiClient } from './client';
import {
  Project,
  ProjectsListResponse,
  ProjectResponse,
  CreateProjectInput,
  UpdateProjectInput,
} from '../types';

export async function listProjects(): Promise<Project[]> {
  const client = getApiClient();
  const response = await client.get<ProjectsListResponse>('/v1/projects');
  return response.data.projects;
}

export async function getProject(projectId: string): Promise<Project> {
  const client = getApiClient();
  const response = await client.get<ProjectResponse>(`/v1/projects/${projectId}`);
  return response.data.project;
}

export async function createProject(data: CreateProjectInput): Promise<Project> {
  const client = getApiClient();
  const response = await client.post<ProjectResponse>('/v1/projects', data);
  return response.data.project;
}

export async function updateProject(projectId: string, data: UpdateProjectInput): Promise<Project> {
  const client = getApiClient();
  const response = await client.patch<ProjectResponse>(`/v1/projects/${projectId}`, data);
  return response.data.project;
}
