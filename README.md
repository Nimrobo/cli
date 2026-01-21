# @nimrobo/cli

Official CLI tool for interacting with [Nimrobo](https://nimroboai.com) AI APIs.

## Installation

```bash
npm install -g @nimrobo/cli
```

## Quick Start

```bash
# Login (shared across both platforms)
nimrobo login

# Check status
nimrobo status
```

## Commands

### Voice Screening Platform (`nimrobo screen`)

Manage voice-based candidate screening with AI-powered interviews.

```bash
# Authentication (shared across both platforms)
nimrobo login                     # Login to the platform
nimrobo logout                    # Logout from the platform
nimrobo status                    # Check authentication status

# Projects
nimrobo screen projects list      # List all projects
nimrobo screen projects create    # Create a new project
nimrobo screen projects get <id>  # Get project details

# Links
nimrobo screen links list <project-id>   # List interview links
nimrobo screen links create <project-id> # Create interview link

# Sessions
nimrobo screen sessions list <project-id>  # List interview sessions
nimrobo screen sessions get <session-id>   # Get session details
```

### Matching Network (`nimrobo net`)

Connect with organizations and discover opportunities.

```bash
# Profile
nimrobo net profile               # View your profile
nimrobo net profile update        # Update profile information

# Organizations
nimrobo net orgs list             # List organizations
nimrobo net orgs get <id>         # Get organization details

# Posts & Opportunities
nimrobo net posts search          # Search for posts
nimrobo net posts get <id>        # Get post details

# Applications
nimrobo net apply <post-id>       # Apply to a post
nimrobo net applications list     # View your applications
```

## Global Options

```bash
--json    # Output in JSON format for scripting
--help    # Show help for any command
```

## Configuration

The CLI stores configuration in `~/.nimrobo/`:

- `config.json` - API endpoints and settings
- `auth.json` - Authentication tokens (Screen platform)
- `net-auth.json` - Authentication tokens (Net platform)

## JSON Output

All commands support `--json` flag for scripting:

```bash
nimrobo screen projects list --json | jq '.projects[0].name'
nimrobo net posts search --query "engineer" --json
```

## Requirements

- Node.js >= 16.0.0

## License

Apache-2.0 - See [LICENSE](LICENSE) for details.
