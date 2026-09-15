import type { TeacherProfile } from "../types"

const teachers: TeacherProfile[] = []

export function getTeacherByGithubUsername(
  username: string
): TeacherProfile | undefined {
  return teachers.find((t) => t.githubUsername === username)
}

export function addTeacherProfile(profile: TeacherProfile): void {
  const existing = teachers.findIndex(
    (t) => t.githubUsername === profile.githubUsername
  )
  if (existing >= 0) {
    teachers[existing] = { ...teachers[existing], ...profile }
  } else {
    teachers.push(profile)
  }
}

export function getPendingTeacherRequests(): TeacherProfile[] {
  return teachers.filter((t) => t.role === "pending")
}

export function approveTeacherRequest(
  githubUsername: string,
  approvedBy: string
): void {
  const teacher = teachers.find((t) => t.githubUsername === githubUsername)
  if (teacher) {
    teacher.role = "animator"
    teacher.approvedBy = approvedBy
    teacher.approvedAt = new Date().toISOString()
  }
}

export function denyTeacherRequest(githubUsername: string): void {
  const idx = teachers.findIndex((t) => t.githubUsername === githubUsername)
  if (idx >= 0) {
    teachers.splice(idx, 1)
  }
}

export function getTeachers(): TeacherProfile[] {
  return teachers
}