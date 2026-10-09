import { NextResponse } from "next/server"
import { authenticate, authorize } from "@/backend/services/permissions"
import {
  createAnnouncement,
  getAnnouncements,
} from "@/backend/store/announcements"

/**
 * Everyone signed in reads the same list — announcements are a dashboard
 * module for students, faculty, and the owner alike (§0.3).
 */
export async function GET() {
  const auth = await authenticate()
  if (!auth.ok) return auth.response

  return NextResponse.json({ announcements: getAnnouncements() })
}

/**
 * Owner composer (§7). `teacher.approve` is the owner-only capability, so a
 * subject or elective teacher cannot post org-wide announcements.
 */
export async function POST(request: Request) {
  const auth = await authorize("teacher.approve")
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({}))
  const title = typeof body?.title === "string" ? body.title.trim() : ""
  const text = typeof body?.body === "string" ? body.body.trim() : ""

  if (!title || !text) {
    return NextResponse.json(
      { error: "title and body are required" },
      { status: 400 }
    )
  }
  if (title.length > 120) {
    return NextResponse.json(
      { error: "title must be 120 characters or fewer" },
      { status: 400 }
    )
  }
  if (text.length > 2000) {
    return NextResponse.json(
      { error: "body must be 2000 characters or fewer" },
      { status: 400 }
    )
  }

  const announcement = createAnnouncement(
    { title, body: text },
    auth.session.access.username
  )

  return NextResponse.json({ announcement }, { status: 201 })
}
