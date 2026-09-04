# KJIT Classroom

GitHub-native project submission & portfolio management platform for Kristu Jayanti Institute of Technology.

Students fork project templates to their own GitHub accounts, build real projects, and submit via Pull Request. Completed work stays on their profile permanently — a portfolio that follows them beyond graduation.

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
- Browse assignment templates
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

## Docs

See [`docs/`](./docs/) for architecture, API reference, setup guide, and data models.
