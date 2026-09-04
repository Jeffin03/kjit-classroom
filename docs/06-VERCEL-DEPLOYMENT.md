# Vercel Deployment Checklist

## Option A: GitHub App (Recommended for Production)

### Step 1: Create GitHub App

1. Go to GitHub → Settings → Developer settings → GitHub Apps → New GitHub App
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
6. Note the **Client ID** (use as `AUTH_GITHUB_ID`)
7. Generate a **Client Secret** (use as `AUTH_GITHUB_SECRET`)
8. Generate a **Private Key** → download the `.pem` file
9. Install the app on your org (`kristu-jayanti-institute-of-technology`)
10. Note the **Installation ID** from the URL after installing

### Step 2: Store Private Key as Env Var

Copy the entire content of the `.pem` file and set it as `GITHUB_APP_PRIVATE_KEY` in Vercel:

```bash
# The private key starts with -----BEGIN RSA PRIVATE KEY-----
# When pasting into Vercel, newlines are preserved automatically
```

**Important:** When copying the private key content, make sure to include the `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----` lines.

## Option B: Personal Access Token (Quick Setup)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with scopes: `repo`, `read:org`, `admin:org`
3. Set as `GITHUB_ORG_TOKEN` in Vercel

## Environment Variables (Vercel Dashboard → Settings → Environment Variables)

### For GitHub App:

| Variable | Value |
|----------|-------|
| `AUTH_SECRET` | (copy from `.env.local`) |
| `AUTH_URL` | `https://kjit-classroom.vercel.app` |
| `AUTH_GITHUB_ID` | (GitHub App Client ID) |
| `AUTH_GITHUB_SECRET` | (GitHub App Client Secret) |
| `GITHUB_ORG` | `kristu-jayanti-institute-of-technology` |
| `GITHUB_APP_ID` | (GitHub App ID) |
| `GITHUB_APP_INSTALLATION_ID` | (Installation ID after installing on org) |
| `GITHUB_APP_PRIVATE_KEY` | (entire .pem file content) |

### For PAT:

| Variable | Value |
|----------|-------|
| `AUTH_SECRET` | (copy from `.env.local`) |
| `AUTH_URL` | `https://kjit-classroom.vercel.app` |
| `AUTH_GITHUB_ID` | (copy from `.env.local`) |
| `AUTH_GITHUB_SECRET` | (copy from `.env.local`) |
| `GITHUB_ORG` | `kristu-jayanti-institute-of-technology` |
| `GITHUB_ORG_TOKEN` | (your PAT) |

## GitHub OAuth App Configuration

If using a separate OAuth App for user sign-in (not the GitHub App's OAuth):

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Select your OAuth App
3. Update **Homepage URL**: `https://kjit-classroom.vercel.app`
4. Update **Callback URL**: `https://kjit-classroom.vercel.app/api/auth/callback/github`

## Common Errors

### `MissingSecret: Please define a 'secret'`
- `AUTH_SECRET` is not set in Vercel env vars

### `redirect_uri is not associated with this application`
- GitHub OAuth App callback URL still points to `localhost:3000`

### `GitHub App private key not found`
- `GITHUB_APP_PRIVATE_KEY` env var is not set or empty
- Make sure to paste the full .pem content including header/footer

## Deploy

Push to GitHub — Vercel auto-deploys from master branch.

## Post-Deploy Verification

1. Visit `https://kjit-classroom.vercel.app`
2. Click "Faculty" → Sign in with GitHub
3. Should redirect to GitHub OAuth → back to dashboard
4. Check Navbar shows "Faculty" link (if you're an org owner)
