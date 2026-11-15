import type {
  Team,
  CreateTeamInput,
  JoinTeamInput,
  LeaveTeamInput,
  TeamMember,
  TeamWithRoster,
  UpdateTeamInput,
} from "../types"
import { getRosterByGithubUsername, getRoster } from "./roster"
import { KEYS, mutated, registerCollection } from "./persistence"

const teams: Team[] = []

registerCollection({
  key: KEYS.teams,
  getAll: () => teams,
  replace: (items) => {
    teams.splice(0, teams.length, ...(items as Team[]))
  },
  entityId: (item) => (item as Team).id,
})

export function getTeams(): Team[] {
  return teams
}

export function getTeam(id: string): Team | undefined {
  return teams.find((t) => t.id === id)
}

export function getTeamsByAssignment(assignmentId: string): Team[] {
  return teams.filter((t) => t.assignmentId === assignmentId)
}

export function getTeamByMember(username: string): Team | undefined {
  const needle = username.toLowerCase()
  return teams.find((t) =>
    t.members.some((m) => m.username.toLowerCase() === needle)
  )
}

/**
 * Find the team a member belongs to for a specific assignment.
 * Teams are scoped per assignment (subject) — a student can be on different
 * teams for different subjects.
 */
export function getTeamByMemberAndAssignment(
  username: string,
  assignmentId: string
): Team | undefined {
  const needle = username.toLowerCase()
  return teams.find(
    (t) =>
      t.assignmentId === assignmentId &&
      t.members.some((m) => m.username.toLowerCase() === needle)
  )
}

export function getTeamsByMember(username: string): Team[] {
  const needle = username.toLowerCase()
  return teams.filter((t) =>
    t.members.some((m) => m.username.toLowerCase() === needle)
  )
}

/**
 * All teams a member belongs to for a specific assignment.
 */
export function getTeamsByMemberAndAssignment(
  username: string,
  assignmentId: string
): Team[] {
  const needle = username.toLowerCase()
  return teams.filter(
    (t) =>
      t.assignmentId === assignmentId &&
      t.members.some((m) => m.username.toLowerCase() === needle)
  )
}

/**
 * Build roster-backed display info for a team's members.
 */
function resolveTeamRoster(team: Team): TeamWithRoster {
  const roster = getRoster()
  const rosterEntries = team.members.map((m) => {
    const entry = roster.find(
      (r) =>
        r.githubUsername?.toLowerCase() === m.username.toLowerCase() ||
        r.rollNo === m.rollNo
    )
    return {
      rollNo: m.rollNo,
      displayName: entry?.displayName ?? m.displayName,
      githubUsername: entry?.githubUsername ?? m.username,
    }
  })
  return { ...team, rosterEntries }
}

export function getTeamWithRoster(id: string): TeamWithRoster | undefined {
  const team = getTeam(id)
  if (!team) return undefined
  return resolveTeamRoster(team)
}

export function getTeamsWithRoster(assignmentId?: string): TeamWithRoster[] {
  const list = assignmentId
    ? getTeamsByAssignment(assignmentId)
    : getTeams()
  return list.map((t) => resolveTeamRoster(t))
}

/**
 * Build the final member list for a new team. The creator is always included
 * and placed first (which makes them the lead); `requested` only carries the
 * teammates they typed. Duplicates and blanks are dropped case-insensitively,
 * so typing your own handle is harmless.
 */
export function resolveTeamMembers(
  creator: string,
  requested: readonly string[]
): string[] {
  const list: string[] = []
  const seen = new Set<string>()
  for (const raw of [creator, ...requested]) {
    if (typeof raw !== "string") continue
    const name = raw.trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    list.push(name)
  }
  return list
}

export function createTeam(input: CreateTeamInput): Team {
  // Validate team size: 1-3 members
  if (!input.members || input.members.length < 1 || input.members.length > 3) {
    throw new Error("Team must have between 1 and 3 members")
  }

  // No member can already be on another team for this assignment
  for (const username of input.members) {
    const existing = getTeamByMemberAndAssignment(username, input.assignmentId)
    if (existing) {
      throw new Error(
        `${username} is already on a team for this assignment`
      )
    }
  }

  const now = new Date().toISOString()
  const members: TeamMember[] = input.members.map((username, i) => {
    const rosterEntry = getRosterByGithubUsername(username)
    return {
      username,
      rollNo: rosterEntry?.rollNo ?? input.creatorRollNo ?? "",
      displayName: rosterEntry?.displayName,
      isLead: i === 0,
      joinedAt: now,
    }
  })

  const team: Team = {
    id: `team-${crypto.randomUUID()}`,
    assignmentId: input.assignmentId,
    projectTitle: input.projectTitle,
    members,
    createdBy: input.members[0],
    createdAt: now,
    updatedAt: now,
    status: "forming",
  }
  teams.push(team)
  mutated(KEYS.teams, team.id, team)
  return team
}

export function joinTeam(input: JoinTeamInput): Team {
  const team = teams.find((t) => t.id === input.teamId)
  if (!team) {
    throw new Error("Team not found")
  }

  const needle = input.username.toLowerCase()
  if (team.members.some((m) => m.username.toLowerCase() === needle)) {
    throw new Error("You are already a member of this team")
  }

  if (team.members.length >= 3) {
    throw new Error("Team is full (max 3 members)")
  }

  // Verify the joiner isn't already on another team for this assignment
  const existing = getTeamByMemberAndAssignment(
    input.username,
    team.assignmentId
  )
  if (existing) {
    throw new Error("You are already on a team for this assignment")
  }

  const rosterEntry = getRosterByGithubUsername(input.username)
  const now = new Date().toISOString()

  team.members.push({
    username: input.username,
    rollNo: input.rollNo,
    displayName: rosterEntry?.displayName,
    isLead: false,
    joinedAt: now,
    ...(input.consentToExistingProject !== undefined
      ? {}
      : { consentToExistingProject: true }),
  } as TeamMember)

  team.updatedAt = now
  mutated(KEYS.teams, team.id, team)
  return team
}

export function leaveTeam(input: LeaveTeamInput): void {
  const team = teams.find((t) => t.id === input.teamId)
  if (!team) {
    throw new Error("Team not found")
  }

  const needle = input.username.toLowerCase()
  const index = team.members.findIndex(
    (m) => m.username.toLowerCase() === needle
  )
  if (index < 0) {
    throw new Error("You are not a member of this team")
  }

  // If the lead leaves, promote the next member to lead
  const [removed] = team.members.splice(index, 1)
  if (removed.isLead && team.members.length > 0) {
    team.members[0].isLead = true
  }

  team.updatedAt = new Date().toISOString()
  mutated(KEYS.teams, team.id, team)
}

export function updateTeam(
  id: string,
  updates: UpdateTeamInput
): Team | null {
  const team = teams.find((t) => t.id === id)
  if (!team) return null

  if (updates.projectTitle !== undefined) team.projectTitle = updates.projectTitle
  if (updates.abstractDocUrl !== undefined) team.abstractDocUrl = updates.abstractDocUrl
  if (updates.members !== undefined) team.members = updates.members
  if (updates.status !== undefined) team.status = updates.status
  if (updates.reviewNotes !== undefined) team.reviewNotes = updates.reviewNotes
  if (updates.reviewedBy !== undefined) team.reviewedBy = updates.reviewedBy

  team.updatedAt = new Date().toISOString()
  mutated(KEYS.teams, team.id, team)
  return team
}

export function deleteTeam(id: string): boolean {
  const index = teams.findIndex((t) => t.id === id)
  if (index === -1) return false
  const [removed] = teams.splice(index, 1)
  mutated(KEYS.teams, removed.id, null)
  return true
}
