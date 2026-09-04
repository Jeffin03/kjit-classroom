# KJIT Classroom — Architecture

**Version:** 2.0 — **Date:** September 2026

---

## System overview

```
Browser (React SSR)
       │
       ▼
Vercel CDN (static assets, edge middleware)
       │
       ▼
Next.js API Routes
  ├── /api/auth/*        → NextAuth (GitHub OAuth)
  ├── /api/assignments   → List assignment templates
  ├── /api/fork          → Fork template to student account
  ├── /api/pr            → Create / list pull requests
  ├── /api/roster        → Upload CSV, invite to org, create teams
  └── /api/submissions   → List all submissions
       │
       ▼
GitHub REST API v3
  ├── OAuth (user tokens)
  ├── Repos (fork)
  ├── Pull Requests (create, list)
  ├── Org (invite members)
  └── Teams (create, add members)
```

---

## Auth architecture

Two token layers:

1. **User token** — per-session, from GitHub OAuth. Stored in the NextAuth JWT. Used for fork and PR operations on behalf of the student.

2. **Org token** — platform-wide. Either a Personal Access Token or a GitHub App installation token. Used for org-level operations: inviting students, creating teams, checking membership.

GitHub App flow: generate a short-lived JWT signed with the private key → exchange for an installation token → cache for 50 minutes.

OAuth scopes requested: `read:user user:email repo read:org`

---

## API routes

```
/api/auth/[...nextauth]   GET/POST  NextAuth handler
/api/assignments          GET       List assignments (hardcoded in data.ts)
/api/fork                 POST      Fork template repo to user's account
/api/pr                   POST      Create PR from fork to template
/api/pr                   GET       List PRs for a repo
/api/roster               GET       Get roster + teams
/api/roster               POST      Parse CSV, add entries, invite to org, create teams
/api/submissions          GET       List all submissions
```

Protected routes (via middleware): `/dashboard/*`, `/faculty/*`, `/assignments/*`

---

## Data flow — student submission

```
Student clicks "Fork & Start"
       │
       ▼
POST /api/fork { owner, repo }
  → checkForkExists() — if exists, return it
  → forkRepo() — fork via GitHub API
  → addSubmission() — record in memory
  → return fork URL
       │
       ▼
Student works locally, pushes commits
       │
       ▼
POST /api/pr { templateOwner, templateRepo, forkOwner, title, body }
  → createPR() — PR from fork to template
  → addSubmission() — update status to "submitted"
  → return PR URL
       │
       ▼
Faculty reviews on GitHub, merges PR
```

---

## Data flow — student onboarding

```
Faculty uploads CSV
       │
       ▼
POST /api/roster { csvContent, autoInvite }
  → Parse CSV columns (roll_no, github_username, email, class)
  → For each student:
      → addRosterEntry() — store in memory
      → If autoInvite && org configured:
          → checkOrgMember() — already in org?
          → If no: inviteToOrg() — send GitHub invite
          → If team specified: createTeam() + addTeamMember()
  → Return { imported, invited, alreadyMember, errors, total }
```

---

## Deployment

Vercel. Push to GitHub → auto-deploy. Environment variables set in Vercel dashboard. Serverless functions for API routes. Edge middleware for auth checks.

---

## Security

- No passwords stored — GitHub OAuth only
- Tokens in HTTP-only cookies (NextAuth)
- Org tokens server-side only (.env.local)
- Middleware blocks unauthenticated access to protected routes
- HTTPS enforced by Vercel
