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

- GitHub OAuth sign-in
- Browse and fork assignment templates
- Student dashboard tracking submissions
- Faculty dashboard with submission stats
- CSV roster upload with auto-org-invite and team creation
- Announcements page

## Docs

See [`docs/`](./docs/) for architecture, API reference, setup guide, and data models.
