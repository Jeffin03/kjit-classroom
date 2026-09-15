import { getOrgToken } from "../github/client"
import { getOrgOwners } from "../github/org"
import { getTeacherByGithubUsername } from "../store/teachers"
import { getClassTeamForUsername } from "../store/roster"

export async function isFaculty(
  username: string,
  org?: string
): Promise<boolean> {
  if (!org) org = process.env.GITHUB_ORG
  if (org) {
    try {
      const token = await getOrgToken()
      const owners = await getOrgOwners(token, org)
      if (owners.includes(username)) return true
    } catch {
      // fall through to teacher profile check
    }
  }
  const teacher = getTeacherByGithubUsername(username)
  return teacher?.role === "animator" ||
    teacher?.role === "subject-teacher" ||
    teacher?.role === "elective-teacher"
}

export async function isOrgOwner(
  username: string,
  org?: string
): Promise<boolean> {
  if (!org) org = process.env.GITHUB_ORG
  if (!org) return false
  try {
    const token = await getOrgToken()
    const owners = await getOrgOwners(token, org)
    return owners.includes(username)
  } catch {
    return false
  }
}

export function getStudentTeam(username: string): string | null {
  return getClassTeamForUsername(username)
}