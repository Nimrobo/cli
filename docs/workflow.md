# Workflow Guide

Common workflow patterns for the Nimrobo CLI.

---

## Table of Contents

- [Job Posting Workflow](#job-posting-workflow)
- [Job Seeking Workflow](#job-seeking-workflow)
- [Applicant Review Workflow](#applicant-review-workflow)
- [Organization Management](#organization-management)
- [Interview Screening](#interview-screening)
- [Quick User Research](#quick-user-research)
- [Agent Automation Patterns](#agent-automation-patterns)

---

## Job Posting Workflow

Create and manage posts as an organization.

```bash
# 1. Login
nimrobo login

# 2. Create or select organization
nimrobo net orgs create --name "Acme Corp" --use
# OR
nimrobo net orgs use org_abc123

# 3. Create post
nimrobo net posts create \
  --title "Senior Engineer" \
  --short-content "We're hiring a senior engineer for our backend team." \
  --long-content-file ./job-description.md \
  --expires "2024-06-01" \
  --org current \
  --use

# 4. View incoming applications
nimrobo net posts applications current --status pending

# 5. Accept promising applicants (opens messaging channel)
nimrobo net applications accept app_123
nimrobo net applications accept app_456

# 6. Message accepted candidates
nimrobo net channels list --post current
nimrobo net channels send ch_abc --message "Thanks for applying! Let's schedule a call."

# 7. Close post when done
nimrobo net posts close current
```

---

## Job Seeking Workflow

Search and apply for jobs.

```bash
# 1. Login and update profile
nimrobo login
nimrobo net my update \
  --name "John Doe" \
  --city "San Francisco" \
  --bio "Senior full-stack developer with 8 years experience"

# 2. Search for jobs
nimrobo net posts list --query "senior engineer"

# 3. Filter by job attributes (backend-extracted fields)
nimrobo net posts list \
  --query "senior engineer" \
  --filter '{"remote": "remote", "salary_min": 120000}'

# 4. View job details
nimrobo net posts get post_xyz789 --use

# 5. Apply with note
nimrobo net posts apply current \
  --note "I'm excited about this role because..." \
  --expected-salary 140000 \
  --availability "2024-05-01"

# 6. Track applications
nimrobo net my applications
nimrobo net my applications --status accepted

# 7. Check for messages from employers
nimrobo net my summary
nimrobo net channels messages ch_abc123

# 8. Respond to messages
nimrobo net channels send ch_abc123 --message "Thanks! I'm available tomorrow at 2pm."
```

---

## Applicant Review Workflow

Efficiently review and process job applications.

```bash
# 1. Set post context
nimrobo net posts use post_abc123

# 2. Check activity summary
nimrobo net my summary

# 3. List pending applications
nimrobo net posts applications current --status pending

# 4. Review individual applications
nimrobo net applications get app_123
nimrobo net applications get app_456

# 5. Batch accept multiple strong candidates
nimrobo net applications batch-action \
  --action accept \
  --ids "app_123,app_456,app_789" \
  --channel-expires "2024-08-01"

# 6. Batch reject others
nimrobo net applications batch-action \
  --action reject \
  --ids "app_abc,app_def" \
  --reason "Position filled"

# 7. Message accepted applicants
nimrobo net channels list --post current
nimrobo net channels send ch_new1 --message "Congratulations! Let's schedule an interview."
```

---

## Organization Management

Manage team members, invites, and join requests.

```bash
# 1. Set org context
nimrobo net orgs use org_abc123

# 2. View current members
nimrobo net orgs manage members current

# 3. Invite new members
nimrobo net orgs manage invite current --email "developer@example.com" --role member
nimrobo net orgs manage invite current --email "lead@example.com" --role admin

# 4. Review join requests
nimrobo net orgs manage join-requests current
nimrobo net orgs manage approve-request req_123 --role member
nimrobo net orgs manage reject-request req_456

# 5. Update member roles
nimrobo net orgs manage update-role current usr_789 --role admin

# 6. Remove a member if needed
nimrobo net orgs manage remove-member current usr_xyz
```

---

## Interview Screening

Set up and run structured voice interviews.

```bash
# 1. Create interview project
nimrobo voice projects create -f interview.json

# 2. Set as default project
nimrobo voice projects use proj_abc123

# 3. Generate links for candidates
nimrobo voice links create -p default -l "Alice,Bob,Charlie" -e 1_week

# 4. (After interviews complete) Check session status
nimrobo voice sessions status sess_xyz -t project -p default

# 5. Get evaluation results
nimrobo voice sessions evaluation sess_xyz -t project -p default

# 6. Get transcript
nimrobo voice sessions transcript sess_xyz -t project -p default --json > transcript.json

# 7. Get summary
nimrobo voice sessions summary sess_xyz -p default
```

---

## Quick User Research

Run instant voice sessions without creating a project.

```bash
# 1. Create instant links with embedded prompt
nimrobo voice links create \
  -l "User1,User2,User3" \
  -e 1_day \
  --prompt "You are conducting user research about our mobile app. Ask about pain points and feature requests." \
  --landing-title "User Research Session" \
  --landing-info "Thank you for participating. This will take about 10 minutes." \
  -t 10

# 2. (After sessions complete) Check results
nimrobo voice sessions status sess_abc -t instant
nimrobo voice sessions summary sess_abc -i
nimrobo voice sessions transcript sess_abc -t instant
```

---

## Agent Automation Patterns

Patterns for AI agents operating the CLI.

### Using Context to Avoid Repeating IDs

```bash
# Set contexts once
nimrobo net orgs use org_abc
nimrobo net posts use post_xyz
nimrobo net channels use ch_123

# Then use "current" everywhere
nimrobo net orgs get current
nimrobo net posts applications current
nimrobo net channels messages current
nimrobo net channels send current --message "Hello!"
```

### JSON Output for Processing

```bash
# Get data in JSON format
nimrobo net posts list --json > posts.json
nimrobo net my applications --status accepted --json | jq '.data[].id'
nimrobo net posts applications current --json | jq '.data[] | select(.status == "pending")'
```

### Activity Monitoring

```bash
# Quick overview of pending actions
nimrobo net my summary

# Check for unread messages
nimrobo net channels list --status active --json | jq '.data[] | select(.unread_count > 0)'
```

### Pagination for Large Datasets

```bash
# Page through results
nimrobo net posts list --limit 20 --skip 0   # Page 1
nimrobo net posts list --limit 20 --skip 20  # Page 2
nimrobo net posts list --limit 20 --skip 40  # Page 3
```

### Batch Operations

```bash
# Create multiple interview links at once
nimrobo voice links create -p default -l "A,B,C,D,E,F,G,H,I,J" -e 1_week

# Process multiple applications at once
nimrobo net applications batch-action --action accept --ids "app_1,app_2,app_3"
nimrobo net applications batch-action --action reject --ids "app_4,app_5" --reason "Not a fit"
```

### Automated Job Application

An agent might execute this workflow:

```bash
# 1. Search for matching jobs
nimrobo net posts list \
  --query "backend engineer" \
  --filter '{"remote": "remote", "salary_min": 100000}' \
  --json > jobs.json

# 2. Check which ones not yet applied to
nimrobo net posts check-applied post_123

# 3. Apply to matching ones
nimrobo net posts apply post_123 \
  --note "Based on my experience with distributed systems..." \
  --expected-salary 130000

# 4. Track applications
nimrobo net my applications --status pending --json
```

### Automated Applicant Screening

An agent might execute this workflow:

```bash
# 1. Get pending applications
nimrobo net posts applications current --status pending --json > applicants.json

# 2. Review each application
nimrobo net applications get app_123 --json

# 3. Make decisions based on criteria
nimrobo net applications accept app_123 --channel-expires "2024-08-01"
nimrobo net applications reject app_456 --reason "Missing required experience"

# 4. Send follow-up messages
nimrobo net channels send ch_new --message "Thanks for applying! When are you available for a 30-minute call?"
```

---

## Quick Reference

### Check Status

```bash
nimrobo status              # Auth status
nimrobo net my summary      # Activity overview
nimrobo net context show    # Current context
```

### Set Context

```bash
nimrobo net orgs use <id>
nimrobo net posts use <id>
nimrobo net channels use <id>
nimrobo voice projects use <id>
```

### Clear Context

```bash
nimrobo net context clear       # All
nimrobo net context clear org   # Specific type
nimrobo voice projects use --clear
```
