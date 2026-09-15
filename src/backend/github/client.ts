import jwt from "jsonwebtoken"

const GITHUB_API = "https://api.github.com"

export const GITHUB_API_URL = GITHUB_API

let installationTokenCache: { token: string; expiresAt: number } | null = null

async function getInstallationToken(): Promise<string> {
  if (
    installationTokenCache &&
    installationTokenCache.expiresAt > Date.now()
  ) {
    return installationTokenCache.token
  }

  const appId = process.env.GITHUB_APP_ID
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID
  const privateKeyContent = process.env.GITHUB_APP_PRIVATE_KEY

  if (!appId || !installationId || !privateKeyContent) {
    throw new Error(
      "GitHub App not configured. Set GITHUB_APP_ID, GITHUB_APP_INSTALLATION_ID, and GITHUB_APP_PRIVATE_KEY"
    )
  }

  const privateKey = privateKeyContent.includes("\\n")
    ? privateKeyContent.replace(/\\n/g, "\n")
    : privateKeyContent

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iat: now - 60,
    exp: now + 600,
    iss: appId,
  }

  const jwtToken = jwt.sign(payload, privateKey, { algorithm: "RS256" })

  const tokenRes = await fetch(
    `${GITHUB_API}/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  )

  if (!tokenRes.ok) {
    const err = await tokenRes.json()
    throw new Error(err.message || "Failed to get installation token")
  }

  const tokenData = await tokenRes.json()

  installationTokenCache = {
    token: tokenData.token,
    expiresAt: Date.now() + 50 * 60 * 1000,
  }

  return tokenData.token
}

export async function getOrgToken(): Promise<string> {
  if (process.env.GITHUB_ORG_TOKEN) {
    return process.env.GITHUB_ORG_TOKEN
  }
  try {
    return await getInstallationToken()
  } catch (err) {
    throw new Error(
      `Org token not available. Set GITHUB_ORG_TOKEN (PAT) or configure GitHub App (GITHUB_APP_ID + GITHUB_APP_INSTALLATION_ID + GITHUB_APP_PRIVATE_KEY). Original error: ${err instanceof Error ? err.message : String(err)}`
    )
  }
}

export async function githubFetch(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${token}`)
  headers.set("Accept", "application/vnd.github+json")
  headers.set("X-GitHub-Api-Version", "2022-11-28")
  if (init.body) headers.set("Content-Type", "application/json")
  return fetch(`${GITHUB_API}${path}`, { ...init, headers })
}