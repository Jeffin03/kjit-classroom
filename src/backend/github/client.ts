import jwt from "jsonwebtoken"
import { readFile } from "fs/promises"

const GITHUB_API = "https://api.github.com"

export const GITHUB_API_URL = GITHUB_API

let installationTokenCache: { token: string; expiresAt: number } | null = null

// The PEM can be supplied inline (GITHUB_APP_PRIVATE_KEY) or as a file path
// (GITHUB_APP_PRIVATE_KEY_PATH) — the path form is what AGENTS.md/README
// document, so both must work.
async function resolvePrivateKey(): Promise<string> {
  const inline = process.env.GITHUB_APP_PRIVATE_KEY
  if (inline?.trim()) {
    return inline.includes("\\n") ? inline.replace(/\\n/g, "\n") : inline
  }

  const path = process.env.GITHUB_APP_PRIVATE_KEY_PATH
  if (path?.trim()) {
    try {
      return await readFile(path, "utf8")
    } catch (err) {
      throw new Error(
        `GITHUB_APP_PRIVATE_KEY_PATH is set to "${path}" but the file could not be read: ${
          err instanceof Error ? err.message : String(err)
        }`
      )
    }
  }

  throw new Error(
    "GitHub App key not configured — set GITHUB_APP_PRIVATE_KEY (PEM contents) or GITHUB_APP_PRIVATE_KEY_PATH (path to the .pem file)."
  )
}

async function getInstallationToken(): Promise<string> {
  if (
    installationTokenCache &&
    installationTokenCache.expiresAt > Date.now()
  ) {
    return installationTokenCache.token
  }

  const appId = process.env.GITHUB_APP_ID?.trim()
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID?.trim()

  const missing = [
    !appId && "GITHUB_APP_ID",
    !installationId && "GITHUB_APP_INSTALLATION_ID",
  ].filter(Boolean)
  if (!appId || !installationId) {
    throw new Error(
      `GitHub App not configured: ${missing.join(" and ")} ${
        missing.length > 1 ? "are" : "is"
      } empty or unset in the environment.`
    )
  }

  const privateKey = await resolvePrivateKey()

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
  const pat = process.env.GITHUB_ORG_TOKEN?.trim()
  if (pat) {
    return pat
  }
  try {
    return await getInstallationToken()
  } catch (err) {
    throw new Error(
      `Org token not available. Set GITHUB_ORG_TOKEN (PAT) or configure GitHub App (GITHUB_APP_ID + GITHUB_APP_INSTALLATION_ID + GITHUB_APP_PRIVATE_KEY or GITHUB_APP_PRIVATE_KEY_PATH). Original error: ${
        err instanceof Error ? err.message : String(err)
      }`
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