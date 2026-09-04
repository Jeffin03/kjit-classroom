import jwt from "jsonwebtoken"

const GITHUB_API = "https://api.github.com"

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

export interface GitHubUser {
  login: string
  id: number
  avatar_url: string
  name: string | null
  email: string | null
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  fork: boolean
  parent?: {
    full_name: string
  }
  default_branch: string
}

export interface GitHubPR {
  id: number
  number: number
  title: string
  html_url: string
  state: string
  user: {
    login: string
  }
  head: {
    ref: string
    repo: {
      full_name: string
    } | null
  }
  base: {
    ref: string
  }
  created_at: string
  updated_at: string
}

export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const res = await fetch(`${GITHUB_API}/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  })
  if (!res.ok) throw new Error("Failed to fetch GitHub user")
  return res.json()
}

export async function getUserOrgs(accessToken: string) {
  const res = await fetch(`${GITHUB_API}/user/orgs`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  })
  if (!res.ok) throw new Error("Failed to fetch orgs")
  return res.json()
}

export async function forkRepo(
  accessToken: string,
  owner: string,
  repo: string,
  org?: string
): Promise<GitHubRepo> {
  const body: Record<string, unknown> = {}
  if (org) body.organization = org

  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/forks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || "Failed to fork repository")
  }
  return res.json()
}

export async function createPR(
  accessToken: string,
  owner: string,
  repo: string,
  head: string,
  base: string,
  title: string,
  body: string
): Promise<GitHubPR> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, body, head, base }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || "Failed to create PR")
  }
  return res.json()
}

export async function listPRs(
  accessToken: string,
  owner: string,
  repo: string,
  state: string = "all"
): Promise<GitHubPR[]> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls?state=${state}&per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  )
  if (!res.ok) throw new Error("Failed to list PRs")
  return res.json()
}

export async function getRepoInfo(
  accessToken: string,
  owner: string,
  repo: string
): Promise<GitHubRepo> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  })
  if (!res.ok) throw new Error("Failed to get repo info")
  return res.json()
}

export async function checkForkExists(
  accessToken: string,
  owner: string,
  repo: string
): Promise<GitHubRepo | null> {
  const user = await getGitHubUser(accessToken)
  const res = await fetch(
    `${GITHUB_API}/repos/${user.login}/${repo}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  )
  if (res.status === 404) return null
  if (!res.ok) throw new Error("Failed to check fork")
  const data = await res.json()
  if (data.fork && data.parent?.full_name === `${owner}/${repo}`) {
    return data
  }
  return null
}

export interface OrgInvitation {
  id: number
  login: string
  role: string
  state: string
}

export async function inviteToOrg(
  token: string,
  org: string,
  username: string,
  role: string = "direct_member"
): Promise<OrgInvitation> {
  const res = await fetch(`${GITHUB_API}/orgs/${org}/invitations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      invitee_id: 0,
      username,
      role,
    }),
  })

  if (res.status === 201) return res.json()

  const err = await res.json().catch(() => ({}))

  if (res.status === 422 && err.errors?.[0]?.code === "already_exists") {
    return { id: 0, login: username, role, state: "already_member" }
  }

  throw new Error(err.message || `Failed to invite ${username} to org`)
}

export async function checkOrgMember(
  token: string,
  org: string,
  username: string
): Promise<boolean> {
  const res = await fetch(
    `${GITHUB_API}/orgs/${org}/members/${username}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  )
  return res.ok
}

export interface Team {
  id: number
  name: string
  slug: string
  description: string | null
  members_count: number
}

export async function listTeams(
  token: string,
  org: string
): Promise<Team[]> {
  const res = await fetch(`${GITHUB_API}/orgs/${org}/teams?per_page=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  })
  if (!res.ok) throw new Error("Failed to list teams")
  return res.json()
}

export async function createTeam(
  token: string,
  org: string,
  name: string,
  description: string = "",
  privacy: "closed" | "secret" = "closed"
): Promise<Team> {
  const res = await fetch(`${GITHUB_API}/orgs/${org}/teams`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description, privacy }),
  })

  if (res.status === 201) return res.json()

  const err = await res.json().catch(() => ({}))

  if (res.status === 422 && err.errors?.[0]?.code === "already_exists") {
    const teams = await listTeams(token, org)
    const existing = teams.find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    )
    if (existing) return existing
  }

  throw new Error(err.message || `Failed to create team ${name}`)
}

export async function addTeamMember(
  token: string,
  org: string,
  teamSlug: string,
  username: string
): Promise<void> {
  const res = await fetch(
    `${GITHUB_API}/orgs/${org}/teams/${teamSlug}/memberships/${username}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "member" }),
    }
  )
  if (!res.ok && res.status !== 422) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      err.message || `Failed to add ${username} to team ${teamSlug}`
    )
  }
}

export async function isTeamMember(
  token: string,
  org: string,
  teamSlug: string,
  username: string
): Promise<boolean> {
  const res = await fetch(
    `${GITHUB_API}/orgs/${org}/teams/${teamSlug}/members/${username}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  )
  return res.ok
}

export interface OrgMember {
  login: string
  id: number
  avatar_url: string
  role: string
}

export async function getOrgOwners(
  token: string,
  org: string
): Promise<string[]> {
  const owners: string[] = []
  let page = 1

  while (true) {
    const res = await fetch(
      `${GITHUB_API}/orgs/${org}/members?role=admin&per_page=100&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    )
    if (!res.ok) throw new Error("Failed to fetch org owners")
    const members: OrgMember[] = await res.json()
    if (members.length === 0) break
    owners.push(...members.map((m) => m.login))
    if (members.length < 100) break
    page++
  }

  return owners
}

export async function getUserByEmail(
  token: string,
  org: string,
  email: string
): Promise<GitHubUser | null> {
  const res = await fetch(
    `${GITHUB_API}/orgs/${org}/members?query=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.items?.[0] || null
}

export async function addTeamMaintainer(
  token: string,
  org: string,
  teamSlug: string,
  username: string
): Promise<void> {
  const res = await fetch(
    `${GITHUB_API}/orgs/${org}/teams/${teamSlug}/memberships/${username}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "maintainer" }),
    }
  )
  if (!res.ok && res.status !== 422) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      err.message || `Failed to add maintainer ${username} to team ${teamSlug}`
    )
  }
}

export interface RepoCreationResult {
  html_url: string
  clone_url: string
  name: string
}

export async function createRepoWithREADME(
  token: string,
  org: string,
  name: string,
  description: string,
  readmeContent: string
): Promise<RepoCreationResult> {
  const createRes = await fetch(`${GITHUB_API}/orgs/${org}/repos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description,
      private: true,
      auto_init: false,
    }),
  })

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}))
    throw new Error(err.message || `Failed to create repo ${name}`)
  }

  const repo = await createRes.json()

  const readmeBase64 = Buffer.from(readmeContent).toString("base64")

  const readmeRes = await fetch(
    `${GITHUB_API}/repos/${org}/${name}/contents/README.md`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Initial commit: Add assignment README",
        content: readmeBase64,
      }),
    }
  )

  if (!readmeRes.ok) {
    const err = await readmeRes.json().catch(() => ({}))
    throw new Error(err.message || "Failed to create README")
  }

  return {
    html_url: repo.html_url,
    clone_url: repo.clone_url,
    name: repo.name,
  }
}
