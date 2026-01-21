# Nimrobo CLI Usage Guide

This guide covers common workflows for the Nimrobo CLI.

## Prerequisites

1. **Install and build the CLI:**
   ```bash
   npm install
   npm run build
   npm link
   ```

2. **Authenticate with your API key:**
   ```bash
   nimrobo login
   # Enter your API key when prompted (starts with api_...)
   ```

3. **Verify authentication:**
   ```bash
   nimrobo status
   ```

---

## Workflow 1: Get Session Details for a Project Session

This workflow walks through the complete path from finding your project to retrieving session details.

### Step 1: List Your Projects

First, view all your projects to find the project ID:

```bash
nimrobo projects list
```

**Example output:**
```
Your Projects:

┌─────────────────────┬─────────────────────────┬────────────┬─────────────────────┐
│ ID                  │ Name                    │ Time Limit │ Created             │
├─────────────────────┼─────────────────────────┼────────────┼─────────────────────┤
│ proj_abc123         │ Engineering Interview   │ 15 min     │ 2024-01-15 10:30 AM │
│ proj_def456         │ Customer Research       │ 10 min     │ 2024-01-10 02:15 PM │
│ proj_ghi789         │ Sales Screening         │ 5 min      │ 2024-01-05 09:00 AM │
└─────────────────────┴─────────────────────────┴────────────┴─────────────────────┘
```

Note the **project ID** (e.g., `proj_abc123`) for the project you want to examine.

### Step 2: (Optional) Set as Default Project

If you'll be working with this project frequently, set it as your default:

```bash
nimrobo projects use proj_abc123
```

Now you can use `default` instead of the project ID in subsequent commands.

### Step 3: View Project Details

Get full details about the project:

```bash
nimrobo projects get proj_abc123
```

This shows the project configuration including prompt, time limits, and evaluator settings.

### Step 4: List Project Links to Find Sessions

List all voice links for the project. Links that have been used will show a **session ID**:

```bash
nimrobo links list -p proj_abc123
```

**Example output:**
```
Links for project proj_abc123:

┌─────────────────────┬──────────────┬──────────┬─────────────────────┬─────────────────────┐
│ ID                  │ Label        │ Status   │ Session ID          │ Expires             │
├─────────────────────┼──────────────┼──────────┼─────────────────────┼─────────────────────┤
│ link_111            │ Candidate A  │ used     │ sess_aaa111         │ 2024-01-22          │
│ link_222            │ Candidate B  │ used     │ sess_bbb222         │ 2024-01-22          │
│ link_333            │ Candidate C  │ active   │ -                   │ 2024-01-22          │
│ link_444            │ Candidate D  │ expired  │ -                   │ 2024-01-15          │
└─────────────────────┴──────────────┴──────────┴─────────────────────┴─────────────────────┘
```

**Link statuses:**
- `active` - Link hasn't been used yet
- `used` - Link was used; session ID available
- `expired` - Link expired before being used
- `cancelled` - Link was manually cancelled

Note the **session ID** (e.g., `sess_aaa111`) from a `used` link.

### Step 5: Get Session Status

Now retrieve the session details using both the session ID and project ID:

```bash
nimrobo sessions status sess_aaa111 -t project -p proj_abc123
```

**Example output:**
```
Session Status:

  Session ID:    sess_aaa111
  Type:          project
  Project ID:    proj_abc123
  Status:        completed
  Agent ID:      agent_xyz
  Created:       2024-01-16 10:30:00 AM
  Updated:       2024-01-16 10:45:00 AM
  Completed:     2024-01-16 10:44:32 AM
```

**Session statuses:**
- `in_progress` - Session is currently active
- `completed` - Session finished successfully
- Other statuses may indicate errors or special states

### Step 6: Get Session Transcript

Retrieve the full conversation transcript:

```bash
nimrobo sessions transcript sess_aaa111 -t project -p proj_abc123
```

Returns the JSON transcript of the entire conversation between the AI agent and the candidate.

### Step 7: Get Session Audio

Get a downloadable URL for the session recording:

```bash
nimrobo sessions audio sess_aaa111 -t project -p proj_abc123
```

**Example output:**
```
Session Audio:

  Session ID:  sess_aaa111
  Audio URL:   https://storage.example.com/sessions/sess_aaa111/conversation.wav?token=...

Note: URL expires in approximately 1 hour.
```

### Step 8: Get Session Evaluation Results

If the project has an evaluator configured, retrieve the evaluation:

```bash
nimrobo sessions evaluation sess_aaa111 -t project -p proj_abc123
```

**Note:** Evaluation results are only available after the session is `completed`. If you call this before completion, `evaluationResults` will be `null`.

### Step 9: Get Session Summary

Retrieve or generate an AI summary of the session:

```bash
nimrobo sessions summary sess_aaa111 -p proj_abc123
```

**If summary exists (200 response):**
```
Session Summary:

  Session ID:  sess_aaa111
  Summary:     [Full summary content displayed]
```

**If summary needs generation (202 response):**
```
Summary generation started:

  Session ID:   sess_aaa111
  Workflow ID:  wf_abc123
  Run ID:       run_xyz789

Summary is being generated. Run this command again to check status.
```

### Complete Example: End-to-End Flow

```bash
# 1. List projects
nimrobo projects list

# 2. Set default project (optional)
nimrobo projects use proj_abc123

# 3. List links to find sessions
nimrobo links list -p default

# 4. Get session details (using default project)
nimrobo sessions status sess_aaa111 -t project -p default
nimrobo sessions transcript sess_aaa111 -t project -p default
nimrobo sessions audio sess_aaa111 -t project -p default
nimrobo sessions evaluation sess_aaa111 -t project -p default
nimrobo sessions summary sess_aaa111 -p default
```

### JSON Output for Scripting

Add `--json` for machine-readable output at any step:

```bash
nimrobo links list -p proj_abc123 --json
nimrobo sessions status sess_aaa111 -t project -p proj_abc123 --json
```

---

## Workflow 2: Get Session Details for an Instant Link Session

Instant links are projectless voice sessions. To retrieve session details:

### Get Session Status

```bash
nimrobo sessions status <session-id> -t instant
```

**Example:**
```bash
nimrobo sessions status sess_abc123 -t instant
```

### Get Session Transcript

```bash
nimrobo sessions transcript <session-id> -t instant
```

### Get Session Audio URL

```bash
nimrobo sessions audio <session-id> -t instant
```

### Get Session Evaluation Results

```bash
nimrobo sessions evaluation <session-id> -t instant
```

### Get Session Summary

```bash
nimrobo sessions summary <session-id> -i
```

The `-i` or `--instant` flag indicates this is an instant link session.

---

## Workflow 3: Create a Project

Projects are containers for voice interviews with shared configuration (prompt, time limits, evaluator).

### Option A: Interactive Creation

```bash
nimrobo projects create
```

You'll be prompted for:
- Project name
- AI prompt (the instructions for the voice agent)

### Option B: Using Command Flags

```bash
nimrobo projects create \
  -n "Engineering Interview" \
  -p "You are conducting a technical interview for a senior software engineer position. Ask about system design, coding practices, and past experiences." \
  -d "Technical screening for backend engineers" \
  --landing-title "Welcome to Your Interview" \
  --landing-info "This interview will take approximately 15 minutes." \
  -t 15
```

**Flags:**
| Flag | Description |
|------|-------------|
| `-n, --name` | Project name (required) |
| `-p, --prompt` | AI prompt for the voice agent (required) |
| `-d, --description` | Project description |
| `--landing-title` | Title shown on the voice link landing page |
| `--landing-info` | Info text shown on the landing page |
| `-t, --time-limit` | Session time limit in minutes (default: 5) |

### Option C: Using a JSON File

Create a JSON file (e.g., `project.json`):

```json
{
  "name": "Engineering Interview",
  "prompt": "You are conducting a technical interview for a senior software engineer position. Ask about system design, coding practices, and past experiences.",
  "description": "Technical screening for backend engineers",
  "landingPageTitle": "Welcome to Your Interview",
  "landingPageInfo": "This interview will take approximately 15 minutes.",
  "timeLimitMinutes": 15
}
```

Then run:
```bash
nimrobo projects create -f project.json
```

### Verify Project Creation

```bash
nimrobo projects list
```

Or get details of a specific project:
```bash
nimrobo projects get <project-id>
```

---

## Workflow 4: Create Project Links

Project links are shareable voice session URLs tied to a specific project. Each link can be used once.

### Set a Default Project (Optional)

To avoid specifying the project ID repeatedly:
```bash
nimrobo projects use <project-id>
```

### Create Links with Command Flags

```bash
nimrobo links create \
  -p <project-id> \
  -l "Candidate A,Candidate B,Candidate C" \
  -e 1_week
```

Or using the default project:
```bash
nimrobo links create \
  -p default \
  -l "Candidate A,Candidate B,Candidate C" \
  -e 1_week
```

**Flags:**
| Flag | Description |
|------|-------------|
| `-p, --project` | Project ID or "default" (required) |
| `-l, --labels` | Comma-separated labels for each link |
| `-e, --expiry` | Expiry preset: `1_day`, `1_week`, or `1_month` |

### Create Links from a JSON File

Create a JSON file (e.g., `links.json`):

```json
{
  "labels": ["Candidate A", "Candidate B", "Candidate C"],
  "expiryPreset": "1_week"
}
```

Then run:
```bash
nimrobo links create -p <project-id> -f links.json
```

### Output

The command outputs the created links with their shareable URLs:
```
Links created successfully!

Links:
  - Candidate A: https://app.nimroboai.com/link/abc123
  - Candidate B: https://app.nimroboai.com/link/def456
  - Candidate C: https://app.nimroboai.com/link/ghi789
```

### List Project Links

```bash
nimrobo links list -p <project-id>
```

This shows all links for the project with their status (`active`, `used`, `expired`, `cancelled`).

### Cancel a Link

To cancel an active link:
```bash
nimrobo links cancel <link-id> -p <project-id>
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Login | `nimrobo login` |
| Check status | `nimrobo status` |
| List projects | `nimrobo projects list` |
| Create project | `nimrobo projects create -n "Name" -p "Prompt"` |
| Get project | `nimrobo projects get <project-id>` |
| Set default project | `nimrobo projects use <project-id>` |
| Create project links | `nimrobo links create -p <project-id> -l "Label1,Label2" -e 1_week` |
| List project links | `nimrobo links list -p <project-id>` |
| Cancel project link | `nimrobo links cancel <link-id> -p <project-id>` |
| Session status (project) | `nimrobo sessions status <session-id> -t project -p <project-id>` |
| Session status (instant) | `nimrobo sessions status <session-id> -t instant` |
| Session transcript | `nimrobo sessions transcript <session-id> -t <type> [-p <project-id>]` |
| Session audio | `nimrobo sessions audio <session-id> -t <type> [-p <project-id>]` |
| Session evaluation | `nimrobo sessions evaluation <session-id> -t <type> [-p <project-id>]` |

---

## JSON Output

Add `--json` flag to any command for machine-readable JSON output:

```bash
nimrobo projects list --json
nimrobo sessions status <session-id> -t project -p <project-id> --json
```
