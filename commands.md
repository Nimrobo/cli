# Nimrobo CLI Command Reference

Complete reference for all Nimrobo CLI commands.

## Global Options

| Option | Description |
|--------|-------------|
| `--json` | Output results in JSON format (useful for scripting) |
| `--help` | Display help for any command |

---

## Authentication Commands

### `nimrobo login`

Authenticate with your Nimrobo API key.

```bash
nimrobo login
```

You'll be prompted to enter your API key (starts with `api_...`). The key is validated against the API and stored locally in `~/.nimrobo/config.json`.

---

### `nimrobo logout`

Clear stored authentication credentials.

```bash
nimrobo logout
```

Removes the API key from local storage.

---

### `nimrobo status`

Display current authentication status and configuration.

```bash
nimrobo status
```

**Output includes:**
- Authentication status
- User profile (name, email)
- Default project (if set)
- API base URL

---

## User Commands

### `nimrobo user profile`

Display the authenticated user's profile information.

```bash
nimrobo user profile
```

**Output includes:**
- User ID
- Name
- Email
- Profile completion status
- Account creation date
- Last login date

---

## Project Commands

### `nimrobo projects list`

List all projects for the authenticated user.

```bash
nimrobo projects list
```

**Output columns:**
| Column | Description |
|--------|-------------|
| ID | Project identifier |
| Name | Project name |
| Time Limit | Session time limit in minutes |
| Created | Creation date |

---

### `nimrobo projects get <project-id>`

Get detailed information about a specific project.

```bash
nimrobo projects get <project-id>
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `project-id` | The project ID to retrieve |

**Output includes:**
- Project ID, name, description
- AI prompt (truncated to 100 chars in display)
- Landing page title and info
- Time limit
- Evaluator status (configured or not)
- Creation and update timestamps

---

### `nimrobo projects create`

Create a new project.

```bash
nimrobo projects create [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `-f, --file <path>` | Load project configuration from JSON file |
| `-n, --name <name>` | Project name (required) |
| `-p, --prompt <prompt>` | AI prompt for the voice agent (required) |
| `-d, --description <desc>` | Project description |
| `--landing-title <title>` | Landing page title |
| `--landing-info <info>` | Landing page information text |
| `-t, --time-limit <minutes>` | Session time limit (default: 5) |

**Examples:**

Interactive mode:
```bash
nimrobo projects create
```

With flags:
```bash
nimrobo projects create \
  -n "Engineering Interview" \
  -p "You are conducting a technical interview..." \
  -d "Backend engineer screening" \
  -t 15
```

From JSON file:
```bash
nimrobo projects create -f project.json
```

**JSON file format:**
```json
{
  "name": "Project Name",
  "prompt": "AI prompt instructions...",
  "description": "Optional description",
  "landingPageTitle": "Welcome Title",
  "landingPageInfo": "Information shown to users",
  "timeLimitMinutes": 15,
  "evaluator": {
    "prompt": "Evaluation instructions...",
    "questions": [
      { "id": "q1", "label": "Technical Skills", "type": "number" },
      { "id": "q2", "label": "Comments", "type": "text" }
    ]
  }
}
```

---

### `nimrobo projects update <project-id>`

Update an existing project.

```bash
nimrobo projects update <project-id> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `project-id` | The project ID to update |

**Options:**
| Option | Description |
|--------|-------------|
| `-f, --file <path>` | Load updates from JSON file |
| `-n, --name <name>` | New project name |
| `-p, --prompt <prompt>` | New AI prompt |
| `-d, --description <desc>` | New description |
| `--landing-title <title>` | New landing page title |
| `--landing-info <info>` | New landing page info |
| `-t, --time-limit <minutes>` | New time limit |

**Example:**
```bash
nimrobo projects update proj_abc123 -n "Updated Name" -t 20
```

---

### `nimrobo projects use [project-id]`

Set or view the default project.

```bash
nimrobo projects use [project-id]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `project-id` | Project ID to set as default (optional) |

**Options:**
| Option | Description |
|--------|-------------|
| `-c, --clear` | Clear the default project |

**Examples:**

Set default project:
```bash
nimrobo projects use proj_abc123
```

View current default:
```bash
nimrobo projects use
```

Clear default:
```bash
nimrobo projects use --clear
```

Once set, use `default` as the project ID in other commands:
```bash
nimrobo links list -p default
```

---

## Voice Link Commands

### `nimrobo links list`

List voice links (project-based or instant).

```bash
nimrobo links list [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `-p, --project <project-id>` | List links for this project (use `default` for default project) |

**Behavior:**
- With `-p`: Lists project links
- Without `-p`: Lists instant (projectless) links

**Output columns:**
| Column | Description |
|--------|-------------|
| ID | Link identifier |
| Label | Link label/name |
| Status | `active`, `used`, `expired`, or `cancelled` |
| Session ID | Session ID (only for `used` links) |
| Expires | Expiration date |

**Examples:**

List project links:
```bash
nimrobo links list -p proj_abc123
nimrobo links list -p default
```

List instant links:
```bash
nimrobo links list
```

---

### `nimrobo links create`

Create one or more voice links.

```bash
nimrobo links create [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `-f, --file <path>` | Load configuration from JSON file |
| `-p, --project <project-id>` | Create project links (omit for instant links) |
| `-l, --labels <labels>` | Comma-separated labels for each link |
| `-e, --expiry <preset>` | Expiry: `1_day`, `1_week`, or `1_month` |
| `--prompt <prompt>` | AI prompt (required for instant links) |
| `--landing-title <title>` | Landing page title (instant links only) |
| `--landing-info <info>` | Landing page info (instant links only) |
| `-t, --time-limit <minutes>` | Time limit 1-60 (instant links only) |

**Examples:**

Create project links:
```bash
nimrobo links create \
  -p proj_abc123 \
  -l "Candidate A,Candidate B,Candidate C" \
  -e 1_week
```

Create instant links:
```bash
nimrobo links create \
  -l "Session 1,Session 2" \
  -e 1_day \
  --prompt "You are a customer research interviewer..." \
  --landing-title "Customer Interview" \
  -t 10
```

From JSON file (project links):
```bash
nimrobo links create -p proj_abc123 -f links.json
```

**JSON file format (project links):**
```json
{
  "labels": ["Candidate A", "Candidate B"],
  "expiryPreset": "1_week"
}
```

**JSON file format (instant links):**
```json
{
  "labels": ["Session 1", "Session 2"],
  "expiryPreset": "1_week",
  "prompt": "AI prompt instructions...",
  "landingPageTitle": "Welcome",
  "landingPageInfo": "Information text",
  "timeLimitMinutes": 10
}
```

**Output:**
Returns the created links with their shareable URLs.

---

### `nimrobo links cancel <link-id>`

Cancel an active project link.

```bash
nimrobo links cancel <link-id> -p <project-id>
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `link-id` | The link ID to cancel |

**Options:**
| Option | Description |
|--------|-------------|
| `-p, --project <project-id>` | Project ID (required) |

**Note:** Only works for project links. Only `active` links can be cancelled.

**Example:**
```bash
nimrobo links cancel link_abc123 -p proj_xyz789
```

---

### `nimrobo links update <link-id>`

Update an instant voice link.

```bash
nimrobo links update <link-id> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `link-id` | The instant link ID to update |

**Options:**
| Option | Description |
|--------|-------------|
| `-f, --file <path>` | Load updates from JSON file |
| `-l, --label <label>` | New label |
| `-e, --expiry <preset>` | New expiry preset |
| `--prompt <prompt>` | New AI prompt |
| `--landing-title <title>` | New landing page title |
| `--landing-info <info>` | New landing page info |
| `-t, --time-limit <minutes>` | New time limit (1-60) |

**Note:** Only `active` instant links can be updated. Project links cannot be updated with this command.

**Example:**
```bash
nimrobo links update link_abc123 -l "New Label" -t 15
```

---

## Session Commands

All session commands require specifying the session type (`project` or `instant`).

### `nimrobo sessions status <session-id>`

Get the status of a session.

```bash
nimrobo sessions status <session-id> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `session-id` | The session ID |

**Options:**
| Option | Description |
|--------|-------------|
| `-t, --type <type>` | Session type: `project` or `instant` (required) |
| `-p, --project <project-id>` | Project ID (required if type is `project`) |

**Output includes:**
- Session ID and type
- Status (e.g., `in_progress`, `completed`)
- Agent ID
- WebSocket URL
- Timestamps (created, updated, completed)

**Examples:**

Project session:
```bash
nimrobo sessions status sess_abc123 -t project -p proj_xyz789
```

Instant session:
```bash
nimrobo sessions status sess_abc123 -t instant
```

---

### `nimrobo sessions transcript <session-id>`

Get the conversation transcript for a session.

```bash
nimrobo sessions transcript <session-id> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `session-id` | The session ID |

**Options:**
| Option | Description |
|--------|-------------|
| `-t, --type <type>` | Session type: `project` or `instant` (required) |
| `-p, --project <project-id>` | Project ID (required if type is `project`) |

**Output:** JSON transcript of the conversation.

**Examples:**
```bash
nimrobo sessions transcript sess_abc123 -t project -p proj_xyz789
nimrobo sessions transcript sess_abc123 -t instant
```

---

### `nimrobo sessions audio <session-id>`

Get a signed URL to download the session audio recording.

```bash
nimrobo sessions audio <session-id> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `session-id` | The session ID |

**Options:**
| Option | Description |
|--------|-------------|
| `-t, --type <type>` | Session type: `project` or `instant` (required) |
| `-p, --project <project-id>` | Project ID (required if type is `project`) |

**Output:** Signed URL (valid for ~1 hour) to download the audio file.

**Examples:**
```bash
nimrobo sessions audio sess_abc123 -t project -p proj_xyz789
nimrobo sessions audio sess_abc123 -t instant
```

---

### `nimrobo sessions evaluation <session-id>`

Get evaluation results for a session.

```bash
nimrobo sessions evaluation <session-id> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `session-id` | The session ID |

**Options:**
| Option | Description |
|--------|-------------|
| `-t, --type <type>` | Session type: `project` or `instant` (required) |
| `-p, --project <project-id>` | Project ID (required if type is `project`) |

**Output includes:**
- Evaluation results (if available)
- Evaluation timestamp
- Error status

**Note:** Evaluation results are only available after a session is `completed`. If called before completion, `evaluationResults` will be `null`. This endpoint does not trigger evaluation generation.

**Examples:**
```bash
nimrobo sessions evaluation sess_abc123 -t project -p proj_xyz789
nimrobo sessions evaluation sess_abc123 -t instant
```

---

### `nimrobo sessions summary <session-id>`

Get or trigger generation of a session summary.

```bash
nimrobo sessions summary <session-id> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `session-id` | The session ID |

**Options:**
| Option | Description |
|--------|-------------|
| `-p, --project <project-id>` | Project ID (for project sessions) |
| `-i, --instant` | Flag for instant link sessions |

**Behavior:**
- If summary exists: Returns the summary (200 response)
- If summary doesn't exist: Triggers generation and returns workflow IDs (202 response)

**Examples:**

Project session:
```bash
nimrobo sessions summary sess_abc123 -p proj_xyz789
```

Instant session:
```bash
nimrobo sessions summary sess_abc123 -i
```

---

### `nimrobo sessions summary-regenerate <session-id>`

Force regeneration of a session summary.

```bash
nimrobo sessions summary-regenerate <session-id> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `session-id` | The session ID |

**Options:**
| Option | Description |
|--------|-------------|
| `-p, --project <project-id>` | Project ID (for project sessions) |
| `-i, --instant` | Flag for instant link sessions |

**Output:** Workflow and run IDs for tracking the generation process.

**Examples:**
```bash
nimrobo sessions summary-regenerate sess_abc123 -p proj_xyz789
nimrobo sessions summary-regenerate sess_abc123 -i
```

---

## Configuration

The CLI stores configuration in `~/.nimrobo/config.json`:

```json
{
  "apiKey": "api_...",
  "apiBaseUrl": "https://app.nimroboai.com/api",
  "defaultProject": "proj_abc123"
}
```

| Field | Description |
|-------|-------------|
| `apiKey` | Your Nimrobo API key |
| `apiBaseUrl` | API base URL (default: `https://app.nimroboai.com/api`) |
| `defaultProject` | Default project ID for convenience |

---

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Error (authentication, API error, invalid input, etc.) |

---

## JSON Output Mode

Add `--json` to any command for machine-readable JSON output:

```bash
nimrobo projects list --json
nimrobo sessions status sess_abc123 -t project -p proj_xyz789 --json
```

This is useful for scripting and automation.
