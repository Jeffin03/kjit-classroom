import { githubFetch } from "./client"
import { githubErrorCodes, githubErrorMessage } from "./errors"

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

// GitHub reports 422s as { message: "Validation Failed", errors: [...] },
// which is useless on its own — the shared helpers below flatten them.
export async function inviteToOrg(
  token: string,
  org: string,
  identity: { login: string; githubId?: number; email?: string },
  role: string = "direct_member",
  teamIds: number[] = []
): Promise<OrgInvitation> {
  // GitHub's Create-organization-invitation endpoint takes invitee_id (the
  // numeric user ID) OR email — there is no `username`/`login` field. Sending
  // an unknown field means no invitee at all, which GitHub answers with
  // 422 "Validation Failed".
  const invitee: Record<string, unknown> = identity.githubId
    ? { invitee_id: identity.githubId }
    : identity.email
      ? { email: identity.email }
      : {}

  if (!("invitee_id" in invitee) && !("email" in invitee)) {
    throw new Error(
      `Cannot invite "${identity.login}": no GitHub user ID or college email available.`
    )
  }

  const res = await githubFetch(`/orgs/${org}/invitations`, token, {
    method: "POST",
    // `team_ids` is the only way to get an invited (not yet accepted) user onto
    // a team — the membership endpoint rejects them until they accept.
    body: JSON.stringify({ ...invitee, role, ...(teamIds.length ? { team_ids: teamIds } : {}) }),
  })

  if (res.status === 201) return res.json()

  const err = await res.json().catch(() => ({}))
  const codes = githubErrorCodes(err)

  // Already a member, or an invitation is already pending.
  if (res.status === 422 && codes.includes("already_exists")) {
    return { id: 0, login: identity.login, role, state: "already_member" }
  }

  if (codes.includes("not_found")) {
    throw new Error(
      `GitHub user "${identity.login}" could not be resolved — check the username in the CSV.`
    )
  }

  throw new Error(
    githubErrorMessage(
      err,
      `Failed to invite ${identity.login} to org`,
      res.status
    )
  )
}

export async function checkOrgMember(
  token: string,
  org: string,
  username: string
): Promise<boolean> {
  const res = await githubFetch(`/orgs/${org}/members/${username}`, token)
  if (res.ok) return true
  // 404 is the documented "not a member" answer. Anything else (bad
  // credentials, no permission, rate limit) must surface instead of being
  // misread as "not a member" and followed by a doomed invite attempt.
  if (res.status === 404) return false
  const err = await res.json().catch(() => ({}))
  throw new Error(
    (err.message || `Failed to check org membership of ${username}`) +
      ` (HTTP ${res.status})`
  )
}