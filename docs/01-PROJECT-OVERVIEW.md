# KJIT Classroom — Project Overview

**Version:** 2.0 — **Date:** September 2026 — **Status:** MVP deployed

---

## What it is

A web platform that replaces GitHub Classroom (shutting down Aug 28, 2026). Students fork project templates to their own GitHub accounts, work on them, and submit via Pull Request. Completed projects stay on the student's profile permanently — a real portfolio, not disposable homework.

## Why it exists

GitHub Classroom is shutting down. Its replacement, Classroom 50, requires paid GitHub Team/Enterprise plans and still uses org-owned repos. KJIT Classroom gives the department a zero-cost, portfolio-friendly alternative.

| | GitHub Classroom | KJIT Classroom |
|--|-----------------|----------------|
| Repo ownership | Org-owned | Student-owned |
| Portfolio value | Disposable | Permanent |
| Workflow | Clone + commit | Fork + PR |
| Cost | Moving to paid | Free tier |
| Student profile | No impact | Enhances it |

---

## Org context

**Organization:** `kristu-jayanti-institute-of-technology` on GitHub

**Teams (13 class sections):**
- MCA: A, B, C, D
- MSc CS: A, B
- MSc Cyber Security: A, B
- MSc Data Science: A, B
- MSc AI: A, B
- MSc IT: A, B

**Email format:** `25mcab24@kristujayanti.com` (roll-number-based)

**Org owners (admins):** `murushr26`, `rkumarh2008`, `velmurugan4` (fetched dynamically via GitHub API)

---

## Features built

### Student side

- GitHub OAuth sign-in
- Browse assignment templates
- One-click fork to own account
- Dashboard tracking submissions (forked → PR open → reviewed → accepted)
- Announcements page

### Faculty side

- **Teacher role request** — Teachers request animator (class teacher) role → org owner approves on portal
- **Assignment creation** — Teacher fills form (title, problem statement, objectives, requirements, evaluation criteria, submission guidelines) → system creates private GitHub repo with standardized README
- **5-step onboarding wizard** — Select class → upload CSV (roll_no, college_email) → verify matched/unmatched accounts → confirm → system sends GitHub org invites + team assignments
- **Roster viewer** — Filtered table view with search
- **Code review** — View submission details, accept workflow (marks "Accepted" in app, teacher reviews code on GitHub)

### Platform

- Two-token auth architecture (user token + org token)
- GitHub App JWT for org-level operations
- Dynamic org owner detection (no hardcoded usernames)
- Middleware protecting `/dashboard`, `/faculty`, `/assignments`
- In-memory data store (MVP; Supabase planned for production)

---

## Tech stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16.3 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript 5 |
| Auth | NextAuth v5 beta (GitHub provider) |
| GitHub API | REST v3 (fork, PR, org, teams) |
| Hosting | Vercel (free tier) |

---

## Project structure

```
kjit-classroom/src/
├── app/                          # Next.js App Router — pages and API routes
│   ├── layout.tsx                # Root layout (SessionProvider, Navbar, Geist font)
│   ├── page.tsx                  # Landing page
│   ├── assignments/page.tsx      # Student: browse templates
│   ├── dashboard/page.tsx        # Student: submission tracker
│   ├── announcements/page.tsx    # Announcements feed
│   ├── faculty/
│   │   ├── page.tsx              # Faculty dashboard
│   │   ├── request/page.tsx      # Request animator role
│   │   ├── requests/page.tsx     # Admin: approve/deny requests
│   │   ├── onboard/page.tsx      # 5-step onboarding wizard
│   │   ├── roster/page.tsx       # Student roster viewer
│   │   ├── review/page.tsx       # Code review with accept
│   │   └── assignments/
│   │       ├── page.tsx          # Faculty assignment list
│   │       └── new/page.tsx      # Create assignment form
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

### Architecture: three-layer split

| Layer | Location | Responsibility |
|-------|----------|---------------|
| **Routing** | `src/app/` | Page.tsx files are thin wrappers (~5 lines). Import a component, render it. |
| **Backend** | `src/backend/` | Auth config, GitHub API calls, data store. Only used by API routes. |
| **Frontend** | `src/frontend/` | All React components and CSS. Never imports from `backend/`. |

**Rule:** Frontend components call `/api/*` routes via `fetch()`. API routes call backend helpers. No direct imports across the boundary.

---

## Auth model

Two token layers:

1. **User token** — per-session JWT from GitHub OAuth. Used for fork/PR on behalf of students.

2. **Org token** — GitHub App installation token (preferred) or PAT fallback. Used for org-level ops: invites, teams, membership checks.

GitHub App flow: generate a short-lived JWT signed with the private key → exchange for an installation token → cache for 50 minutes.

OAuth scopes: `read:user user:email repo read:org`

---

## Future phases

| Phase | What |
|-------|------|
| 2 | Webhook integration for live PR status updates |
| 3 | Supabase database to replace in-memory store |
| 4 | GitHub Actions for autograding |
| 5 | Email notifications |
| 6 | Analytics dashboard |
