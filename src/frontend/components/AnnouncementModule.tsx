"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import type { Announcement } from "@/backend/types"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import Button from "./Button"
import { BellIcon, PlusIcon } from "./Icons"
import ConfirmModal from "./ConfirmModal"

/** "2026-09-01" → "1 Sep", matching the copy deck's date style. */
function formatDate(iso: string): string {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return iso
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function authorRoleLabel(role: Announcement["authorRole"]): string {
  switch (role) {
    case "admin":
      return "Admin"
    case "subject-teacher":
      return "Subject Teacher"
    default:
      return "Faculty"
  }
}

export default function AnnouncementModule() {
  const { isOrgOwner, username, capabilities, loading: accessLoading } =
    useSessionUser()
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [targetTeams, setTargetTeams] = useState<string[]>([])
  const [targetSprint, setTargetSprint] = useState<number | null>(null)
  const [expiresAt, setExpiresAt] = useState("")
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editBody, setEditBody] = useState("")
  const [editTargetTeams, setEditTargetTeams] = useState<string[]>([])
  const [editTargetSprint, setEditTargetSprint] = useState<number | null>(null)
  const [editExpiresAt, setEditExpiresAt] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)
  const [itemError, setItemError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const canPost = capabilities.includes("announcement.create")

  const load = () => {
    fetch("/api/announcements")
      .then((res) => {
        if (!res.ok) throw new Error("announcements request failed")
        return res.json()
      })
      .then((data) => {
        setItems(Array.isArray(data?.announcements) ? data.announcements : [])
        setLoadError(false)
        setLoading(false)
      })
      .catch(() => {
        setItems([])
        setLoadError(true)
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
  }, [])

  const unread = items.filter((item) => item.unread).length

  const expand = (id: string) => {
    setOpen(open === id ? null : id)
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item))
    )
  }

  const isAuthor = (item: Announcement) =>
    item.author.toLowerCase() === (username || "").toLowerCase()

  const closeComposer = () => {
    setComposerOpen(false)
    setPostError(null)
    setTitle("")
    setBody("")
    setTargetTeams([])
    setTargetSprint(null)
    setExpiresAt("")
  }

  const startEdit = (item: Announcement) => {
    setEditingId(item.id)
    setEditTitle(item.title)
    setEditBody(item.body)
    setEditTargetTeams(item.targetTeams ?? [])
    setEditTargetSprint(item.targetSprint ?? null)
    setEditExpiresAt(item.expiresAt ?? "")
    setItemError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setItemError(null)
  }

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault()
    if (savingEdit || !editingId) return
    setSavingEdit(true)
    setItemError(null)
    try {
      const res = await fetch("/api/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          title: editTitle,
          body: editBody,
          targetTeams: editTargetTeams.length > 0 ? editTargetTeams : undefined,
          targetSprint: editTargetSprint,
          expiresAt: editExpiresAt || undefined,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || "Couldn't save the announcement")
      }
      setItems((current) =>
        current.map((item) =>
          item.id === data.announcement.id
            ? (data.announcement as Announcement)
            : item
        )
      )
      setEditingId(null)
    } catch (err) {
      setItemError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSavingEdit(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setItemError(null)
    try {
      const res = await fetch("/api/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || "Couldn't delete the announcement")
      }
      setItems((current) => current.filter((item) => item.id !== deleteId))
      if (open === deleteId) setOpen(null)
      setDeleteId(null)
    } catch (err) {
      setItemError(err instanceof Error ? err.message : "Something went wrong")
      setDeleteId(null)
    }
  }

  const publish = async (event: FormEvent) => {
    event.preventDefault()
    if (posting) return
    setPosting(true)
    setPostError(null)
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          targetTeams: targetTeams.length > 0 ? targetTeams : undefined,
          targetSprint,
          expiresAt: expiresAt || undefined,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || "Couldn't post the announcement")
      }
      setItems((current) => [data.announcement as Announcement, ...current])
      closeComposer()
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setPosting(false)
    }
  }

  return (
    <section
      id="announcements"
      className="overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="flex items-center justify-between bg-accent-soft px-5 py-4">
        <span className="flex items-center gap-2 font-semibold">
          <BellIcon className="size-4 text-accent" />
          Announcements
        </span>
        {unread > 0 && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white">
            {unread} new
          </span>
        )}
      </div>

      {!accessLoading && !canPost && (
        <p className="border-b border-border bg-canvas px-5 py-2 text-xs text-ink-subtle">
          Announcements are posted by your class teachers and admin.
        </p>
      )}

      {(accessLoading || canPost) && (
        <div className="border-b border-border bg-canvas">
          {composerOpen ? (
            <form onSubmit={publish} className="space-y-2 p-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                maxLength={120}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What should everyone know?"
                rows={3}
                maxLength={2000}
                className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
              />

              {/* Targeting options (teachers only) */}
              <div className="pt-3 border-t border-border">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle mb-2">
                  Send to
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={targetSprint === null}
                    onChange={() => setTargetSprint(null)}
                    className="w-4 h-4 rounded accent-accent"
                  />
                  <label className="text-sm text-ink-muted cursor-pointer">
                    Whole class
                  </label>
                </div>
                {targetSprint !== null && (
                  <div className="mb-2">
                    <label className="text-xs font-medium text-ink-muted block mb-1">
                      Specific sprint
                    </label>
                    <select
                      value={targetSprint}
                      onChange={(e) =>
                        setTargetSprint(parseInt(e.target.value, 10))
                      }
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
                    >
                      {[0, 1, 2, 3].map((n) => (
                        <option key={n} value={n}>
                          Sprint {n}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="mb-2">
                  <label className="text-xs font-medium text-ink-muted block mb-1">
                    Expires on (optional)
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
                  />
                </div>
                <p className="text-[10px] text-ink-faint">
                  Announcements expire at sprint end if not set.
                </p>
              </div>

              {postError && <p className="text-xs text-danger">{postError}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={closeComposer}
                  disabled={posting}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" loading={posting}>
                  Post
                </Button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="flex w-full items-center gap-2 px-5 py-3 text-left text-sm font-medium text-accent hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent"
            >
              <PlusIcon className="size-4" />
              New announcement
            </button>
          )}
        </div>
      )}

      <div className="divide-y divide-border">
        {loading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="p-4">
              <div className="h-16 animate-pulse rounded-lg bg-border" />
            </div>
          ))
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-muted">
            {loadError
              ? "Couldn't load announcements. Refresh the page to try again."
              : "No announcements yet"}
          </p>
        ) : (
          items.map((item) => (
            <div key={item.id}>
              {editingId === item.id ? (
                <form onSubmit={saveEdit} className="space-y-2 p-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Title"
                    maxLength={120}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
                  />
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    placeholder="What should everyone know?"
                    rows={3}
                    maxLength={2000}
                    className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
                  />
                  {itemError && <p className="text-xs text-danger">{itemError}</p>}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={cancelEdit}
                      disabled={savingEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      loading={savingEdit}
                    >
                      Save
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => expand(item.id)}
                    className="block w-full p-4 text-left hover:bg-canvas focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <span className="flex gap-3">
                      <span
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${
                          item.unread ? "bg-accent" : "bg-border"
                        }`}
                      />
                      <span>
                        <strong className="block text-sm font-medium">
                          {item.title}
                        </strong>
                        <span
                          className={`${open === item.id ? "" : "line-clamp-2"} mt-1 block text-sm leading-5 text-ink-muted`}
                        >
                          {item.body}
                        </span>
                        <span className="mt-2 block text-xs text-ink-subtle flex items-center gap-2">
                          {formatDate(item.createdAt)} · {item.author}
                          {item.authorRole && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                            >
                              {authorRoleLabel(item.authorRole)}
                            </span>
                          )}
                        </span>
                      </span>
                    </span>
                  </button>
                  {open === item.id && (
                    <div className="flex justify-end gap-2 px-4 pb-3">
                      {(isAuthor(item) || isOrgOwner) && (
                        <>
                          <Button
                            variant="ghost"
                            type="button"
                            onClick={() => startEdit(item)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            type="button"
                            onClick={() => {
                              setDeleteId(item.id)
                            }}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                  {open === item.id && itemError && (
                    <p className="px-4 pb-3 text-xs text-danger">{itemError}</p>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      <p className="bg-canvas px-5 py-3 text-xs text-ink-subtle">
        Watch the Announcements repository on GitHub for email updates.
      </p>

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!deleteId}
        title="Delete this announcement?"
        body="This announcement will be removed for everyone."
        confirmLabel="Delete"
        busy={false}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </section>
  )
}
