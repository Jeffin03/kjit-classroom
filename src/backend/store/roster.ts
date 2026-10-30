import type { RosterEntry, OnboardingSession } from "../types"
import { KEYS, mutated, registerCollection } from "./persistence"

const roster: RosterEntry[] = []
const onboardingSessions: OnboardingSession[] = []

const rosterId = (entry: RosterEntry) => `${entry.rollNo}::${entry.classTeam}`

registerCollection({
  key: KEYS.roster,
  getAll: () => roster,
  replace: (items) => {
    roster.splice(0, roster.length, ...(items as RosterEntry[]))
  },
  entityId: (item) => rosterId(item as RosterEntry),
})

registerCollection({
  key: KEYS.onboardingSessions,
  getAll: () => onboardingSessions,
  replace: (items) => {
    onboardingSessions.splice(
      0,
      onboardingSessions.length,
      ...(items as OnboardingSession[])
    )
  },
  entityId: (item) => (item as OnboardingSession).id,
})

export function getRoster(): RosterEntry[] {
  return roster
}

export function getTeams(): string[] {
  return [...new Set(roster.map((r) => r.classTeam))].sort()
}

export function getRosterByClassTeam(classTeam: string): RosterEntry[] {
  return roster.filter((r) => r.classTeam === classTeam)
}

export function getRosterByOnboardedBy(teacherUsername: string): RosterEntry[] {
  return roster.filter((r) => r.onboardedBy === teacherUsername)
}

export function addRosterEntries(entries: RosterEntry[]): void {
  for (const entry of entries) {
    const existing = roster.findIndex(
      (r) => r.rollNo === entry.rollNo && r.classTeam === entry.classTeam
    )
    if (existing >= 0) {
      roster[existing] = { ...roster[existing], ...entry }
    } else {
      roster.push(entry)
    }
    const stored = roster.find(
      (r) => r.rollNo === entry.rollNo && r.classTeam === entry.classTeam
    )
    mutated(KEYS.roster, rosterId(entry), stored ?? entry)
  }
}

export function updateRosterEntry(
  rollNo: string,
  classTeam: string,
  updates: Partial<Omit<RosterEntry, "rollNo" | "classTeam">>
): void {
  const entry = roster.find(
    (r) => r.rollNo === rollNo && r.classTeam === classTeam
  )
  if (entry) {
    Object.assign(entry, updates)
    mutated(KEYS.roster, `${rollNo}::${classTeam}`, entry)
  }
}

/** Removes one student from one class. Returns the removed entry, if any. */
export function removeRosterEntry(
  rollNo: string,
  classTeam: string
): RosterEntry | undefined {
  const index = roster.findIndex(
    (r) => r.rollNo === rollNo && r.classTeam === classTeam
  )
  if (index < 0) return undefined
  const [removed] = roster.splice(index, 1)
  mutated(KEYS.roster, `${rollNo}::${classTeam}`, null)
  return removed
}

export function getClassTeamForUsername(username: string): string | null {
  const entry = roster.find((r) => r.githubUsername === username)
  return entry?.classTeam ?? null
}

export function getRosterByGithubUsername(username: string): RosterEntry | undefined {
  const needle = username.toLowerCase()
  return roster.find((r) => r.githubUsername?.toLowerCase() === needle)
}

// Onboarding sessions

export function createOnboardingSession(
  session: OnboardingSession
): OnboardingSession {
  onboardingSessions.push(session)
  mutated(KEYS.onboardingSessions, session.id, session)
  return session
}

export function getOnboardingSession(
  id: string
): OnboardingSession | undefined {
  return onboardingSessions.find((s) => s.id === id)
}

export function updateOnboardingSession(
  id: string,
  updates: Partial<OnboardingSession>
): void {
  const session = onboardingSessions.find((s) => s.id === id)
  if (session) {
    Object.assign(session, updates)
    mutated(KEYS.onboardingSessions, id, session)
  }
}