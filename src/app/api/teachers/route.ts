import { NextResponse } from "next/server"
import {
  getTeacherByGithubUsername,
  addTeacherProfile,
} from "@/backend/store/teachers"
import { authenticate, authorize } from "@/backend/services/permissions"

export async function GET() {
  const auth = await authenticate()
  if (!auth.ok) return auth.response

  const { access } = auth.session
  const profile = getTeacherByGithubUsername(access.username)
  return NextResponse.json({ profile: profile ?? null })
}

export async function POST(request: Request) {
  const auth = await authorize("teacher.request")
  if (!auth.ok) return auth.response

  const { access } = auth.session

  const body = await request.json()
  const { email, classes } = body

  if (!email || !classes?.length) {
    return NextResponse.json(
      { error: "email and classes are required" },
      { status: 400 }
    )
  }

  // A request may only be filed for yourself, and only for classes you teach.
  if (access.isFaculty) {
    return NextResponse.json(
      { error: "You already hold a faculty role" },
      { status: 409 }
    )
  }

  const existing = getTeacherByGithubUsername(access.username)
  if (existing && existing.role !== "pending") {
    return NextResponse.json(
      { error: "Teacher profile already exists with active role" },
      { status: 409 }
    )
  }

  const profile = {
    id: existing?.id || `teacher-${Date.now()}`,
    githubUsername: access.username,
    email,
    role: "pending" as const,
    classes,
    requestedAt: new Date().toISOString(),
  }

  addTeacherProfile(profile)

  return NextResponse.json({
    profile,
    message: "Request submitted. Waiting for admin approval.",
  })
}
