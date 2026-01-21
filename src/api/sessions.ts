import { getApiClient } from './client';
import {
  SessionStatus,
  SessionTranscript,
  SessionAudio,
  SessionEvaluation,
  SessionSummary,
  SessionType,
} from '../types';

interface SessionStatusResponse {
  success: boolean;
  sessionId: string;
  type: SessionType;
  projectId?: string;
  status: string;
  agentId?: string;
  wsUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

interface SessionTranscriptResponse {
  success: boolean;
  sessionId: string;
  transcript: unknown;
}

interface SessionAudioResponse {
  success: boolean;
  sessionId: string;
  audioUrl: string;
}

interface SessionEvaluationResponse {
  success: boolean;
  sessionId: string;
  type: SessionType;
  projectId?: string;
  evaluationResults: unknown | null;
  evaluatedAt: string | null;
  hasError: boolean;
}

interface SessionSummaryResponse {
  success: boolean;
  sessionId: string;
  summary?: unknown;
  generating?: boolean;
  workflowId?: string;
  runId?: string;
}

export async function getSessionStatus(
  sessionId: string,
  type: SessionType,
  projectId?: string
): Promise<SessionStatus> {
  const client = getApiClient();
  const params: Record<string, string> = { sessionId, type };
  if (projectId) {
    params.projectId = projectId;
  }

  const response = await client.get<SessionStatusResponse>('/v1/session/status', { params });
  return {
    sessionId: response.data.sessionId,
    type: response.data.type,
    projectId: response.data.projectId,
    status: response.data.status,
    agentId: response.data.agentId,
    wsUrl: response.data.wsUrl,
    createdAt: response.data.createdAt,
    updatedAt: response.data.updatedAt,
    completedAt: response.data.completedAt,
  };
}

export async function getSessionTranscript(
  sessionId: string,
  type: SessionType,
  projectId?: string
): Promise<SessionTranscript> {
  const client = getApiClient();
  const params: Record<string, string> = { sessionId, type };
  if (projectId) {
    params.projectId = projectId;
  }

  const response = await client.get<SessionTranscriptResponse>('/v1/session/transcript', { params });
  return {
    sessionId: response.data.sessionId,
    transcript: response.data.transcript,
  };
}

export async function getSessionAudio(
  sessionId: string,
  type: SessionType,
  projectId?: string
): Promise<SessionAudio> {
  const client = getApiClient();
  const params: Record<string, string> = { sessionId, type };
  if (projectId) {
    params.projectId = projectId;
  }

  const response = await client.get<SessionAudioResponse>('/v1/session/audio', { params });
  return {
    sessionId: response.data.sessionId,
    audioUrl: response.data.audioUrl,
  };
}

export async function getSessionEvaluation(
  sessionId: string,
  type: SessionType,
  projectId?: string
): Promise<SessionEvaluation> {
  const client = getApiClient();
  const params: Record<string, string> = { sessionId, type };
  if (projectId) {
    params.projectId = projectId;
  }

  const response = await client.get<SessionEvaluationResponse>('/v1/session/evaluation', { params });
  return {
    sessionId: response.data.sessionId,
    type: response.data.type,
    projectId: response.data.projectId,
    evaluationResults: response.data.evaluationResults,
    evaluatedAt: response.data.evaluatedAt,
    hasError: response.data.hasError,
  };
}

export async function getSessionSummary(
  sessionId: string,
  projectId?: string,
  isInstant?: boolean
): Promise<SessionSummary> {
  const client = getApiClient();
  const params: Record<string, string> = { sessionId };
  if (projectId) {
    params.projectId = projectId;
  }
  if (isInstant) {
    params.instant_voice_links = '1';
  }

  const response = await client.get<SessionSummaryResponse>('/v1/sessions/summary', { params });
  return {
    sessionId: response.data.sessionId,
    summary: response.data.summary,
    generating: response.data.generating,
    workflowId: response.data.workflowId,
    runId: response.data.runId,
  };
}

export async function regenerateSessionSummary(
  sessionId: string,
  projectId?: string,
  isInstant?: boolean
): Promise<SessionSummary> {
  const client = getApiClient();
  const body: Record<string, unknown> = { sessionId };
  if (projectId) {
    body.projectId = projectId;
  }
  if (isInstant) {
    body.instant_voice_links = true;
  }

  const response = await client.post<SessionSummaryResponse>('/v1/sessions/summary/regenerate', body);
  return {
    sessionId: response.data.sessionId,
    workflowId: response.data.workflowId,
    runId: response.data.runId,
  };
}
