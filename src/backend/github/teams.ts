import { githubFetch } from "./client"
import { githubErrorCodes, githubErrorMessage } from "./errors"

export interface Team {
  id: number
  name: string
  slug: string
  description: string | null
  members_count: number
}

export async function listTeams(token: string, org: string): Promise<Team[]> {
  // Callers (findTeam, onboarding, approvals) resolve a team from this list,
  // so a single page would silently miss teams past the first 100.
  const perPage = 100
  const maxPages = 10
  const teams: Team[] = []

  for (let page = 1; page <= maxPages; page++) {
    const res = await githubFetch(
      `/orgs/${org}/teams?per_page=${perPage}&page=${page}`,
      token
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(githubErrorMessage(err, "Failed to list teams", res.status))
    }
    const batch = await res.json()
    if (!Array.isArray(batch)) throw new Error("Failed to list teams")
    teams.push(...batch)
    if (batch.length < perPage) break
  }

  return teams
}

/**
 * Resolves a team from the names GitHub actually returned rather than
 * re-deriving a slug locally. `POST /orgs/{org}/teams` has no slug parameter —
 * GitHub generates the slug itself (lowercased, spaces to `-`, special
 * characters dropped), so a locally derived slug can silently miss.
 *
 * A slug, when known, wins over a name because slugs are unique while team
 * names are not.
 */
export async function findTeam(
  token: string,
  org: string,
  selector: { name?: string; slug?: string }
): Promise<Team | null> {
  const teams = await listTeams(token, org)

  const slug = selector.slug?.trim().toLowerCase()
  if (slug) {
    const bySlug = teams.find((t) => t.slug.toLowerCase() === slug)
    if (bySlug) return bySlug
  }

  const name = selector.name?.trim().toLowerCase()
  if (name) {
    const byName = teams.find((t) => t.name.trim().toLowerCase() === name)
    if (byName) return byName
  }

  return null
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
  if (res.status === 422 && githubErrorCodes(err).includes("already_exists")) {
    const teams = await listTeams(token, org)
    const existing = teams.find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    )
    if (existing) return existing
  }

  throw new Error(githubErrorMessage(err, `Failed to create team ${name}`, res.status))
}

export type MembershipResult = "added" | "already-member"

async function putMembership(
  token: string,
  org: string,
  teamSlug: string,
  username: string,
  role: "member" | "maintainer"
): Promise<MembershipResult> {
  const res = await githubFetch(
    `/orgs/${org}/teams/${teamSlug}/memberships/${username}`,
    token,
    {
      method: "PUT",
      // GitHub answers 302 when the user is already on the team. Without this,
      // fetch would follow the redirect and we could not tell the two cases
      // apart — or report real failures at all.
      redirect: "manual",
      body: JSON.stringify({ role }),
    }
  )

  if (res.status === 200) return "added"
  if (res.status === 302) return "already-member"

  const err = await res.json().catch(() => ({}))

  if (res.status === 404) {
    throw new Error(
      `Team "${teamSlug}" or user "${username}" not found in ${org}. Check the team slug and that the user exists.`
    )
  }

  // 422 here means a real refusal (SSO enforcement, seat not available,
  // user is not an org member, ...), not a no-op, so it must surface to the
  // caller — including GitHub's errors[] detail, since the bare message is
  // often just "Validation Failed".
  throw new Error(
    githubErrorMessage(
      err,
      `Failed to add ${username} to team ${teamSlug} as ${role}`,
      res.status
    )
  )
}

export function addTeamMember(
  token: string,
  org: string,
  teamSlug: string,
  username: string
): Promise<MembershipResult> {
  return putMembership(token, org, teamSlug, username, "member")
}

export function addTeamMaintainer(
  token: string,
  org: string,
  teamSlug: string,
  username: string
): Promise<MembershipResult> {
  return putMembership(token, org, teamSlug, username, "maintainer")
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

/**
 * Removes a student from a class team. 404 (never on the team) counts as
 * success so callers can converge instead of failing on already-removed users.
 */
export async function removeTeamMember(
  token: string,
  org: string,
  teamSlug: string,
  username: string
): Promise<boolean> {
  const res = await githubFetch(
    `/orgs/${org}/teams/${teamSlug}/memberships/${username}`,
    token,
    { method: "DELETE" }
  )
  return res.status === 204 || res.status === 404
}