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
git clone https://github.com/Jeffin03/kjit-classroom.git
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
GITHUB_ORG=kristu-jayanti-institute-of-technology

# Option A: Personal Access Token (simpler)
GITHUB_ORG_TOKEN=ghp_your-token-here

# Option B: GitHub App (production)
# GITHUB_APP_ID=123456
# GITHUB_APP_INSTALLATION_ID=123456
# GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

### Run

```bash
npm run dev
```

Open http://localhost:3000.

---

## GitHub App setup (for production)

### Step 1: Create the app

1. GitHub → Settings → Developer Settings → GitHub Apps → New GitHub App
2. Fill in:
   - **GitHub App name**: `KJIT Classroom`
   - **Homepage URL**: `https://kjit-classroom.vercel.app`
   - **Callback URL**: `https://kjit-classroom.vercel.app/api/auth/callback/github`
   - **Webhook URL**: Leave empty (uncheck Active)
3. Set permissions:
   - **Organization permissions**: Members (Read & Write), Teams (Read & Write)
   - **Repository permissions**: Contents (Read & Write), Pull requests (Read & Write)
4. Under "Where can this GitHub App be installed?", select **Only on this account**
5. Click "Create GitHub App"

### Step 2: Install on your org

1. After creating, go to the app settings
2. Click "Install App" → select `kristu-jayanti-institute-of-technology`
3. Note the **Installation ID** from the URL (e.g. `https://github.com/organizations/kristu-jayanti-institute-of-technology/settings/installations/12345678`)

### Step 3: Store private key

1. Generate a private key (downloads a `.pem` file)
2. Copy the entire content of the `.pem` file
3. Set as `GITHUB_APP_PRIVATE_KEY` env var (include `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`)

---

## GitHub Org Token (PAT) — quick alternative

1. GitHub → Settings → Developer Settings → Personal Access Tokens → Generate new token
2. Scopes: `admin:org`, `repo`
3. Add as `GITHUB_ORG_TOKEN` in `.env.local`

---

## Deploy to Vercel

```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/Jeffin03/kjit-classroom.git
git push -u origin master
```

Then on vercel.com:
1. Import the repo
2. Add all `.env.local` variables (see table below)
3. Deploy

After deploy, update the OAuth App callback URL to `https://kjit-classroom.vercel.app/api/auth/callback/github`.

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `AUTH_SECRET` | Yes | NextAuth session signing |
| `AUTH_URL` | Yes (prod) | Production URL for NextAuth |
| `AUTH_GITHUB_ID` | Yes | GitHub OAuth Client ID |
| `AUTH_GITHUB_SECRET` | Yes | GitHub OAuth Client Secret |
| `GITHUB_ORG` | Yes | GitHub org name |
| `GITHUB_ORG_TOKEN` | Option A | PAT for org ops |
| `GITHUB_APP_ID` | Option B | GitHub App ID |
| `GITHUB_APP_INSTALLATION_ID` | Option B | Installation ID |
| `GITHUB_APP_PRIVATE_KEY` | Option B | Private key content (.pem) |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `MissingSecret` | Set `AUTH_SECRET` in Vercel env vars |
| `redirect_uri` error | Update OAuth App callback URL to Vercel domain |
| Fork fails | Check OAuth scopes include `repo` |
| Invite fails | Verify `GITHUB_ORG_TOKEN` or GitHub App config |
| Private key not found | Use `GITHUB_APP_PRIVATE_KEY` env var (not file path) |
| Build fails | Run `npx tsc --noEmit` to check types |
