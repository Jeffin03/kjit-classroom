# KJIT Classroom

GitHub-native project submission & portfolio management platform for Kristu Jayanti Institute of Technology.

---

## Documentation

| Document | What it covers |
|----------|---------------|
| [01-PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md) | What this is, why it exists, features, tech stack, org context |
| [02-ARCHITECTURE.md](./02-ARCHITECTURE.md) | System design, auth model, role hierarchy, data flows |
| [03-USER-FLOWS.md](./03-USER-FLOWS.md) | Student, faculty, and admin step-by-step journeys |
| [04-API-REFERENCE.md](./04-API-REFERENCE.md) | All 16 API endpoints with request/response examples |
| [05-SETUP-DEPLOYMENT.md](./05-SETUP-DEPLOYMENT.md) | Local dev, GitHub App setup, Vercel deploy |
| [06-DATA-MODELS.md](./06-DATA-MODELS.md) | TypeScript interfaces, in-memory store, Supabase schema |
| [06-VERCEL-DEPLOYMENT.md](./06-VERCEL-DEPLOYMENT.md) | Vercel-specific deployment checklist |

## Quick start

**Developers** — start with [05-SETUP-DEPLOYMENT.md](./05-SETUP-DEPLOYMENT.md)

**Faculty** — see [03-USER-FLOWS.md](./03-USER-FLOWS.md) for workflow diagrams

**Presentation** — open [01-PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md) for the big picture

## PDF export

```bash
# pandoc
for f in [0-9]*.md; do pandoc "$f" -o "${f%.md}.pdf"; done

# or use VS Code Markdown PDF extension
```
