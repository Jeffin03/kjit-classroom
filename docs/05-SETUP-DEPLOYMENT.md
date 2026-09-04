# KJIT Classroom — Setup & Deployment

**Version:** 2.0 — **Date:** September 2026

---

## Prerequisites

- Node.js 18+
- npm
- Git
- GitHub account with org owner access
- Vercel account (free tier works)

---

## Local setup

```bash
git clone https://github.com/your-org/kjit-classroom.git
cd kjit-classroom
npm install
```

### Create GitHub OAuth App

1. GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App
2. Application name: `KJIT Classroom`
3. Homepage URL: `http://localhost:3000`
4. Callback URL: `http://localhost:3000/api/auth/callback/github`
5. Copy Client ID and Client Secret

### Create `.env.local`

```env
AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
AUTH_GITHUB_ID=your-client-id
AUTH_GITHUB_SECRET=your-client-secret
GITHUB_ORG=your-org-name

# Option A: Personal Access Token (simpler)
GITHUB_ORG_TOKEN=ghp_your-token-here

# Option B: GitHub App (production)
# GITHUB_APP_ID=123456
# GITHUB_APP_INSTALLATION_ID=123456
# GITHUB_APP_PRIVATE_KEY_PATH=./private-key.pem
```

### Run

```bash
npm run dev
```

Open http://localhost:3000.

---

## GitHub App setup (for org management)

1. GitHub → Settings → Developer Settings → GitHub Apps → New GitHub App
2. Set permissions:
   - Organization: Members (R/W), Teams (R/W)
   - Repository: Contents (R/W), Pull Requests (R/W), Metadata (read)
3. Install on your org
4. Generate a private key, save `.pem` to project root
5. Note the App ID and Installation ID from the URL
6. Add to `.env.local`

---

## GitHub Org Token (PAT) — quick alternative

1. GitHub → Settings → Developer Settings → Personal Access Tokens → Generate new token
2. Scopes: `admin:org`, `repo`
3. Add as `GITHUB_ORG_TOKEN` in `.env.local`

---

## Deploy to Vercel

```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/your-org/kjit-classroom.git
git push -u origin main
```

Then on vercel.com:
1. Import the repo
2. Add all `.env.local` variables
3. Deploy

After deploy, update the OAuth App callback URL to `https://your-domain.vercel.app/api/auth/callback/github`.

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `AUTH_SECRET` | Yes | NextAuth session signing |
| `AUTH_GITHUB_ID` | Yes | GitHub OAuth Client ID |
| `AUTH_GITHUB_SECRET` | Yes | GitHub OAuth Client Secret |
| `GITHUB_ORG` | Yes | GitHub org name |
| `GITHUB_ORG_TOKEN` | Option A | PAT for org ops |
| `GITHUB_APP_ID` | Option B | GitHub App ID |
| `GITHUB_APP_INSTALLATION_ID` | Option B | Installation ID |
| `GITHUB_APP_PRIVATE_KEY_PATH` | Option B | Path to .pem file |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| OAuth redirect loop | Regenerate `AUTH_SECRET` |
| Fork fails | Check OAuth scopes include `repo` |
| Invite fails | Verify `GITHUB_ORG_TOKEN` or GitHub App config |
| Build fails | Run `npx tsc --noEmit` to check types |
