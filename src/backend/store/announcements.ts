import type { Announcement, CreateAnnouncementInput } from "../types"
import { KEYS, mutated, registerCollection } from "./persistence"

/**
 * Announcements are a dashboard module for every role (§0.3). Like the rest of
 * the backend this store is in-memory: it resets on server restart.
 *
 * Order is insertion order — the composer prepends, so the newest announcement
 * is always first. The three entries below are demo content; set
 * `SEED_DUMMY_DATA=false` in production so a new deployment starts empty.
 */
const SEED_DUMMY_DATA =
  process.env.SEED_DUMMY_DATA !== "false" && process.env.SEED_DUMMY_DATA !== "0"

const announcements: Announcement[] = SEED_DUMMY_DATA ? [
  {
    id: "ann-welcome",
    title: "Welcome to KJIT Classroom",
    body: "This semester we run a GitHub-native sprint workflow: build in your own repo, submit across Sprint 0–3 with commit hashes and docs, and build a permanent developer portfolio.",
    author: "KJIT Nexus",
    createdAt: "2026-09-01T09:00:00.000Z",
    unread: true,
  },
  {
    id: "ann-portfolio-live",
    title: "Portfolio Website Assignment Live",
    body: "Your first assignment is live. Create your project repo, submit Sprint 0 (abstract + repo link), and build your portfolio across the sprints.",
    author: "Faculty Team",
    createdAt: "2026-09-02T09:00:00.000Z",
    unread: true,
  },
  {
    id: "ann-github-setup",
    title: "GitHub Account Setup Guide",
    body: "Complete your GitHub profile before starting: profile picture, bio, and two-factor authentication. Your GitHub account is your professional identity.",
    author: "KJIT Nexus",
    createdAt: "2026-09-01T16:00:00.000Z",
    unread: false,
  },
] : []

let sequence = 0

export function getAnnouncements(): Announcement[] {
  return announcements
}

/**
 * Returns announcements visible to a given user, filtered by:
 * - expiry (expired announcements are hidden)
 * - target teams (only shown to members of those teams)
 * - target sprint (shown to everyone in the class)
 *
 * `userTeams` is the caller's class teams (null = unrestricted staff).
 */
export function getAnnouncementsForUser(
  userTeams: string[] | null
): Announcement[] {
  return announcements.filter((a) => {
    // Hide expired announcements
    if (a.expiresAt && new Date(a.expiresAt).getTime() <= new Date().getTime()) {
      return false
    }

    // If targeted at specific teams, only show to members of those teams
    if (a.targetTeams && a.targetTeams.length > 0) {
      if (userTeams === null) return true // unrestricted staff sees all
      return a.targetTeams.some((t) => userTeams.includes(t))
    }

    // If targeted at a specific sprint, show to everyone in the class
    if (a.targetSprint !== undefined) {
      if (userTeams === null) return true
      return true // sprint-scoped announcements are visible to all class members
    }

    // Untargeted announcements are visible to everyone
    return true
  })
}

registerCollection({
  key: KEYS.announcements,
  getAll: () => announcements,
  replace: (items) => {
    announcements.splice(0, announcements.length, ...(items as Announcement[]))
  },
  entityId: (item) => (item as Announcement).id,
})

export function getAnnouncement(id: string): Announcement | undefined {
  return announcements.find((a) => a.id === id)
}

export function createAnnouncement(
  input: CreateAnnouncementInput,
  author: string,
  authorRole: "admin" | "subject-teacher" = "subject-teacher"
): Announcement {
  sequence += 1
  const announcement: Announcement = {
    id: `ann-${Date.now().toString(36)}-${sequence}`,
    title: input.title,
    body: input.body,
    author,
    authorRole,
    createdAt: new Date().toISOString(),
    unread: true,
    ...(input.targetTeams && { targetTeams: input.targetTeams }),
    ...(input.targetSprint !== undefined && { targetSprint: input.targetSprint }),
    ...(input.expiresAt && { expiresAt: input.expiresAt }),
  }
  announcements.unshift(announcement)
  mutated(KEYS.announcements, announcement.id, announcement)
  return announcement
}

export function updateAnnouncement(
  id: string,
  updates: Partial<
    Pick<
      Announcement,
      "title" | "body" | "targetTeams" | "targetSprint" | "expiresAt"
    >
  >
): Announcement | null {
  const announcement = announcements.find((a) => a.id === id)
  if (!announcement) return null

  if (updates.title !== undefined) announcement.title = updates.title
  if (updates.body !== undefined) announcement.body = updates.body
  if (updates.targetTeams !== undefined)
    announcement.targetTeams = updates.targetTeams
  if (updates.targetSprint !== undefined)
    announcement.targetSprint = updates.targetSprint
  if (updates.expiresAt !== undefined)
    announcement.expiresAt = updates.expiresAt

  mutated(KEYS.announcements, announcement.id, announcement)
  return announcement
}

export function deleteAnnouncement(id: string): boolean {
  const index = announcements.findIndex((a) => a.id === id)
  if (index === -1) return false

  const [removed] = announcements.splice(index, 1)
  mutated(KEYS.announcements, removed.id, null)
  return true
}
