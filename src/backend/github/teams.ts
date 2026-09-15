import { githubFetch } from "./client"

export interface Team {
  id: number
  name: string
  slug: string
  description: string | null
  members_count: number
}

export async function listTeams(token: string, org: string): Promise<Team[]> {
  const res = await githubFetch(`/orgs/${org}/teams?per_page=100`, token)
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
  const res = await githubFetch(`/orgs/${org}/teams`, token, {
    method: "POST",
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
  const res = await githubFetch(
    `/orgs/${org}/teams/${teamSlug}/memberships/${username}`,
    token,
    { method: "PUT", body: JSON.stringify({ role: "member" }) }
  )
  if (!res.ok && res.status !== 422) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      err.message || `Failed to add ${username} to team ${teamSlug}`
    )
  }
}

export async function addTeamMaintainer(
  token: string,
  org: string,
  teamSlug: string,
  username: string
): Promise<void> {
  const res = await githubFetch(
    `/orgs/${org}/teams/${teamSlug}/memberships/${username}`,
    token,
    { method: "PUT", body: JSON.stringify({ role: "maintainer" }) }
  )
  if (!res.ok && res.status !== 422) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      err.message || `Failed to add maintainer ${username} to team ${teamSlug}`
    )
  }
}

export async function isTeamMember(
  token: string,
  org: string,
  teamSlug: string,
  username: string
): Promise<boolean> {
  const res = await githubFetch(
    `/orgs/${org}/teams/${teamSlug}/members/${username}`,
    token
  )
  return res.ok
}