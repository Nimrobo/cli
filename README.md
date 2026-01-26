# @nimrobo/cli

Official CLI tool for interacting with [Nimrobo AI](https://nimroboai.com) APIs.

## Installation

```bash
npm install -g @nimrobo/cli
```

## Quick Start

```bash
# Login (opens browser for authentication)
nimrobo login

# Set up your profile (first-time users)
nimrobo onboard
```

## Commands

### Authentication

```bash
nimrobo login                     # Browser-based login (recommended)
nimrobo logout                    # Logout from the platform
nimrobo status                    # Check authentication status
```

The default `nimrobo login` opens your browser for secure browser-based authentication. A verification code is displayed in the terminal to confirm the connection.

### Onboarding (`nimrobo onboard`)

Set up your profile and optionally create an organization. This is the recommended way to get started after logging in.

```bash
# View instructions and JSON schema
nimrobo onboard

# Generate a template file to fill out
nimrobo onboard --generate-template

# Apply your configuration
nimrobo onboard --file onboard-template.json
```

### Voice Screening Platform (`nimrobo voice`)

Manage voice-based candidate screening with AI-powered interviews.

```bash
# Projects
nimrobo voice projects list      # List all projects
nimrobo voice projects create    # Create a new project
nimrobo voice projects get <id>  # Get project details

# Links
nimrobo voice links list <project-id>   # List interview links
nimrobo voice links create <project-id> # Create interview link

# Sessions
nimrobo voice sessions list <project-id>  # List interview sessions
nimrobo voice sessions get <session-id>   # Get session details
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
nimrobo voice projects list --json | jq '.projects[0].name'
nimrobo net posts search --query "engineer" --json
```

## Requirements

- Node.js >= 16.0.0

## License

Apache-2.0 - See [LICENSE](LICENSE) for details.
