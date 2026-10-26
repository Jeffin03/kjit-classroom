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
  author: string
): Announcement {
  sequence += 1
  const announcement: Announcement = {
    id: `ann-${Date.now().toString(36)}-${sequence}`,
    title: input.title,
    body: input.body,
    author,
    createdAt: new Date().toISOString(),
    unread: true,
  }
  announcements.unshift(announcement)
  mutated(KEYS.announcements, announcement.id, announcement)
  return announcement
}
