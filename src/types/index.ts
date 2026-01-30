// Configuration types
export interface Config {
  API_BASE_URL: string;
  NET_API_BASE_URL: string;
  API_KEY: string | null;
  defaultProject: string | null;
  context: NetContext;
}

// Net context for storing current IDs
export interface NetContext {
  orgId: string | null;
  postId: string | null;
  channelId: string | null;
  userId: string | null;
}

export type ContextType = 'org' | 'post' | 'channel' | 'user';

// Net User types
export interface NetUserProfile {
  data?: {
    name?: string;
    location?: {
      city?: string;
      country?: string;
    };
    short_bio?: string;
  };
  content?: string;
}

export interface NetUser {
  id: string;
  email?: string;
  profile: NetUserProfile | null;
  created_at: string;
  updated_at?: string;
}

// Net Organization types
export type OrgStatus = 'active' | 'deleted';
export type OrgRole = 'owner' | 'admin' | 'member';

export interface OrgData {
  description?: string;
  website?: string;
}

export interface NetOrg {
  id: string;
  name: string;
  slug: string;
  data: OrgData | null;
  status: OrgStatus;
  role?: OrgRole;
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: string;
  user_id: string;
  user_name?: string;
  role: OrgRole;
  created_at: string;
}

export interface OrgInvite {
  id: string;
  org_id: string;
  org_name?: string;
  org_slug?: string;
  invitee_email?: string;
  inviter_name?: string;
  role: OrgRole;
  status: string;
  expires_at: string;
  created_at: string;
}

export interface OrgJoinRequest {
  id: string;
  org_id: string;
  org_name?: string;
  org_slug?: string;
  user_id?: string;
  user_name?: string;
  message?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

// Net Post types
export type PostStatus = 'active' | 'closed';

export interface NetPost {
  id: string;
  author_id: string;
  org_id: string | null;
  org_name?: string;
  org_status?: OrgStatus;
  title: string;
  short_content?: string;
  long_content?: string;
  data: Record<string, unknown> | null;  // Backend-populated via extraction
  expires_at: string;
  status: PostStatus;
  application_count?: number;
  my_application_status?: ApplicationStatus | null;
  created_at: string;
  updated_at: string;
}

// Net Application types
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface ApplicationData {
  cover_note?: string;
  expected_salary?: number;
  availability?: string;
}

export interface NetApplication {
  id: string;
  post_id: string;
  post_title?: string;
  post_status?: PostStatus;
  applicant_id: string;
  applicant_name?: string;
  data: ApplicationData | null;
  content_md?: string;
  status: ApplicationStatus;
  rejection_reason?: string;
  channel_id?: string | null;
  created_at: string;
  updated_at: string;
}

// Net Channel types
export type ChannelStatus = 'active' | 'archived';

export interface NetChannel {
  id: string;
  application_id?: string | null;
  post_id?: string | null;
  user1_id: string;
  user1_name?: string;
  user2_id: string;
  user2_name?: string;
  context?: string;
  last_message_at?: string | null;
  expires_at: string;
  status: ChannelStatus;
  created_at: string;
}

export interface NetMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name?: string;
  content_md: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

// Net Summary types (for agentic AI)
export interface UnreadMessagesSummary {
  total: number;
  channels: Array<{ channel_id: string; unread_count: number }>;
}

export interface PendingApplicantsSummary {
  total: number;
  posts: Array<{ post_id: string; title: string | null; pending_count: number }>;
}

export interface MyApplicationsSummary {
  pending: { count: number; items: Array<{ application_id: string; post_id: string; title: string | null }> };
  accepted: { count: number; items: Array<{ application_id: string; post_id: string; title: string | null }> };
  rejected: { count: number; items: Array<{ application_id: string; post_id: string; title: string | null }> };
}

export interface OrgInvitesSummary {
  count: number;
  items: Array<{ invite_id: string; org_id: string; org_name: string }>;
}

export interface OrgJoinRequestsSummary {
  count: number;
  items: Array<{ request_id: string; org_id: string; org_name: string; user_id: string; user_name: string | null }>;
}

export interface NetUserSummary {
  unread_messages: UnreadMessagesSummary;
  pending_applicants: PendingApplicantsSummary;
  my_applications: MyApplicationsSummary;
  org_invites: OrgInvitesSummary;
  org_join_requests: OrgJoinRequestsSummary;
}

// Net API Response types
export interface NetApiResponse<T> {
  data: T;
}

export interface NetPaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    skip: number;
    has_more: boolean;
  };
}

export interface BatchActionResult {
  processed: Array<{ application_id: string; action: string; channel_id?: string | null }>;
  failed: Array<{ id: string; error: string }>;
  summary: { total_requested: number; succeeded: number; failed: number };
}

// User types
export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  profileCompleted: boolean;
  createdAt: string | null;
  lastLoginAt: string | null;
}

// Evaluator types
export interface EvaluatorQuestion {
  id: string;
  label: string;
  type: 'text' | 'number';
}

export interface Evaluator {
  prompt: string;
  questions: EvaluatorQuestion[];
}

// Project types
export interface Project {
  id: string;
  name: string;
  description: string;
  prompt: string;
  landingPageTitle: string;
  landingPageInfo: string;
  timeLimitMinutes: number;
  evaluator?: Evaluator;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  prompt: string;
  description?: string;
  landingPageTitle?: string;
  landingPageInfo?: string;
  timeLimitMinutes?: number;
  evaluator?: Evaluator;
}

export interface UpdateProjectInput {
  name: string;
  prompt: string;
  description?: string;
  landingPageTitle?: string;
  landingPageInfo?: string;
  timeLimitMinutes?: number;
  evaluator?: Evaluator | null;
}

// Link types
export type ExpiryPreset = '1_day' | '1_week' | '1_month';
export type LinkStatus = 'active' | 'used' | 'expired' | 'cancelled';

export interface VoiceLink {
  id: string;
  token: string;
  label: string;
  status: LinkStatus;
  sessionId?: string;
  expiryPreset: ExpiryPreset;
  expiresAt: string;
  timeLimitMinutes: number;
  createdAt: string;
  updatedAt: string;
  url?: string;
}

export interface InstantVoiceLink extends VoiceLink {
  prompt: string;
  landingPageTitle: string;
  landingPageInfo: string;
  evaluator?: Evaluator | null;
}

export interface CreateProjectLinksInput {
  labels: string[];
  expiryPreset: ExpiryPreset;
}

export interface CreateInstantLinksInput {
  labels: string[];
  expiryPreset: ExpiryPreset;
  prompt: string;
  landingPageTitle?: string;
  landingPageInfo?: string;
  timeLimitMinutes?: number;
  evaluator?: Evaluator;
}

export interface UpdateInstantLinkInput {
  label?: string;
  expiryPreset?: ExpiryPreset;
  prompt?: string;
  landingPageTitle?: string;
  landingPageInfo?: string;
  timeLimitMinutes?: number;
  evaluator?: Evaluator | null;
}

// Session types
export type SessionType = 'project' | 'instant';

export interface SessionStatus {
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

export interface SessionTranscript {
  sessionId: string;
  transcript: unknown;
}

export interface SessionAudio {
  sessionId: string;
  audioUrl: string;
}

export interface SessionEvaluation {
  sessionId: string;
  type: SessionType;
  projectId?: string;
  evaluationResults: unknown | null;
  evaluatedAt: string | null;
  hasError: boolean;
}

export interface SessionSummary {
  sessionId: string;
  summary?: unknown;
  generating?: boolean;
  workflowId?: string;
  runId?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface ProjectsListResponse {
  success: boolean;
  projects: Project[];
}

export interface ProjectResponse {
  success: boolean;
  project: Project;
}

export interface LinksListResponse {
  success: boolean;
  links: VoiceLink[] | InstantVoiceLink[];
}

export interface LinksCreateResponse {
  success: boolean;
  links: VoiceLink[] | InstantVoiceLink[];
}
