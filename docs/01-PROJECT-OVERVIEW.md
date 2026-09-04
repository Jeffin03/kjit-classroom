# KJIT Classroom — Project Overview

**Version:** 2.0 — **Date:** September 2026 — **Status:** MVP built

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

## Features built

### Student side

- GitHub OAuth sign-in
- Browse assignment templates
- One-click fork to own account
- Dashboard tracking submissions (forked → PR open → reviewed → merged)
- Announcements page

### Faculty side

- Dashboard viewing all student submissions with stats
- Filter submissions by assignment
- CSV roster upload with preview
- Auto-invite students to GitHub org
- Auto-create teams and assign students
- Link to onboard more students

### Platform

- Next.js 16 app with Tailwind CSS
- NextAuth v5 (GitHub OAuth)
- GitHub App integration (JWT installation tokens) for org-level ops
- In-memory data store (MVP; moves to Supabase in production)
- Middleware protecting `/dashboard`, `/faculty`, `/assignments`

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
kjit-classroom/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing page
│   │   ├── layout.tsx               # Root layout + SessionProvider + Navbar
│   │   ├── assignments/page.tsx     # Browse & fork templates
│   │   ├── dashboard/page.tsx       # Student submission tracker
│   │   ├── faculty/
│   │   │   ├── page.tsx             # Faculty submission dashboard
│   │   │   └── onboarding/page.tsx  # CSV upload + org invite
│   │   ├── announcements/page.tsx   # Announcements feed
│   │   └── api/
│   │       ├── auth/[...nextauth]/  # NextAuth handler
│   │       ├── assignments/         # GET assignments
│   │       ├── fork/                # POST fork template
│   │       ├── pr/                  # POST create PR, GET list PRs
│   │       ├── roster/              # GET/POST roster + invite
│   │       └── submissions/         # GET submissions
│   ├── auth.ts                      # NextAuth config
│   ├── middleware.ts                # Route protection
│   ├── components/Navbar.tsx        # Top nav
│   └── lib/
│       ├── github.ts                # GitHub API helpers (fork, PR, org, teams)
│       └── data.ts                  # In-memory data store
├── .env.local                       # Secrets (not committed)
├── package.json
└── docs/
```

---

## Future phases

| Phase | What |
|-------|------|
| 2 | Webhook integration for live PR status updates |
| 3 | Supabase database to replace in-memory store |
| 4 | GitHub Actions for autograding |
| 5 | Email notifications |
| 6 | Analytics dashboard |
