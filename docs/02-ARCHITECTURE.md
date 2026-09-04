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
Next.js API Routes (16 endpoints)
  ├── /api/auth/*          → NextAuth (GitHub OAuth)
  ├── /api/org/*           → Org owners, teams (dynamic)
  ├── /api/teachers        → Teacher profile CRUD
  ├── /api/requests        → Teacher request approval
  ├── /api/assignments     → List + create assignments
  ├── /api/onboard/*       → CSV match + org invite
  ├── /api/fork            → Fork template to student account
  ├── /api/pr              → Create / list pull requests
  ├── /api/roster          → Roster management
  └── /api/submissions     → Submission status updates
       │
       ▼
GitHub REST API v3
  ├── OAuth (user tokens)
  ├── Repos (fork, create)
  ├── Pull Requests (create, list)
  ├── Org (invite members, list owners)
  └── Teams (create, add members, set maintainers)
```

---

## Auth architecture

Two token layers:

1. **User token** — per-session JWT from GitHub OAuth. Stored in the NextAuth JWT. Used for fork and PR operations on behalf of the student.

2. **Org token** — platform-wide. Either a GitHub App installation token (preferred) or a Personal Access Token. Used for org-level operations: inviting students, creating teams, checking membership, listing owners.

### GitHub App flow (production)

```
1. Generate JWT signed with private key
2. Exchange JWT for installation token (POST /app/installations/{id}/access_tokens)
3. Cache token for 50 minutes
4. Use token for all org-level API calls
```

### PAT fallback (development)

Set `GITHUB_ORG_TOKEN` env var. Simpler but less secure — tied to a personal account.

OAuth scopes: `read:user user:email repo read:org`

---

## Role hierarchy

```
Org Owner (GitHub)
  └── Can approve teacher requests
       └── Animator (class teacher)
            ├── Sees filtered roster for their class
            ├── Creates assignments
            ├── Reviews student submissions
            └── Onboards students via CSV

Subject/Elective Teacher
  └── Sees filtered view of their subject assignments
```

---

## API routes

```
GET  /api/auth/session                Current user session
GET  /api/org/owners                  List org owners (dynamic)
GET  /api/org/teams                   List org teams (dynamic)
GET  /api/teachers                    Get teacher profile
POST /api/teachers                    Create/update teacher profile
GET  /api/requests                    List pending teacher requests
PUT  /api/requests                    Approve/deny teacher request
GET  /api/assignments                 List all assignments
POST /api/assignments                 Create assignment (creates GitHub repo)
POST /api/onboard/match               Match CSV emails to GitHub accounts
POST /api/onboard/invite              Send invites + add to teams
GET  /api/roster                      Get roster + teams
POST /api/roster                      Upload CSV, invite to org, create teams
GET  /api/submissions                 List all submissions
PUT  /api/submissions/[id]            Update submission status
POST /api/fork                        Fork template to user's account
POST /api/pr                          Create PR from fork to template
GET  /api/pr                          List PRs for a repo
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
Faculty reviews code on GitHub
       │
       ▼
PUT /api/submissions/[id] { status: "accepted" }
  → updateSubmissionStatus() — marks accepted
  → Dashboard shows "Accepted"
```

---

## Data flow — assignment creation

```
Faculty fills form (/faculty/assignments/new)
  → title, problem statement, objectives, requirements,
    evaluation criteria, submission guidelines
       │
       ▼
POST /api/assignments
  → Generate slug from title
  → createRepoWithREADME() — private repo in org
  → README includes: problem statement, objectives, requirements,
    evaluation criteria, submission guidelines
  → addAssignment() — store in memory
  → return assignment with repo URL
       │
       ▼
Students see it in /assignments
  → Click "Start" → opens GitHub repo
  → Fork locally, build, push, submit PR
```

---

## Data flow — student onboarding

```
Faculty starts onboarding wizard (/faculty/onboard)
       │
       ▼
Step 1: Select class team (MCA-A, MCA-B, etc.)
       │
       ▼
Step 2: Upload CSV (roll_no, college_email)
  → POST /api/onboard/match
  → For each email: getUserByEmail() via GitHub API
  → Matched: roll_no + email → github_username + avatar
  → Unmatched: roll_no + email (no GitHub account)
       │
       ▼
Step 3: Verify matched/unmatched accounts
       │
       ▼
Step 4: Confirm — POST /api/onboard/invite
  → For matched: inviteToOrg() + addTeamMember()
  → For unmatched: download CSV list (manual outreach)
       │
       ▼
Step 5: Summary — invited count, already members, errors
```

---

## Deployment

Vercel. Push to GitHub → auto-deploy. Environment variables set in Vercel dashboard. Serverless functions for API routes. Edge middleware for auth checks.

---

## Security

- No passwords stored — GitHub OAuth only
- Tokens in HTTP-only cookies (NextAuth)
- Org tokens server-side only (env vars)
- Middleware blocks unauthenticated access to protected routes
- HTTPS enforced by Vercel
- GitHub App private key stored as env var (not file)
