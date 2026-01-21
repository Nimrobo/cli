# Integration API Reference (v1)

This document describes the **v1 Integration APIs** implemented

## Authentication

- **Header**: `Authorization: Bearer api_...`
- `middleware.ts` validates the token and injects trusted headers (`x-user-id`, `x-api-token`, `x-api-scope`) for the route handlers.
- All endpoints below are **API-token only** (they call `requireApiTokenAuth(...)`).


---

## 1) Get authenticated user profile

### API

`GET /v1/user/profile` (implemented as `GET /api/v1/user/profile`)

### Purpose

Get the authenticated user profile.

### Input params

- **Headers**
  - `Authorization: Bearer api_...` (required)
- **Required scope**: `user:read`

### Output params

**200**

- **`id`**: string — user id
- **`email`**: string | undefined — user email (if present)
- **`name`**: string | undefined — user display name (if present)
- **`profileCompleted`**: boolean — onboarding completion flag
- **`createdAt`**: string | null — ISO timestamp (when available)
- **`lastLoginAt`**: string | null — ISO timestamp (when available)

**Errors**

- **404**: `{ "error": "User not found" }`
- **401/403/500**: `{ "error": string }`

---

## 2) List all projects

### API

`GET /v1/projects` (implemented as `GET /api/v1/projects`)

### Purpose

List all projects for the authenticated user.

### Input params

- **Headers**
  - `Authorization: Bearer api_...` (required)
- **Required scope**: `projects:read`

### Output params

**200**

- **`success`**: boolean
- **`projects`**: array — list of project objects (`{ id, ...projectData }`)
  - **`id`**: string — project id
  - **`name`**: string
  - **`description`**: string
  - **`prompt`**: string
  - **`landingPageTitle`**: string
  - **`landingPageInfo`**: string
  - **`timeLimitMinutes`**: number (defaults to `5` if missing)
  - **`evaluator`**: object | undefined — evaluator config (if present)
  - **`createdAt`**: string | any — ISO string when possible
  - **`updatedAt`**: string | any — ISO string when possible

**Errors**

- **500**: `{ "error": string }`

---

## 3) Create a new project

### API

`POST /v1/projects` (implemented as `POST /api/v1/projects`)

### Purpose

Create a new project.

### Input params

- **Headers**
  - `Authorization: Bearer api_...` (required)
  - `Content-Type: application/json` (required)
- **Required scope**: `projects:write`
- **Body**
  - **`name`**: string (required)
  - **`prompt`**: string (required)
  - **`description`**: string (optional; defaults to `""`)
  - **`landingPageTitle`**: string (optional; defaults to `""`)
  - **`landingPageInfo`**: string (optional; defaults to `""`)
  - **`timeLimitMinutes`**: number (optional; defaults to `5`)
  - **`evaluator`**: object (optional)
    - **`prompt`**: string (required if evaluator provided)
    - **`questions`**: array (required if evaluator provided)
      - each question: `{ id: string, label: string, type: "text" | "number" }`

### Output params

**200**

- **`success`**: boolean
- **`project`**: object — created project (includes ISO `createdAt`/`updatedAt`)

**Errors**

- **400**: `{ "error": "Name and prompt are required" | "Invalid evaluator format" | "Invalid evaluator question format" }`
- **500**: `{ "error": string }`

---

## 4) Get details of a single project

### API

`GET /v1/projects/{projectId}` (implemented as `GET /api/v1/projects/{projectId}`)

### Purpose

Get one project’s details.

### Input params

- **Headers**
  - `Authorization: Bearer api_...` (required)
- **Required scope**: `projects:read`
- **Path params**
  - **`projectId`**: string (required)

### Output params

**200**

- **`success`**: boolean
- **`project`**: object — project details (includes ISO dates when possible)

**Errors**

- **404**: `{ "error": "Project not found" }`
- **500**: `{ "error": string }`

---

## 5) Update project metadata

### API

`PATCH /v1/projects/{projectId}` (implemented as `PATCH /api/v1/projects/{projectId}`)

### Purpose

Update project fields.

### Input params

- **Headers**
  - `Authorization: Bearer api_...` (required)
  - `Content-Type: application/json` (required)
- **Required scope**: `projects:write`
- **Path params**
  - **`projectId`**: string (required)
- **Body**
  - **`name`**: string (required)
  - **`prompt`**: string (required)
  - **`description`**: string (optional)
  - **`landingPageTitle`**: string (optional)
  - **`landingPageInfo`**: string (optional)
  - **`timeLimitMinutes`**: number (optional)
  - **`evaluator`**: object | null (optional)
    - object format matches project creation (`{ prompt, questions[] }`)
    - `null` removes evaluator

### Output params

**200**

- **`success`**: boolean
- **`project`**: object — updated project

**Errors**

- **400**: `{ "error": "Name and prompt are required" | "Invalid evaluator format" | "Invalid evaluator question format" }`
- **404**: `{ "error": "Project not found" }`
- **500**: `{ "error": string }`

---

## 6) List all voice links under a project

### API

`GET /v1/projects/{projectId}/links` (implemented as `GET /api/v1/projects/{projectId}/links`)

### Purpose

List all project links for a project.

### Input params

- **Headers**
  - `Authorization: Bearer api_...` (required)
- **Required scope**: `projects:read`
- **Path params**
  - **`projectId`**: string (required)

### Output params

**200**

- **`success`**: boolean
- **`links`**: array — each link is `{ id, token, label, status, sessionId?, expiryPreset, expiresAt, timeLimitMinutes, createdAt, updatedAt, ... }` (additional stored fields may be present)
  - **`sessionId`**: string | undefined — the session ID associated with this link; **only present when `status` is `"used"`**. Use this ID to fetch session details (status, transcript, audio, evaluation, summary).

### Link `status` values (applies to both project + instant links)

The `status` field is currently one of:

- **`"active"`**: Link is usable (not yet used/cancelled/expired)
- **`"used"`**: Link has been consumed (a session has been started for this link); **`sessionId` will be present**
- **`"expired"`**: Link is no longer usable because `expiresAt` has passed (may be set when a client attempts to start a session after expiry)
- **`"cancelled"`**: Link was manually cancelled

Other string values may exist (legacy/internal). Treat any unknown `status` as **not active**.

**Errors**

- **500**: `{ "error": string }`

---

## 7) Create one or more project-based voice links

### API

`POST /v1/projects/{projectId}/links` (implemented as `POST /api/v1/projects/{projectId}/links`)

### Purpose

Create multiple links for a project.

### Input params

- **Headers**
  - `Authorization: Bearer api_...` (required)
  - `Content-Type: application/json` (required)
- **Required scope**: `projects:write`
- **Path params**
  - **`projectId`**: string (required)
- **Body**
  - **`labels`**: string[] (required; 1+)
  - **`expiryPreset`**: `"1_day" | "1_week" | "1_month"` (required)

### Output params

**200**

- **`success`**: boolean
- **`links`**: array — created links
  - Each includes stored fields plus:
    - **`url`**: string — computed as `${NEXT_PUBLIC_APP_URL}/link/{token}` (falls back to `http://localhost:3000`)

**Errors**

- **400**: `{ "error": "Labels array is required" | "Invalid expiry preset" }`
- **404**: `{ "error": "Project not found" }`
- **500**: `{ "error": string }`

---

## 8) Cancel an active project voice link

### API

**Implemented as:**

`POST /v1/projects/links/{linkId}/cancel?projectId=...` (implemented as `POST /api/v1/projects/links/{linkId}/cancel?projectId=...`)

> Note: This differs from the earlier spec shape `POST /v1/projects/{projectId}/links/{linkId}/cancel`. The current code requires `projectId` as a **query parameter** and `linkId` as a **path param**.

### Purpose

Cancel an active project link (sets `status = "cancelled"`).

### Input params

- **Headers**
  - `Authorization: Bearer api_...` (required)
- **Required scope**: `projects:write`
- **Path params**
  - **`linkId`**: string (required)
- **Query params**
  - **`projectId`**: string (required)

### Output params

**200**

- **`success`**: boolean
- **`message`**: string (`"Link cancelled successfully"`)

**Errors**

- **400**: `{ "error": "projectId is required" | "Cannot cancel link with status: ..." }`
- **404**: `{ "error": "Link not found" }`
- **500**: `{ "error": string }`

---

## 9) List instant (projectless) voice links

### API

`GET /v1/instant-voice-links` (implemented as `GET /api/v1/instant-voice-links`)

### Purpose

List instant (projectless) voice links for the authenticated user.

### Input params

- **Headers**
  - `Authorization: Bearer api_...` (required)
- **Required scope**: `voice_links:read`

### Output params

**200**

- **`success`**: boolean
- **`links`**: array — each link is `{ id, token, label, status, sessionId?, expiryPreset, expiresAt, timeLimitMinutes, prompt, landingPageTitle, landingPageInfo, evaluator?, createdAt, updatedAt, ... }` (additional stored fields may be present)
  - **`sessionId`**: string | undefined — the session ID associated with this link; **only present when `status` is `"used"`**. Use this ID to fetch session details (status, transcript, audio, evaluation, summary).
  - **`evaluator`**: object | null | undefined — evaluator config (if present)
    - **`prompt`**: string
    - **`questions`**: array — each: `{ id: string, label: string, type: "text" | "number" }`

### Link `status` values

The `status` field is currently one of:

- **`"active"`**: Link is usable (not yet used/cancelled/expired)
- **`"used"`**: Link has been consumed (a session has been started for this link); **`sessionId` will be present**
- **`"expired"`**: Link is no longer usable because `expiresAt` has passed (may be set when a client attempts to start a session after expiry)
- **`"cancelled"`**: Link was manually cancelled

Other string values may exist (legacy/internal). Treat any unknown `status` as **not active**.

**Errors**

- **500**: `{ "error": string }`

---

## 10) Create instant voice links

### API

`POST /v1/instant-voice-links` (implemented as `POST /api/v1/instant-voice-links`)

### Purpose

Create multiple instant (projectless) voice links.

### Input params

- **Headers**
  - `Authorization: Bearer api_...` (required)
  - `Content-Type: application/json` (required)
- **Required scope**: `voice_links:write`
- **Body**
  - **`labels`**: string[] (required; 1+)
  - **`expiryPreset`**: `"1_day" | "1_week" | "1_month"` (required)
  - **`prompt`**: string (required)
  - **`landingPageTitle`**: string (optional; defaults to `""`)
  - **`landingPageInfo`**: string (optional; defaults to `""`)
  - **`timeLimitMinutes`**: number (optional; defaults to `5`, clamped to `1..60`)
  - **`evaluator`**: object (optional)
    - **`prompt`**: string (required if evaluator provided)
    - **`questions`**: array (required if evaluator provided)
      - each question: `{ id: string, label: string, type: "text" | "number" }`

### Output params

**200**

- **`success`**: boolean
- **`links`**: array — created links (includes ISO `createdAt`/`updatedAt`/`expiresAt`)

**Errors**

- **400**: `{ "error": "Labels array is required" | "Invalid expiry preset" | "Prompt is required" | "All labels must be non-empty strings" | "Invalid evaluator format" | "Invalid evaluator question format" }`
- **500**: `{ "error": string }`

---

## 11) Update an instant voice link

### API

`PATCH /v1/instant-voice-links/{linkId}` (implemented as `PATCH /api/v1/instant-voice-links/{linkId}`)

### Purpose

Edit an existing instant link (label/expiry/prompt/landing page metadata).

### Input params

- **Headers**
  - `Authorization: Bearer api_...` (required)
  - `Content-Type: application/json` (required)
- **Required scope**: `voice_links:write`
- **Path params**
  - **`linkId`**: string (required)
- **Body** (any of)
  - **`label`**: string
  - **`expiryPreset`**: `"1_day" | "1_week" | "1_month"`
  - **`prompt`**: string
  - **`landingPageTitle`**: string
  - **`landingPageInfo`**: string
  - **`timeLimitMinutes`**: number (clamped to `1..60`)
  - **`evaluator`**: object | null
    - object format matches instant link creation (`{ prompt, questions[] }`)
    - `null` removes evaluator

### Output params

**200**

- **`success`**: boolean

**Errors**

- **400**: `{ "error": "Only active links can be edited" | "Label must be a non-empty string" | "Invalid expiry preset" | "Prompt must be a non-empty string" | "landingPageTitle must be a string" | "landingPageInfo must be a string" | "timeLimitMinutes must be a positive number" | "Invalid evaluator format" | "Invalid evaluator question format" }`
- **404**: `{ "error": "Link not found" }`
- **500**: `{ "error": string }`

---

## 12) Fetch or trigger generation of a session summary

### API

`GET /v1/sessions/summary?sessionId=...` (implemented as `GET /api/v1/sessions/summary?...`)

### Purpose

Fetch cached session summary if it exists; otherwise start generation and return **202**.

### Input params

- **Headers**
  - `Authorization: Bearer api_...` (required)
- **Required scope**: `sessions:read`
- **Query params**
  - **`sessionId`**: string (required)
  - **`projectId`**: string (optional; used for project sessions)
  - **`instant_voice_links`**: `"1" | "true" | "yes"` (optional; set for instant-link sessions)

### Output params

**200** (summary exists)

- **`success`**: boolean (`true`)
- **`sessionId`**: string
- **`summary`**: any (JSON loaded from `sessions/{sessionId}/summary.json`)

**202** (generation started)

- **`success`**: boolean (`false`)
- **`sessionId`**: string
- **`generating`**: boolean (`true`)
- **`workflowId`**: string
- **`runId`**: string

**Errors**

- **400**: `{ "error": "sessionId is required" }`
- **403/404/500**: `{ "error": string }`

---

## 13) Force regeneration of a session summary

### API

`POST /v1/sessions/summary/regenerate` (implemented as `POST /api/v1/sessions/summary/regenerate`)

### Purpose

Force regeneration of a session summary (starts workflow; returns **202**).

### Input params

- **Headers**
  - `Authorization: Bearer api_...` (required)
  - `Content-Type: application/json` (required)
- **Required scope**: `sessions:write`
- **Body**
  - **`sessionId`**: string (required)
  - **`projectId`**: string (optional)
  - **`instant_voice_links`**: boolean (optional)

### Output params

**202**

- **`success`**: boolean (`true`)
- **`sessionId`**: string
- **`workflowId`**: string
- **`runId`**: string

**Errors**

- **400**: `{ "error": "sessionId is required" }`
- **403/404/500**: `{ "error": string }`

---

## 14) Get session status (project or instant)

### API

`GET /v1/session/status?sessionId=...&type=project|instant&projectId=...` (implemented as `GET /api/v1/session/status?...`)

### Purpose

Get session status payload for a session owned by the authenticated user.

### Input params

- **Headers**
  - `Authorization: Bearer api_...` (required)
- **Required scope**: `sessions:read`
- **Query params**
  - **`sessionId`**: string (required)
  - **`type`**: `"project" | "instant"` (required)
  - **`projectId`**: string (required if `type=project`)

### Output params

**200**

- **`success`**: boolean (`true`)
- **`sessionId`**: string
- **`type`**: `"project" | "instant"`
- **`projectId`**: string | undefined
- **`status`**: any — stored session status field
- **`agentId`**: any — stored agent id field
- **`wsUrl`**: any — stored websocket URL field
- **`createdAt`**: string | undefined — ISO when possible
- **`updatedAt`**: string | undefined — ISO when possible
- **`completedAt`**: string | undefined — ISO when possible

**Errors**

- **400**: `{ "error": "sessionId is required" | "type must be \"project\" or \"instant\"" | "projectId is required when type=project" }`
- **404**: `{ "error": "Session not found" }`
- **500**: `{ "error": string }`

---

## 15) Get session transcript (project or instant)

### API

`GET /v1/session/transcript?sessionId=...&type=project|instant&projectId=...` (implemented as `GET /api/v1/session/transcript?...`)

### Purpose

Fetch the transcript JSON for a session (`sessions/{sessionId}/conversation.json`).

### Input params

- **Headers**
  - `Authorization: Bearer api_...` (required)
- **Required scope**: `sessions:read`
- **Query params**
  - **`sessionId`**: string (required)
  - **`type`**: `"project" | "instant"` (required)
  - **`projectId`**: string (required if `type=project`)

### Output params

**200**

- **`success`**: boolean (`true`)
- **`sessionId`**: string
- **`transcript`**: any — parsed JSON from `conversation.json`

**Errors**

- **400**: `{ "error": string }` (invalid query)
- **404**: `{ "error": "Session not found" | "conversation.json not found for session ..." }`
- **500**: `{ "error": string }`

---

## 16) Get session audio (project or instant)

### API

`GET /v1/session/audio?sessionId=...&type=project|instant&projectId=...` (implemented as `GET /api/v1/session/audio?...`)

### Purpose

Get a signed URL for the session audio (`sessions/{sessionId}/conversation.wav`).

### Input params

- **Headers**
  - `Authorization: Bearer api_...` (required)
- **Required scope**: `sessions:read`
- **Query params**
  - **`sessionId`**: string (required)
  - **`type`**: `"project" | "instant"` (required)
  - **`projectId`**: string (required if `type=project`)

### Output params

**200**

- **`success`**: boolean (`true`)
- **`sessionId`**: string
- **`audioUrl`**: string — signed URL (expires in ~1 hour)

**Errors**

- **400**: `{ "error": string }` (invalid query)
- **404**: `{ "error": "Session not found" | "Audio file not found for session ..." }`
- **500**: `{ "error": string }`

---

## 17) Get session evaluation results (project or instant)

### API

`GET /v1/session/evaluation?sessionId=...&type=project|instant&projectId=...`

### Purpose

Fetch the stored evaluation results for a session (if/when they exist).

Important: this endpoint **does not trigger evaluation generation**. It only returns whatever is already stored on the session doc.

### When to call this

- Use `GET /v1/session/status` to check the session `status`.
- Once `status` indicates the session is **completed**, call this endpoint to fetch `evaluationResults`.

### What happens if you call this before the session is complete?

You’ll get a **200** response with:
- `evaluationResults: null`
- `evaluatedAt: null`
- `hasError: false`

This is expected because evaluation results are typically written asynchronously after completion (and may never be present if evaluation isn’t configured for that session type).

### Input params

- **Headers**
  - `Authorization: Bearer api_...` (required)
- **Required scope**: `sessions:read`
- **Query params**
  - **`sessionId`**: string (required)
  - **`type`**: `"project" | "instant"` (required)
  - **`projectId`**: string (required if `type=project`)

### Output params

**200**

- **`success`**: boolean (`true`)
- **`sessionId`**: string
- **`type`**: `"project" | "instant"`
- **`projectId`**: string | undefined
- **`evaluationResults`**: any | null — stored evaluation results; `null` if not yet evaluated or if an error occurred
- **`evaluatedAt`**: string | null — ISO timestamp when evaluation completed; `null` if not evaluated
- **`hasError`**: boolean — `true` if evaluation failed; `false` otherwise

**Errors**

- **400**: `{ "error": string }` (invalid query)
- **404**: `{ "error": "Session not found" }`
- **500**: `{ "error": string }`


----
build pattern 

for interview-style = for each role create a separate voice project and for each candidate generate links
for customer research sytle = create one voice project for 1 research. then voice link for each interview 

----
prompt for any voice link be structured as :

Goal 
Role
Guidelines
Constrains 
----
Always include the following in config.js
'''
API_BASE_URL="https://app.nimroboai.com/api"
API_KEY="user's key"
'''
