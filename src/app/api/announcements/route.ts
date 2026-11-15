import { NextResponse } from "next/server"
import { authenticate, authorize } from "@/backend/services/permissions"
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  getAnnouncementsForUser,
  updateAnnouncement,
} from "@/backend/store/announcements"
import { jsonError, readJson } from "@/backend/http"
import { csrfCheck } from "@/backend/csrf"
import { rateLimit, getClientIp } from "@/backend/rateLimit"

const MAX_TITLE = 120
const MAX_BODY = 2000

/**
 * GET — everyone signed in reads announcements visible to them,
 * filtered by expiry and target teams.
 */
export async function GET() {
  const auth = await authenticate()
  if (!auth.ok) return auth.response

  const { access } = auth.session

  // Build the caller's visible teams: students have `team`, teachers have `classes`
  const userTeams: string[] | null =
    access.team || access.classes.length > 0
      ? [...new Set([access.team, ...access.classes].filter(Boolean) as string[])]
      : null

  const all = getAnnouncementsForUser(userTeams)
  return NextResponse.json({ announcements: all })
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

function validateTargeting(
  targetTeams: unknown,
  targetSprint: unknown,
  expiresAt: unknown
):
  | { ok: true; targetTeams?: string[]; targetSprint?: number; expiresAt?: string }
  | { ok: false; error: string } {
  let cleanedTeams: string[] | undefined
  if (targetTeams !== undefined) {
    if (!Array.isArray(targetTeams) || targetTeams.some((t) => typeof t !== "string")) {
      return { ok: false, error: "targetTeams must be an array of strings" }
    }
    cleanedTeams = targetTeams.filter(Boolean)
  }

  let cleanedSprint: number | undefined
  if (targetSprint !== undefined) {
    if (typeof targetSprint !== "number" || targetSprint < 0 || targetSprint > 3) {
      return { ok: false, error: "targetSprint must be a number between 0 and 3" }
    }
    cleanedSprint = targetSprint
  }

  let cleanedExpiresAt: string | undefined
  if (expiresAt !== undefined) {
    if (typeof expiresAt !== "string" || Number.isNaN(new Date(expiresAt).getTime())) {
      return { ok: false, error: "expiresAt must be a valid ISO date string" }
    }
    cleanedExpiresAt = expiresAt
  }

  return { ok: true, targetTeams: cleanedTeams, targetSprint: cleanedSprint, expiresAt: cleanedExpiresAt }
}

/**
 * POST — owner, animator, subject-teacher, and elective-teacher can post
 * announcements. Targeting and expiry are optional.
 */
export async function POST(request: Request) {
  const csrf = csrfCheck(request)
  if (csrf) return csrf

  const ip = getClientIp(request)
  const rl = rateLimit(`announcements:post:${ip}`, { limit: 5, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  const auth = await authorize("announcement.create")
  if (!auth.ok) return auth.response

  const { access } = auth.session

  const body = await readJson<{
    title?: unknown
    body?: unknown
    targetTeams?: unknown
    targetSprint?: unknown
    expiresAt?: unknown
  }>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  const copy = validateCopy(body.title, body.body)
  if (!copy.ok) return jsonError(copy.error)

  const targeting = validateTargeting(body.targetTeams, body.targetSprint, body.expiresAt)
  if (!targeting.ok) return jsonError(targeting.error)

  const authorRole =
    access.role === "owner" || access.role === "animator" ? "admin" : "subject-teacher"

  const announcement = createAnnouncement(
    {
      title: copy.title,
      body: copy.body,
      ...(targeting.targetTeams && { targetTeams: targeting.targetTeams }),
      ...(targeting.targetSprint !== undefined && { targetSprint: targeting.targetSprint }),
      ...(targeting.expiresAt && { expiresAt: targeting.expiresAt }),
    },
    access.username,
    authorRole
  )

  return NextResponse.json({ announcement }, { status: 201 })
}

export async function PATCH(request: Request) {
  const csrf = csrfCheck(request)
  if (csrf) return csrf

  const auth = await authenticate()
  if (!auth.ok) return auth.response

  const { access } = auth.session

  const body = await readJson<{
    id?: string
    title?: unknown
    body?: unknown
    targetTeams?: unknown
    targetSprint?: unknown
    expiresAt?: unknown
  }>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  if (!body.id || typeof body.id !== "string") {
    return jsonError("id is required")
  }

  const announcement = getAnnouncement(body.id)
  if (!announcement) {
    return NextResponse.json(
      { error: "Announcement not found" },
      { status: 404 }
    )
  }

  // Authorization: author can edit their own; admin (teacher.approve) can edit any
  const isAuthor = announcement.author.toLowerCase() === access.username.toLowerCase()
  const isAdmin = access.capabilities.has("teacher.approve")
  if (!isAuthor && !isAdmin) {
    return NextResponse.json(
      { error: "You can only edit your own announcements" },
      { status: 403 }
    )
  }

  const copy = validateCopy(body.title, body.body)
  if (!copy.ok) return jsonError(copy.error)

  const targeting = validateTargeting(body.targetTeams, body.targetSprint, body.expiresAt)
  if (!targeting.ok) return jsonError(targeting.error)

  const updated = updateAnnouncement(body.id, {
    title: copy.title,
    body: copy.body,
    ...(targeting.targetTeams && { targetTeams: targeting.targetTeams }),
    ...(targeting.targetSprint !== undefined && { targetSprint: targeting.targetSprint }),
    ...(targeting.expiresAt && { expiresAt: targeting.expiresAt }),
  })
  return NextResponse.json({ announcement: updated })
}

export async function DELETE(request: Request) {
  const csrf = csrfCheck(request)
  if (csrf) return csrf

  const auth = await authenticate()
  if (!auth.ok) return auth.response

  const { access } = auth.session

  const body = await readJson<{ id?: string }>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  if (!body.id || typeof body.id !== "string") {
    return jsonError("id is required")
  }

  const announcement = getAnnouncement(body.id)
  if (!announcement) {
    return NextResponse.json(
      { error: "Announcement not found" },
      { status: 404 }
    )
  }

  // Authorization: author can delete their own; admin (teacher.approve) can delete any
  const isAuthor = announcement.author.toLowerCase() === access.username.toLowerCase()
  const isAdmin = access.capabilities.has("teacher.approve")
  if (!isAuthor && !isAdmin) {
    return NextResponse.json(
      { error: "You can only delete your own announcements" },
      { status: 403 }
    )
  }

  if (!deleteAnnouncement(body.id)) {
    return NextResponse.json(
      { error: "Announcement not found" },
      { status: 404 }
    )
  }

  return NextResponse.json({ deleted: body.id })
}
