# Nimrobo CLI Documentation

Complete reference documentation for the Nimrobo CLI.

## Quick Links

| Document | Description |
|----------|-------------|
| [Getting Started](#getting-started) | Installation and setup |
| [net-commands.md](net-commands.md) | Match Network commands (orgs, posts, applications, channels) |
| [voice-commands.md](voice-commands.md) | Voice Screening commands (projects, links, sessions) |
| [workflow.md](workflow.md) | Common workflow patterns and examples |

---

## Getting Started

### Installation

```bash
npm install -g @nimrobo/cli
```

### Authentication

```bash
# Browser-based login (recommended)
nimrobo login

# Check status
nimrobo status
```

### First-time Setup

```bash
# Set up your profile and optionally create an organization
nimrobo onboard

# Or generate a template to fill out
nimrobo onboard --generate-template
nimrobo onboard --file onboard-template.json
```

### Install Skills for Claude

If you're using Claude or other AI agents to operate the CLI:

```bash
nimrobo install skills
```

This copies agent-readable documentation to `.claude/skills/nimrobo/`, enabling Claude to understand and operate the CLI autonomously.

### Shell Completion

```bash
# Install tab completion for your shell
nimrobo completion install

# Uninstall
nimrobo completion uninstall
```

---

## Command Structure

The CLI has two main command namespaces:

```
nimrobo
├── login / logout / status      # Authentication
├── onboard                      # Profile setup
├── install skills               # Install Claude skills
├── completion                   # Shell completion
├── net                          # Match Network
│   ├── my                       # Your profile & activity
│   ├── users                    # User search & profiles
│   ├── orgs                     # Organizations
│   ├── posts                    # Posts & opportunities
│   ├── applications             # Application management
│   ├── channels                 # Messaging
│   └── context                  # Context management
└── voice                        # Voice Screening
    ├── user                     # User profile
    ├── projects                 # Interview projects
    ├── links                    # Voice links
    └── sessions                 # Session data & transcripts
```

---

## Global Options

All commands support these options:

| Option | Description |
|--------|-------------|
| `--json` | Output in JSON format for scripting |
| `--help` | Show help for any command |

---

## Input Methods

Commands accept data via multiple methods:

```bash
# CLI flags
nimrobo net posts create --title "Engineer" --short-content "Join our team" --expires "2024-12-31"

# JSON file
nimrobo net posts create -f post.json

# Stdin (for piping)
cat post.json | nimrobo net posts create --stdin

# Content from file (for long-form fields)
nimrobo net posts create --title "Engineer" --long-content-file ./job-description.md --expires "2024-12-31"
```

---

## Context System

Net commands support a context system to avoid repeating IDs:

```bash
# Set context
nimrobo net orgs use org_abc123
nimrobo net posts use post_xyz789
nimrobo net channels use ch_123456

# Use "current" to reference stored context
nimrobo net orgs get current
nimrobo net posts applications current
nimrobo net channels messages current

# View all context
nimrobo net context show

# Clear context
nimrobo net context clear        # Clear all
nimrobo net context clear org    # Clear specific type
```

---

## Pagination

List commands support pagination:

```bash
nimrobo net posts list --limit 20 --skip 0   # Page 1 (default)
nimrobo net posts list --limit 20 --skip 20  # Page 2
nimrobo net posts list --limit 20 --skip 40  # Page 3
```

Response includes pagination info:
```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "skip": 0,
    "has_more": true
  }
}
```

---

## Configuration

Configuration is stored in `~/.nimrobo/config.json`:

- API key (shared across Voice and Net)
- API endpoints
- Default project (Voice)
- Context state (Net: org, post, channel, user)

---

## Next Steps

- [Net Commands](net-commands.md) - Full Match Network reference
- [Voice Commands](voice-commands.md) - Full Voice Screening reference
- [Workflows](workflow.md) - Common patterns and examples
