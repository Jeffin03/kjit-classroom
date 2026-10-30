import { NextResponse } from "next/server"
import { authenticate, authorize } from "@/backend/services/permissions"
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from "@/backend/store/announcements"
import { jsonError, readJson } from "@/backend/http"

const MAX_TITLE = 120
const MAX_BODY = 2000

/**
 * Everyone signed in reads the same list — announcements are a dashboard
 * module for students, faculty, and the owner alike (§0.3).
 */
export async function GET() {
  const auth = await authenticate()
  if (!auth.ok) return auth.response

  return NextResponse.json({ announcements: getAnnouncements() })
}

function validateCopy(
  title: unknown,
  body: unknown
):
  | { ok: true; title: string; body: string }
  | { ok: false; error: string } {
  const cleanTitle = typeof title === "string" ? title.trim() : ""
  const cleanBody = typeof body === "string" ? body.trim() : ""

  if (!cleanTitle || !cleanBody) {
    return { ok: false, error: "title and body are required" }
  }
  if (cleanTitle.length > MAX_TITLE) {
    return {
      ok: false,
      error: `title must be ${MAX_TITLE} characters or fewer`,
    }
  }
  if (cleanBody.length > MAX_BODY) {
    return { ok: false, error: `body must be ${MAX_BODY} characters or fewer` }
  }

  return { ok: true, title: cleanTitle, body: cleanBody }
}

/**
 * Owner composer (§7). `teacher.approve` is the owner-only capability, so a
 * subject or elective teacher cannot post org-wide announcements.
 */
export async function POST(request: Request) {
  const auth = await authorize("teacher.approve")
  if (!auth.ok) return auth.response

  const body = await readJson<{ title?: unknown; body?: unknown }>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  const copy = validateCopy(body.title, body.body)
  if (!copy.ok) return jsonError(copy.error)

  const announcement = createAnnouncement(
    { title: copy.title, body: copy.body },
    auth.session.access.username
  )

  return NextResponse.json({ announcement }, { status: 201 })
}

export async function PATCH(request: Request) {
  const auth = await authorize("teacher.approve")
  if (!auth.ok) return auth.response

  const body = await readJson<{
    id?: string
    title?: unknown
    body?: unknown
  }>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  if (!body.id || typeof body.id !== "string") {
    return jsonError("id is required")
  }
  if (!getAnnouncement(body.id)) {
    return NextResponse.json(
      { error: "Announcement not found" },
      { status: 404 }
    )
  }

  const copy = validateCopy(body.title, body.body)
  if (!copy.ok) return jsonError(copy.error)

  const announcement = updateAnnouncement(body.id, {
    title: copy.title,
    body: copy.body,
  })
  return NextResponse.json({ announcement })
}

export async function DELETE(request: Request) {
  const auth = await authorize("teacher.approve")
  if (!auth.ok) return auth.response

  const body = await readJson<{ id?: string }>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  if (!body.id || typeof body.id !== "string") {
    return jsonError("id is required")
  }
  if (!deleteAnnouncement(body.id)) {
    return NextResponse.json(
      { error: "Announcement not found" },
      { status: 404 }
    )
  }

  return NextResponse.json({ deleted: body.id })
}
