import { NextResponse } from "next/server"
import { auth } from "@/backend/auth"
import {
  authenticate,
  resolveAccess,
  toPublicAccess,
} from "@/backend/services/permissions"
import { getRosterByGithubUsername } from "@/backend/store/roster"
import { getTeacherByGithubUsername } from "@/backend/store/teachers"

export async function GET(request: Request) {
  const [result, session] = await Promise.all([authenticate(), auth()])
  if (!result.ok) return result.response

  const caller = result.session.access
  const { searchParams } = new URL(request.url)
  const usernameParam = searchParams.get("username")?.trim()

  // 1. Self profile request
  if (
    !usernameParam ||
    usernameParam.toLowerCase() === caller.username.toLowerCase()
  ) {
    const rosterEntry = getRosterByGithubUsername(caller.username)
    const teacher = getTeacherByGithubUsername(caller.username)

    return NextResponse.json({
      ...toPublicAccess(caller),
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
      isSelf: true,
      viewerRole: caller.role,
    })
  }

  // 2. Targeted profile request
  const targetUsername = usernameParam
  const targetAccess = await resolveAccess(
    targetUsername,
    result.session.accessToken
  )

  const rosterEntry = getRosterByGithubUsername(targetUsername)
  const teacher = getTeacherByGithubUsername(targetUsername)

  const isTargetFaculty =
    targetAccess.isFaculty ||
    targetAccess.role === "owner" ||
    targetAccess.role === "animator" ||
    targetAccess.role === "subject-teacher" ||
    targetAccess.role === "elective-teacher" ||
    (teacher && teacher.role !== "pending")

  const isCallerAdmin =
    caller.role === "owner" ||
    caller.role === "animator" ||
    caller.capabilities.has("teacher.approve")

  // Authorization check:
  // "teacher and admin has to be able to view student profile"
  // "admin has to be able to view teachers and student profile"
  if (isTargetFaculty) {
    if (!isCallerAdmin) {
      return NextResponse.json(
        { error: "Only administrators can view faculty profiles." },
        { status: 403 }
      )
    }
  } else {
    // Target is a student (or unrostered user)
    if (!caller.isFaculty && !isCallerAdmin) {
      return NextResponse.json(
        { error: "Only faculty and administrators can view student profiles." },
        { status: 403 }
      )
    }
  }

  // If target has a roster entry or teacher record, derive role appropriately
  const targetRole = isTargetFaculty
    ? teacher?.role && teacher.role !== "pending"
      ? teacher.role
      : targetAccess.role
    : rosterEntry
      ? "student"
      : targetAccess.role

  return NextResponse.json({
    ...toPublicAccess(targetAccess),
    username: targetUsername,
    role: targetRole,
    name: rosterEntry?.displayName || teacher?.displayName || targetUsername,
    image: `https://github.com/${targetUsername}.png`,
    email: rosterEntry?.collegeEmail || teacher?.email || null,
    rollNo: rosterEntry?.rollNo || null,
    displayName: rosterEntry?.displayName || teacher?.displayName || null,
    classTeam: rosterEntry?.classTeam || null,
    rosterStatus: rosterEntry?.status || null,
    teacherRole: teacher && teacher.role !== "pending" ? teacher.role : null,
    teacherClasses: teacher?.classes ?? null,
    isSelf: false,
    viewerRole: caller.role,
  })
}
