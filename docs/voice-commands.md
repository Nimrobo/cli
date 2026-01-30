# Voice Screening Commands

Complete reference for `nimrobo voice` commands.

---

## Table of Contents

- [User Commands](#user-commands)
- [Projects](#projects)
- [Links](#links)
- [Sessions](#sessions)

---

## Overview

Voice Screening enables AI-powered voice conversations via shareable links. The typical flow:

1. Create a **project** with an AI prompt and evaluation criteria
2. Generate **links** for participants
3. Participants complete voice sessions
4. Retrieve **transcripts**, **evaluations**, and **summaries**

For quick one-off sessions, you can create **instant links** without a project.

---

## User Commands

### user profile

Display authenticated user's profile.

```bash
nimrobo voice user profile
nimrobo voice user profile --json
```

---

## Projects

### projects list

List all projects.

```bash
nimrobo voice projects list
nimrobo voice projects list --json
```

### projects get

Get detailed project information.

```bash
nimrobo voice projects get proj_abc123
```

### projects create

Create a new interview project.

```bash
# Via CLI flags
nimrobo voice projects create \
  -n "Engineering Interview" \
  -p "You are a technical interviewer..." \
  -d "Backend engineer screening" \
  --landing-title "Technical Interview" \
  --landing-info "This will take approximately 30 minutes." \
  -t 30

# Via JSON file
nimrobo voice projects create -f project.json

# Interactive mode (prompts for required fields)
nimrobo voice projects create
```

**project.json:**
```json
{
  "name": "Senior Engineer Interview",
  "prompt": "You are conducting a technical interview for a senior backend engineer position.",
  "description": "Interview for senior engineering role",
  "landingPageTitle": "Welcome to your interview",
  "landingPageInfo": "Please ensure you have a quiet environment.",
  "timeLimitMinutes": 30,
  "evaluator": {
    "prompt": "Evaluate the candidate on technical skills and communication.",
    "questions": [
      { "id": "technical", "label": "Technical Skills", "type": "number" },
      { "id": "communication", "label": "Communication", "type": "number" },
      { "id": "notes", "label": "Additional Notes", "type": "text" }
    ]
  }
}
```

### projects update

Update an existing project.

```bash
nimrobo voice projects update proj_abc123 -n "New Name" -t 45
nimrobo voice projects update proj_abc123 -f updates.json
```

### projects use

Set or view default project for convenience.

```bash
# Set default
nimrobo voice projects use proj_abc123

# View current default
nimrobo voice projects use

# Clear default
nimrobo voice projects use --clear

# Use default in other commands
nimrobo voice links list -p default
nimrobo voice links create -p default -l "Alice,Bob" -e 1_week
```

---

## Links

### links list

List voice links.

```bash
# Project links
nimrobo voice links list -p proj_abc123
nimrobo voice links list -p default

# Instant links (no project)
nimrobo voice links list
```

### links create

Create voice links for participants.

**Project links:**
```bash
nimrobo voice links create \
  -p proj_abc123 \
  -l "Alice,Bob,Charlie" \
  -e 1_week
```

**Instant links (no project required):**
```bash
nimrobo voice links create \
  -l "User1,User2" \
  -e 1_day \
  --prompt "You are conducting user research..." \
  --landing-title "User Research Session" \
  --landing-info "Thank you for participating." \
  -t 15
```

**Via JSON file:**
```bash
nimrobo voice links create -p proj_abc123 -f candidates.json
```

**candidates.json:**
```json
{
  "labels": ["Alice Smith", "Bob Jones", "Charlie Brown"],
  "expiryPreset": "1_week"
}
```

**instant-links.json:**
```json
{
  "labels": ["Session 1", "Session 2"],
  "expiryPreset": "1_week",
  "prompt": "You are conducting user research interviews...",
  "landingPageTitle": "User Research",
  "landingPageInfo": "This session will take about 15 minutes.",
  "timeLimitMinutes": 15,
  "evaluator": {
    "prompt": "Summarize key insights.",
    "questions": [
      { "id": "satisfaction", "label": "User Satisfaction", "type": "number" },
      { "id": "insights", "label": "Key Insights", "type": "text" }
    ]
  }
}
```

**Expiry presets:** `1_day`, `1_week`, `1_month`

### links cancel

Cancel an active project link.

```bash
nimrobo voice links cancel link_abc123 -p proj_xyz789
```

**Note:** Only `active` project links can be cancelled. Instant links cannot be cancelled.

### links update

Update an instant voice link.

```bash
nimrobo voice links update link_abc123 \
  -l "New Label" \
  -e 1_month \
  -t 20

nimrobo voice links update link_abc123 -f update.json
```

**Note:** Only `active` instant links can be updated.

---

## Sessions

Session commands retrieve data from completed voice conversations.

### sessions status

Get session status.

```bash
# Project session
nimrobo voice sessions status sess_abc123 -t project -p proj_xyz789

# Instant session
nimrobo voice sessions status sess_abc123 -t instant
```

**Status values:** `pending`, `active`, `completed`, `failed`

### sessions transcript

Get conversation transcript.

```bash
nimrobo voice sessions transcript sess_abc123 -t project -p proj_xyz789
nimrobo voice sessions transcript sess_abc123 -t instant
nimrobo voice sessions transcript sess_abc123 -t instant --json
```

### sessions audio

Get signed URL to download audio recording.

```bash
nimrobo voice sessions audio sess_abc123 -t project -p proj_xyz789
```

**Output:**
```
Audio URL (valid for ~1 hour):
https://storage.example.com/audio/sess_abc123.mp3?signature=...
```

### sessions evaluation

Get AI evaluation results.

```bash
nimrobo voice sessions evaluation sess_abc123 -t project -p proj_xyz789
nimrobo voice sessions evaluation sess_abc123 -t instant
```

**Note:** Only available after session is `completed`.

### sessions summary

Get or trigger summary generation.

```bash
# Project session
nimrobo voice sessions summary sess_abc123 -p proj_xyz789

# Instant session
nimrobo voice sessions summary sess_abc123 -i
```

**Behavior:**
- If summary exists: Returns the summary
- If not: Triggers generation and returns workflow IDs

### sessions summary:regenerate

Force regeneration of summary.

```bash
nimrobo voice sessions summary:regenerate sess_abc123 -p proj_xyz789
nimrobo voice sessions summary:regenerate sess_abc123 -i
```

---

## Command Options Reference

### projects create / update

| Flag | Description |
|------|-------------|
| `-n, --name` | Project name |
| `-p, --prompt` | AI prompt for the voice agent |
| `-d, --description` | Project description |
| `--landing-title` | Landing page title |
| `--landing-info` | Landing page info text |
| `-t, --time-limit` | Time limit in minutes |
| `-f, --file` | Load from JSON file |

### links create

| Flag | Description |
|------|-------------|
| `-p, --project` | Project ID or "default" |
| `-l, --labels` | Comma-separated list of labels |
| `-e, --expiry` | Expiry preset: `1_day`, `1_week`, `1_month` |
| `--prompt` | AI prompt (instant links only) |
| `--landing-title` | Landing page title (instant links only) |
| `--landing-info` | Landing page info (instant links only) |
| `-t, --time-limit` | Time limit in minutes (instant links only) |
| `-f, --file` | Load from JSON file |

### sessions commands

| Flag | Description |
|------|-------------|
| `-t, --type` | Session type: `project` or `instant` |
| `-p, --project` | Project ID (required when type=project) |
| `-i, --instant` | Flag for instant sessions (summary commands) |
