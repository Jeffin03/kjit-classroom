import { githubFetch } from "./client"

export interface GitHubUser {
  login: string
  id: number
  avatar_url: string
  name: string | null
  email: string | null
}

export interface OrgInvitation {
  id: number
  login: string
  role: string
  state: string
}

export interface OrgMember {
  login: string
  id: number
  avatar_url: string
  role: string
}

export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const res = await githubFetch("/user", accessToken)
  if (!res.ok) throw new Error("Failed to fetch GitHub user")
  return res.json()
}

export async function getUserOrgs(accessToken: string) {
  const res = await githubFetch("/user/orgs", accessToken)
  if (!res.ok) throw new Error("Failed to fetch orgs")
  return res.json()
}

export async function getOrgOwners(
  token: string,
  org: string
): Promise<string[]> {
  const owners: string[] = []
  let page = 1

  while (true) {
    const res = await githubFetch(
      `/orgs/${org}/members?role=admin&per_page=100&page=${page}`,
      token
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

export async function inviteToOrg(
  token: string,
  org: string,
  username: string,
  role: string = "direct_member"
): Promise<OrgInvitation> {
  const res = await githubFetch(`/orgs/${org}/invitations`, token, {
    method: "POST",
    body: JSON.stringify({ username, role }),
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
  const res = await githubFetch(`/orgs/${org}/members/${username}`, token)
  return res.ok
}

export async function getUserByEmail(
  token: string,
  org: string,
  email: string
): Promise<GitHubUser | null> {
  const res = await githubFetch(
    `/orgs/${org}/members?query=${encodeURIComponent(email)}`,
    token
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.items?.[0] || null
}