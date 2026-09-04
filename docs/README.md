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
| [08-FIGMA-DESIGN-BRIEF.md](./08-FIGMA-DESIGN-BRIEF.md) | Complete UI spec for Figma — colors, components, all 12 pages |

## Quick start

**Developers** — start with [05-SETUP-DEPLOYMENT.md](./05-SETUP-DEPLOYMENT.md)

**Designers** — use [08-FIGMA-DESIGN-BRIEF.md](./08-FIGMA-DESIGN-BRIEF.md) to generate Figma designs

**Faculty** — see [03-USER-FLOWS.md](./03-USER-FLOWS.md) for workflow diagrams

**Presentation** — open [01-PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md) for the big picture

## PDF export

```bash
# pandoc
for f in [0-9]*.md; do pandoc "$f" -o "${f%.md}.pdf"; done

# or use VS Code Markdown PDF extension
```
