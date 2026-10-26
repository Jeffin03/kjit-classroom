import type { ApprovedTeacherRole, TeacherProfile } from "../types"
import { KEYS, mutated, registerCollection } from "./persistence"

const teachers: TeacherProfile[] = []

registerCollection({
  key: KEYS.teachers,
  getAll: () => teachers,
  replace: (items) => {
    teachers.splice(0, teachers.length, ...(items as TeacherProfile[]))
  },
  entityId: (item) => (item as TeacherProfile).githubUsername,
})

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
  const stored = teachers.find((t) => t.githubUsername === profile.githubUsername)
  mutated(KEYS.teachers, profile.githubUsername, stored ?? profile)
}

export function getPendingTeacherRequests(): TeacherProfile[] {
  return teachers.filter((t) => t.role === "pending")
}

export function approveTeacherRequest(
  githubUsername: string,
  approvedBy: string,
  role: ApprovedTeacherRole = "animator"
): void {
  const teacher = teachers.find((t) => t.githubUsername === githubUsername)
  if (teacher) {
    teacher.role = role
    teacher.approvedBy = approvedBy
    teacher.approvedAt = new Date().toISOString()
    mutated(KEYS.teachers, githubUsername, teacher)
  }
}

export function denyTeacherRequest(githubUsername: string): void {
  const idx = teachers.findIndex((t) => t.githubUsername === githubUsername)
  if (idx >= 0) {
    teachers.splice(idx, 1)
    mutated(KEYS.teachers, githubUsername, null)
  }
}

export function removeTeacher(githubUsername: string): void {
  denyTeacherRequest(githubUsername)
}

export function getTeachers(): TeacherProfile[] {
  return teachers
}