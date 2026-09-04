# KJIT Classroom

GitHub-native project submission & portfolio management platform for Kristu Jayanti Institute of Technology.

Students fork assignment repos to their own GitHub accounts, solve problems, and submit via Pull Request. Completed work stays on their profile permanently — a portfolio that follows them beyond graduation.

## Quick start

```bash
npm install
cp .env.local.example .env.local   # fill in your values
npm run dev
```

Open http://localhost:3000.

## Tech

- Next.js 16 (App Router)
- React 19 + Tailwind CSS 4
- NextAuth v5 (GitHub OAuth)
- GitHub REST API (fork, PR, org management)
- TypeScript

## Features

### Students
- GitHub OAuth sign-in
- Browse assignments with problem statements
- One-click fork to own account
- Dashboard tracking submissions (forked → PR open → reviewed → accepted)

### Faculty
- Request animator (class teacher) role → admin approves
- Create assignments with problem statement, objectives, requirements, evaluation criteria
- System auto-creates private GitHub repo with standardized README
- 5-step student onboarding wizard (CSV upload → email matching → GitHub invite → team assignment)
- Code review with accept workflow
- Filtered roster view per class

### Platform
- Two-token auth: user token (per-session) + org token (GitHub App or PAT)
- Dynamic org owner detection (not hardcoded)
- Middleware protecting `/dashboard`, `/faculty`, `/assignments`
- GitHub App JWT for org-level operations (teams, invites, membership)

## Project structure

```
kjit-classroom/src/
├── app/                          # Next.js App Router — pages and API routes
│   ├── layout.tsx                # Root layout (SessionProvider, Navbar, Geist font)
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # (moved to frontend/)
│   ├── assignments/page.tsx      # Student: browse templates
│   ├── dashboard/page.tsx        # Student: submission tracker
│   ├── announcements/page.tsx    # Announcements feed
│   └── faculty/
│       ├── page.tsx              # Faculty dashboard
│       ├── request/page.tsx      # Request animator role
│       ├── requests/page.tsx     # Admin: approve/deny requests
│       ├── onboard/page.tsx      # 5-step onboarding wizard
│       ├── roster/page.tsx       # Student roster viewer
│       ├── review/page.tsx       # Code review with accept
│       └── assignments/
│           ├── page.tsx          # Faculty assignment list
│           └── new/page.tsx      # Create assignment form
│   └── api/                      # API routes (all under /api/*)
│       ├── auth/[...nextauth]/   # NextAuth handler
│       ├── assignments/          # GET all + POST create
│       ├── fork/                 # POST fork template
│       ├── pr/                   # POST create PR, GET list PRs
│       ├── roster/               # GET/POST roster + invite
│       ├── submissions/          # GET submissions + PUT status
│       ├── teachers/             # GET/POST teacher profiles
│       ├── requests/             # GET/PUT teacher request approval
│       ├── onboard/match/        # POST CSV email → GitHub matching
│       ├── onboard/invite/       # POST send invites + add to teams
│       └── org/owners/ + teams/  # GET dynamic org data
│
├── backend/                      # Server-side logic (auth, data, GitHub API)
│   ├── auth.ts                   # NextAuth config (GitHub provider, JWT)
│   └── lib/
│       ├── data.ts               # In-memory data store (ephemeral)
│       └── github.ts             # GitHub API helpers (fork, PR, org, teams)
│
├── frontend/                     # Client-side components and styles
│   ├── globals.css               # Tailwind CSS 4 imports
│   └── components/
│       ├── Navbar.tsx            # Role-aware navigation
│       ├── Home.tsx              # Landing page component
│       ├── Assignments.tsx       # Student assignment browser
│       ├── Dashboard.tsx         # Student submission tracker
│       ├── Announcements.tsx     # Announcements feed
│       ├── FacultyDashboard.tsx  # Faculty overview
│       ├── FacultyAssignments.tsx
│       ├── FacultyOnboard.tsx    # 5-step onboarding wizard
│       ├── FacultyRequest.tsx    # Request animator role
│       ├── FacultyRequests.tsx   # Admin: approve/deny
│       ├── FacultyReview.tsx     # Code review
│       ├── FacultyRoster.tsx     # Roster viewer
│       └── NewAssignment.tsx     # Create assignment form
│
└── middleware.ts                  # Route protection (/dashboard, /faculty, /assignments)
```

### Why this structure

The repo is split into **three layers** so responsibilities never bleed:

| Layer | Lives in | What it does |
|-------|----------|--------------|
| **Routing** | `src/app/` | Page.tsx files are thin wrappers (~5 lines). They import a component and render it. No logic. |
| **Backend** | `src/backend/` | Auth config, GitHub API calls, data store. Never imported by components directly — only by API routes. |
| **Frontend** | `src/frontend/` | All React components and CSS. Never imports from `backend/` directly — uses fetch to `/api/*` routes. |

### Conventions to follow

**When adding a new page:**
1. Create `src/app/<route>/page.tsx` — keep it under 10 lines, just import and render a component.
2. Create the component in `src/frontend/components/YourComponent.tsx`.
3. If the page needs API calls, add a route in `src/app/api/<route>/route.ts`.

**When adding a new API route:**
1. Create `src/app/api/<route>/route.ts`.
2. Import backend logic from `@/backend/lib/github.ts` or `@/backend/lib/data.ts`.
3. Use `auth()` from `@/backend/auth` to get the session and access token.

**Imports:**
- Frontend components → use `@/frontend/components/...`
- Backend logic → use `@/backend/...`
- API routes → use `@/backend/lib/...`
- Never import `backend/` from `frontend/` or vice versa.

**File naming:**
- Components: `PascalCase.tsx` (e.g., `FacultyReview.tsx`)
- API routes: `route.ts` (Next.js convention)
- Pages: `page.tsx` (Next.js convention)

**Styling:**
- Tailwind CSS 4 only. No inline styles, no CSS modules, no styled-components.
- Use the existing color palette: indigo-600 (primary), gray-900/600/500 (text), green (success), yellow (warning), red (error), blue (info).

**Data flow:**
- Components fetch from `/api/*` routes using `fetch()`.
- API routes call backend helpers from `@/backend/lib/`.
- Session/access token comes from `auth()` in API routes — pass to GitHub helpers.
- No direct GitHub API calls from components.

## Docs

See [`docs/`](./docs/) for architecture, API reference, setup guide, and data models.
