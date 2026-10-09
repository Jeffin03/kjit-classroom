export interface Announcement {
  id: string
  title: string
  body: string
  author: string
  /** ISO timestamp — the client formats it for display. */
  createdAt: string
  /** Shared read state; the store is in-memory like everything else. */
  unread: boolean
}

export interface CreateAnnouncementInput {
  title: string
  body: string
}
