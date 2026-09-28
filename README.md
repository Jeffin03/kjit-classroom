# KJIT Classroom

GitHub-native sprint-based PBL submission & portfolio management platform for Kristu Jayanti Institute of Technology.

Students build projects in their own GitHub repos and submit progressively across Sprint 0–3 (abstract, progress, docs links, commit hashes, and pivot support). Faculty reviews in lab and records notes/acceptance in the app. The app is a thin orchestration layer on top of the GitHub API.

## Quick start

```bash
npm install
# create .env.local with AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET,
# GITHUB_ORG, and either GITHUB_ORG_TOKEN or the GITHUB_APP_* trio
npm run dev
```

Open http://localhost:3000.

## Tech

- Next.js 16 (App Router)
- React 19 + Tailwind CSS 4
- TypeScript
- NextAuth v5 (GitHub OAuth)
- GitHub REST API (commits, diffs, org invites, teams)

## Features

### Students

- GitHub OAuth sign-in
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