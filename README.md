# KJIT Classroom

GitHub-native sprint-based PBL submission & portfolio management platform for Kristu Jayanti Institute of Technology.

Students build projects in their own GitHub repos and submit progressively across Sprint 0–3 (abstract, progress, docs links, commit hashes, and pivot support). Faculty reviews in lab and records notes/acceptance in the app. The app is a thin orchestration layer on top of the GitHub API.

## Quick start

```bash
npm install
# create .env.local with AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET,
# GITHUB_ORG, and either GITHUB_ORG_TOKEN or the GITHUB_APP_* trio
# (AUTH_GITHUB_ID/SECRET come from the GitHub App's OAuth credentials page)
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Purpose | Variables |
| --- | --- |
| Required | `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `GITHUB_ORG` |
| Org management (pick one) | `GITHUB_ORG_TOKEN` **or** `GITHUB_APP_ID` + `GITHUB_APP_INSTALLATION_ID` + (`GITHUB_APP_PRIVATE_KEY` inline PEM **or** `GITHUB_APP_PRIVATE_KEY_PATH`) |
| Optional persistence | `DYNAMODB_TABLE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (DynamoDB; `DYNAMODB_ENDPOINT` optional for tests/Local) |
| Optional faculty team | `GITHUB_FACULTY_TEAM` — slug of the GitHub org team that grants faculty access (defaults to probing `faculty`, `teachers`, `staff`) |
| Optional demo data | `SEED_DUMMY_DATA=false` — start with an empty assignments/announcements store instead of the demo rows (they are on by default for local development) |

### Deployment checks

`GET /api/health` returns `200` when the required configuration is present and
`503` listing the missing variable names otherwise. On Vercel, set the GitHub
App key as inline `GITHUB_APP_PRIVATE_KEY` (the full PEM); a
`GITHUB_APP_PRIVATE_KEY_PATH` points at a file that does not exist in the
runtime image.

GitHub App user tokens expire after 8 hours. The session refreshes them
automatically while the user is active; if refresh fails, the user is sent back
through GitHub sign-in instead of calling GitHub with a dead token.

### Deploying to Vercel

1. Copy the variable names from `.env.example` into **Project → Settings →
   Environment Variables**.
2. Add `https://<your-domain>/api/auth/callback/github` as the OAuth callback
   on the GitHub App / OAuth app.
3. For a GitHub App, paste the PEM contents into `GITHUB_APP_PRIVATE_KEY`.
4. Set `SEED_DUMMY_DATA=false` if the deployment should start without the demo
   assignments and announcements.
5. Open `/api/health` after the first deploy; it names anything still missing.
   Without an org token or GitHub App credentials nobody resolves as owner or
   faculty, so every account looks unrostered.

### Granting faculty access

The recommended path is GitHub itself: add the teacher's account to the org's
**faculty team**. Membership is resolved on every request through
`resolveAccess()`, so a new member can open `/faculty` as soon as the membership
cache expires (≈60s on a cold miss, capped at 5 minutes once the team has
members). Team members default to the unrestricted **animator** role.

Per-class scoping is an in-app override: an org owner can open
`/faculty/requests` and add the teacher with a role (`subject-teacher`,
`elective-teacher`) plus the class teams they own. A class-scoped record narrows
what that teacher sees even if they are also in the GitHub faculty team.
Removing a teacher there deletes the scoped record only — remove them from the
GitHub team to actually revoke institute-wide faculty access.

### Student repositories must be public

Faculty review commit diffs on github.com with their own account, so Sprint 0
rejects a private repository (GitHub answers 404 for a repo the reviewer cannot
see). Set the repo to public before submitting; the form says so.

If GitHub is unreachable or rate-limited at the moment of submission, Sprint 0
is still recorded, just without a commit SHA. Later sprints then record their
own SHA and the diff for that sprint is skipped rather than failing the
submission. The review queue labels such a sprint "No commit captured".

Without the DynamoDB vars the app runs purely in-memory (fine locally; on
serverless deployments every instance loses state on restart). With them, all
store data (assignments, submissions, sprints, roster, teachers,
announcements, onboarding sessions) is mirrored to a single DynamoDB table
and shared across instances.

### Creating the DynamoDB table (once)

```bash
aws dynamodb create-table \
  --table-name kjit-classroom \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region <your-region>
```

Pair it with an IAM user whose policy allows `GetItem`, `BatchGetItem`,
`Query`, `PutItem`, `BatchWriteItem`, `DeleteItem` on that table's ARN (and
`DescribeTable`), then put its access key / secret into the Vercel env.

## Tech

- Next.js 16 (App Router)
- React 19 + Tailwind CSS 4
- TypeScript
- NextAuth v5 (GitHub App sign-in)
- GitHub REST API (commits, diffs, org invites, teams)
- DynamoDB (optional persistence)
- Vitest (unit tests, `npm test`)

## Features

### Students

- GitHub App sign-in
- Browse assignments filtered by class team
- Submit Sprint 0 (abstract + repo URL) and Sprints 1–3 (docs link + structured summary)
- Commit SHA captured server-side at each submission; diff metrics (commits, files changed, +/- lines) fetched from GitHub
- Pivot support — switch topic/repo mid-way at any sprint; previous sprints stay as history
- Timeline view of all sprints with diffs, docs, and review status

### Faculty

- Request access with the classes you teach → org owner approves
- Create assignments with problem statement, objectives, requirements, evaluation criteria, and assigned teams
- Per-assignment detail view: per-student sprint breakdown with checklist progress
- Review sprints in lab and record notes digitally; accept submissions (marks all sprints reviewed)
- 5-step student onboarding wizard (CSV upload → email matching → GitHub invite → team assignment)
- Filtered roster view per class

### Platform

- `status: active → completed (all sprints submitted) → accepted (faculty review)`
- Two-token auth: user token (per-session) + org token (GitHub App or PAT)
- Dynamic org owner detection (not hardcoded)
- Route gate (`src/proxy.ts`) protecting `/dashboard`, `/faculty`, `/assignments`, backed by per-role capability checks in `services/permissions.ts`

## Project structure

```
kjit-classroom/src/
├── app/                          # Next.js App Router — pages and API routes
│   ├── api/                      # assignments, submissions, sprints, review,
│   │                             # github (commit/compare proxy), org, roster,
│   │                             # teachers, onboard, requests, auth
│   ├── assignments/              # page (browse) + submit/ + timeline/ sprint UI
│   ├── dashboard/                # Student: submission tracker
│   ├── announcements/            # Announcements feed
│   ├── faculty/                  # dashboard, reviews, assignments (list + [id] + new),
│   │                             # onboard, roster, requests, request
│   ├── layout.tsx                # Root layout (SessionProvider, Navbar)
│   └── page.tsx                  # Landing page
│
├── backend/                      # Server-side logic
│   ├── auth.ts                   # NextAuth config (GitHub provider, JWT)
│   ├── types/                    # Shared interfaces (assignment, submission/sprints, roster, teacher)
│   ├── store/                    # In-memory stores — all state lost on restart
│   ├── services/                 # Business logic (assignment, submission, permissions, auth, roster)
│   └── github/                   # GitHub API helpers: client (tokens), repos (commit/diff), org, teams
│
├── frontend/                     # Client-side components, hooks, styles
│   ├── globals.css               # Tailwind CSS 4 imports
│   ├── hooks/                    # useSessionUser, useAssignments, useSubmissions
│   └── components/               # Navbar, Student (Assignments, Dashboard, SprintTimeline,
│                                 # SprintSubmitForm, SubmissionCard, ChecklistProgress) and
│                                 # Faculty (Dashboard, Assignments, AssignmentDetail, Review,
│                                 # NewAssignment, Onboard, Roster, Requests) components
└── proxy.ts                      # Route gate (/dashboard, /faculty, /assignments)
```

### Conventions

- Pages in `src/app/<route>/page.tsx` are thin wrappers that import and render a component.
- **Backend** (`src/backend/`) is never imported by components directly — only by API routes.
- **Frontend** (`src/frontend/`) never imports from `backend/` — it fetches `/api/*` routes.
- API routes call backend helpers via `@/backend/...`; components use `@/frontend/...`.
- Tailwind CSS 4 only. Colors come from the CSS custom properties in `src/frontend/globals.css` — components use `var(--color-*)` tokens (plus the remapped palette in the `@theme inline` block) instead of raw palette classes.
- No direct GitHub API calls from components; use the `/api/github/*` proxy routes.

## Docs

See [`docs/10-WIREFRAMES.md`](./docs/10-WIREFRAMES.md) for the sprint-model UI spec.

## Commands

```bash
npm run dev        # Dev server on :3000
npm run build      # Production build
npm run lint       # ESLint (flat config, eslint-config-next)
npx tsc --noEmit   # Type check
```