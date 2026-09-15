import type { RosterEntry, OnboardingSession } from "../types"
import {
  addRosterEntries,
  createOnboardingSession,
  getOnboardingSession,
  getRoster,
  getRosterByClassTeam,
  getRosterByOnboardedBy,
  getRosterByGithubUsername,
  getTeams,
  getClassTeamForUsername,
  updateOnboardingSession,
  updateRosterEntry,
} from "../store/roster"

export function getRosterForTeacher(teacherUsername: string): RosterEntry[] {
  return getRosterByOnboardedBy(teacherUsername)
}

export function getAllRoster(): RosterEntry[] {
  return getRoster()
}

export function getClassTeams(): string[] {
  return getTeams()
}

export function getStudentsByTeam(team: string): RosterEntry[] {
  return getRosterByClassTeam(team)
}

export function getRosterEntryForUser(username: string): RosterEntry | undefined {
  return getRosterByGithubUsername(username)
}

export function getTeamForUser(username: string): string | null {
  return getClassTeamForUsername(username)
}

export function upsertRosterEntries(entries: RosterEntry[]): void {
  addRosterEntries(entries)
}

export function updateRoster(
  rollNo: string,
  classTeam: string,
  updates: Partial<Omit<RosterEntry, "rollNo" | "classTeam">>
): void {
  updateRosterEntry(rollNo, classTeam, updates)
}

export function createSession(session: OnboardingSession): OnboardingSession {
  return createOnboardingSession(session)
}

export function getSession(id: string): OnboardingSession | undefined {
  return getOnboardingSession(id)
}

export function updateSession(
  id: string,
  updates: Partial<OnboardingSession>
): void {
  updateOnboardingSession(id, updates)
}