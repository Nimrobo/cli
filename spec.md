# Nimrobo CLI Specification

## Overview

A command-line tool for interacting with Nimrobo AI APIs. Nimrobo is a voice-first AI platform for running interviews, screening, and diagnostic conversations via shareable voice-links.

## Installation

```bash
npm install -g nimrobo-cli
```

## Authentication

### Login Command

```bash
nimrobo login
```

Prompts user for their API key and saves it to `~/.nimrobo/config.json`.

**Flow:**
1. Prompt: "Enter your Nimrobo API key:"
2. Validate the key by calling `GET /v1/user/profile`
3. On success: Save to config and display "Logged in as {name} ({email})"
4. On failure: Display error with suggestion to check the key

### Logout Command

```bash
nimrobo logout
```

Removes stored credentials from config file.

---

## Configuration

**Config file location:** `~/.nimrobo/config.json`

```json
{
  "API_BASE_URL": "https://app.nimroboai.com/api",
  "API_KEY": "api_...",
  "defaultProject": null
}
```

---

## Global Flags

| Flag | Description |
|------|-------------|
| `--json` | Output in JSON format (default: human-readable) |
| `--help` | Show help for command |
| `--version` | Show CLI version |

---

## Commands

### Status

```bash
nimrobo status
```

Displays current authentication status, user info, and default project (if set).

**Output:**
```
✓ Authenticated as John Doe (john@example.com)
  Default project: my-interview-project (proj_abc123)
  API: https://app.nimroboai.com/api
```

---

### User Commands

#### Get Profile

```bash
nimrobo user profile
```

Displays authenticated user's profile information.

---

### Project Commands

#### List Projects

```bash
nimrobo projects list
```

Lists all projects for the authenticated user.

#### Create Project

```bash
nimrobo projects create
```

**Input options:**

1. **Via flags:**
```bash
nimrobo projects create --name "Interview" --prompt "You are an interviewer..."
```

2. **Via JSON file:**
```bash
nimrobo projects create --file ./project.json
```

3. **Interactive mode:** Prompts for required fields if no flags or file provided.

**Flags:**
| Flag | Required | Description |
|------|----------|-------------|
| `--file` | No | Path to JSON file with project data |
| `--name` | Yes* | Project name (*required if no --file) |
| `--prompt` | Yes* | AI prompt for the voice agent (*required if no --file) |
| `--description` | No | Project description |
| `--landing-title` | No | Landing page title |
| `--landing-info` | No | Landing page info text |
| `--time-limit` | No | Time limit in minutes (default: 5) |

**JSON file format (project.json):**
```json
{
  "name": "Senior Engineer Interview",
  "prompt": "You are conducting a technical interview...",
  "description": "Interview for senior engineering role",
  "landingPageTitle": "Welcome to your interview",
  "landingPageInfo": "Please ensure you have a quiet environment.",
  "timeLimitMinutes": 30,
  "evaluator": {
    "prompt": "Evaluate the candidate on the following criteria...",
    "questions": [
      { "id": "technical", "label": "Technical Skills", "type": "number" },
      { "id": "communication", "label": "Communication", "type": "number" },
      { "id": "notes", "label": "Additional Notes", "type": "text" }
    ]
  }
}
```

#### Get Project

```bash
nimrobo projects get <project-id>
```

Displays details for a specific project.

#### Update Project

```bash
nimrobo projects update <project-id>
```

**Input options:**

1. **Via flags:**
```bash
nimrobo projects update proj_abc --name "Updated Name"
```

2. **Via JSON file:**
```bash
nimrobo projects update proj_abc --file ./updated-project.json
```

**Flags:** Same as create (all optional for update).

#### Set Default Project

```bash
nimrobo projects use <project-id>
```

Sets the default project for voice link commands.

#### Clear Default Project

```bash
nimrobo projects use --clear
```

Clears the default project setting.

---

### Voice Link Commands

Unified commands for both project-based and instant voice links.

#### List Links

```bash
# List instant links
nimrobo links list

# List project links
nimrobo links list --project <project-id>
nimrobo links list --project default  # Uses default project
```

#### Create Links

**Input options:**

1. **Via flags:**
```bash
# Create instant links
nimrobo links create --labels "Candidate A,Candidate B" --expiry 1_week --prompt "Your interview prompt..."

# Create project links
nimrobo links create --project <project-id> --labels "Candidate A,Candidate B" --expiry 1_week
```

2. **Via JSON file:**
```bash
# Create instant links from file
nimrobo links create --file ./links.json

# Create project links from file
nimrobo links create --project <project-id> --file ./links.json
```

3. **Interactive mode:** Prompts for required fields if no flags or file provided.

**Flags:**
| Flag | Required | Description |
|------|----------|-------------|
| `--file` | No | Path to JSON file with link data |
| `--project` | No | Project ID or "default" (omit for instant links) |
| `--labels` | Yes* | Comma-separated list of link labels (*required if no --file) |
| `--expiry` | Yes* | Expiry preset: `1_day`, `1_week`, `1_month` (*required if no --file) |
| `--prompt` | Yes** | AI prompt (**required for instant links if no --file) |
| `--landing-title` | No | Landing page title (instant links only) |
| `--landing-info` | No | Landing page info (instant links only) |
| `--time-limit` | No | Time limit in minutes (instant links only) |

**JSON file format for instant links (instant-links.json):**
```json
{
  "labels": ["Candidate A", "Candidate B", "Candidate C"],
  "expiryPreset": "1_week",
  "prompt": "You are conducting a user research interview...",
  "landingPageTitle": "User Research Session",
  "landingPageInfo": "Thank you for participating.",
  "timeLimitMinutes": 15,
  "evaluator": {
    "prompt": "Summarize the key insights from this conversation...",
    "questions": [
      { "id": "satisfaction", "label": "User Satisfaction", "type": "number" },
      { "id": "feedback", "label": "Key Feedback", "type": "text" }
    ]
  }
}
```

**JSON file format for project links (project-links.json):**
```json
{
  "labels": ["Candidate A", "Candidate B", "Candidate C"],
  "expiryPreset": "1_week"
}
```

**Output:** URLs only (one per line)

```
https://app.nimroboai.com/link/abc123
https://app.nimroboai.com/link/def456
```

#### Cancel Link

```bash
# Cancel project link
nimrobo links cancel <link-id> --project <project-id>

# Cancel instant link (not supported by API currently)
```

#### Update Instant Link

```bash
nimrobo links update <link-id> [flags]
nimrobo links update <link-id> --file ./update.json
```

**Flags:**
| Flag | Description |
|------|-------------|
| `--file` | Path to JSON file with update data |
| `--label` | New label |
| `--expiry` | New expiry preset |
| `--prompt` | New prompt |
| `--landing-title` | New landing page title |
| `--landing-info` | New landing page info |
| `--time-limit` | New time limit in minutes |

---

### Session Commands

#### Get Session Status

```bash
nimrobo sessions status <session-id> --type <project|instant> [--project <project-id>]
```

**Flags:**
| Flag | Required | Description |
|------|----------|-------------|
| `--type` | Yes | Session type: `project` or `instant` |
| `--project` | Yes* | Project ID (*required when type=project) |

#### Get Session Transcript

```bash
nimrobo sessions transcript <session-id> --type <project|instant> [--project <project-id>]
```

Returns the conversation transcript.

#### Get Session Audio

```bash
nimrobo sessions audio <session-id> --type <project|instant> [--project <project-id>]
```

Returns a signed URL for the session audio file.

#### Get Session Evaluation

```bash
nimrobo sessions evaluation <session-id> --type <project|instant> [--project <project-id>]
```

Returns evaluation results (if available).

#### Get Session Summary

```bash
nimrobo sessions summary <session-id> [--project <project-id>] [--instant]
```

Fetches or triggers generation of session summary.

**Flags:**
| Flag | Description |
|------|-------------|
| `--project` | Project ID (for project sessions) |
| `--instant` | Flag for instant link sessions |

#### Regenerate Session Summary

```bash
nimrobo sessions summary:regenerate <session-id> [--project <project-id>] [--instant]
```

Forces regeneration of the session summary.

---

## Error Handling

Errors display a message with helpful suggestions:

```
✗ Error: Project not found

  Suggestions:
  • Check the project ID is correct
  • Run 'nimrobo projects list' to see available projects
```

Exit codes:
- `0` - Success
- `1` - Error

---

## Interactive Mode Behavior

| Command | Interactive Behavior |
|---------|---------------------|
| `nimrobo login` | Always prompts for API key |
| `nimrobo projects create` | Prompts for name and prompt if not provided via flags or --file |
| `nimrobo links create` | Prompts for labels, expiry, and prompt (for instant) if not provided |
| All other commands | Non-interactive, requires flags/arguments |

---

## Example Workflows

### Interview Workflow (Project-based)

```bash
# 1. Login
nimrobo login

# 2. Create a project for a role (using JSON file)
nimrobo projects create --file ./senior-engineer-interview.json

# 3. Set as default
nimrobo projects use proj_abc123

# 4. Generate links for candidates
nimrobo links create --project default --labels "Alice,Bob,Charlie" --expiry 1_week

# 5. Check session results later
nimrobo sessions status sess_xyz --type project --project default
nimrobo sessions evaluation sess_xyz --type project --project default
```

### Quick Research (Instant Links)

```bash
# Create instant links for user research (using JSON file)
nimrobo links create --file ./user-research-config.json

# Or via flags
nimrobo links create --labels "User1,User2" --expiry 1_day --prompt "Conduct user research about..."

# Check results
nimrobo sessions status sess_abc --type instant
nimrobo sessions transcript sess_abc --type instant
```

### Batch Link Creation

```bash
# Prepare a JSON file with all candidates
cat candidates.json
{
  "labels": ["Alice Smith", "Bob Jones", "Charlie Brown", "Diana Prince"],
  "expiryPreset": "1_week"
}

# Create all links at once
nimrobo links create --project default --file ./candidates.json
```

---

## File Structure

```
nimrobo-cli/
├── src/
│   ├── index.ts              # Entry point
│   ├── commands/
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   ├── status.ts
│   │   ├── user/
│   │   │   └── profile.ts
│   │   ├── projects/
│   │   │   ├── list.ts
│   │   │   ├── create.ts
│   │   │   ├── get.ts
│   │   │   ├── update.ts
│   │   │   └── use.ts
│   │   ├── links/
│   │   │   ├── list.ts
│   │   │   ├── create.ts
│   │   │   ├── cancel.ts
│   │   │   └── update.ts
│   │   └── sessions/
│   │       ├── status.ts
│   │       ├── transcript.ts
│   │       ├── audio.ts
│   │       ├── evaluation.ts
│   │       ├── summary.ts
│   │       └── summary-regenerate.ts
│   ├── api/
│   │   ├── client.ts         # Axios client with auth
│   │   ├── user.ts
│   │   ├── projects.ts
│   │   ├── links.ts
│   │   └── sessions.ts
│   ├── utils/
│   │   ├── config.ts         # Config file management
│   │   ├── output.ts         # Formatting (table/JSON)
│   │   ├── prompts.ts        # Interactive prompts
│   │   ├── errors.ts         # Error handling with suggestions
│   │   └── file-input.ts     # JSON file parsing for --file flag
│   └── types/
│       └── index.ts          # TypeScript types
├── bin/
│   └── nimrobo               # CLI executable
├── package.json
├── tsconfig.json
├── spec.md
└── CLAUDE.md
```
