export interface Announcement {
  id: string
  title: string
  body: string
  author: string
  /** ISO timestamp — the client formats it for display. */
  createdAt: string
  /** Shared read state; the store is in-memory like everything else. */
  unread: boolean
  /** Optional: class team(s) this announcement targets. Empty/undefined = all. */
  targetTeams?: string[]
  /** Optional: sprint number this announcement relates to (0-3). */
  targetSprint?: number
  /** ISO timestamp when this announcement expires (e.g. sprint end). Undefined = never. */
  expiresAt?: string
  /** Role of the author: "admin" | "subject-teacher". */
  authorRole?: "admin" | "subject-teacher"
}

export interface CreateAnnouncementInput {
  title: string
  body: string
  /** Optional class team(s) to target. */
  targetTeams?: string[]
  /** Optional sprint number (0-3). */
  targetSprint?: number
  /** Optional expiry timestamp. */
  expiresAt?: string
}
