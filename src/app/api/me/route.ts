import { NextResponse } from "next/server"
import { auth } from "@/backend/auth"
import { authenticate, toPublicAccess } from "@/backend/services/permissions"
import { getRosterByGithubUsername } from "@/backend/store/roster"
import { getTeacherByGithubUsername } from "@/backend/store/teachers"

export async function GET() {
  const [result, session] = await Promise.all([authenticate(), auth()])

  if (!result.ok) return result.response

  const { access } = result.session
  // Own records only — reading them needs no capability, and they are what
  // makes the profile page role-relevant (roll number for students, granted
  // role and classes for faculty) instead of just a GitHub identity card.
  const rosterEntry = getRosterByGithubUsername(access.username)
  const teacher = getTeacherByGithubUsername(access.username)

  return NextResponse.json({
    ...toPublicAccess(access),
    name: session?.user?.name ?? null,
    image: session?.user?.image ?? null,
    email:
      session?.user?.email ||
      rosterEntry?.collegeEmail ||
      teacher?.email ||
      null,
    rollNo: rosterEntry?.rollNo || null,
    displayName: rosterEntry?.displayName || null,
    classTeam: rosterEntry?.classTeam || null,
    rosterStatus: rosterEntry?.status || null,
    teacherRole: teacher && teacher.role !== "pending" ? teacher.role : null,
    teacherClasses: teacher?.classes ?? null,
  })
}
