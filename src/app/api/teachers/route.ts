import { NextResponse } from "next/server"
import { auth } from "@/auth"
import {
  getTeacherByGithubUsername,
  addTeacherProfile,
} from "@/lib/data"

export async function GET() {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const githubUser = session.user?.name || session.user?.email
  if (!githubUser) {
    return NextResponse.json({ error: "No user info" }, { status: 400 })
  }

  const profile = getTeacherByGithubUsername(githubUser)
  return NextResponse.json({ profile: profile || null })
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { githubUsername, email, classes } = body

  if (!githubUsername || !email || !classes?.length) {
    return NextResponse.json(
      { error: "githubUsername, email, and classes are required" },
      { status: 400 }
    )
  }

  const existing = getTeacherByGithubUsername(githubUsername)
  if (existing && existing.role !== "pending") {
    return NextResponse.json(
      { error: "Teacher profile already exists with active role" },
      { status: 409 }
    )
  }

  const profile = {
    id: existing?.id || `teacher-${Date.now()}`,
    githubUsername,
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
