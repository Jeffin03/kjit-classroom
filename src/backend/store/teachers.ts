import type { ApprovedTeacherRole, TeacherProfile } from "../types"
import { KEYS, mutated, registerCollection } from "./persistence"

const teachers: TeacherProfile[] = []

registerCollection({
  key: KEYS.teachers,
  getAll: () => teachers,
  replace: (items) => {
    teachers.splice(0, teachers.length, ...(items as TeacherProfile[]))
  },
  entityId: (item) =>
    (item as TeacherProfile).githubUsername.toLowerCase(),
})

export function getTeacherByGithubUsername(
  username: string
): TeacherProfile | undefined {
  const needle = username.toLowerCase()
  return teachers.find((t) => t.githubUsername.toLowerCase() === needle)
}

export function addTeacherProfile(profile: TeacherProfile): void {
  const needle = profile.githubUsername.toLowerCase()
  const existing = teachers.findIndex(
    (t) => t.githubUsername.toLowerCase() === needle
  )
  if (existing >= 0) {
    teachers[existing] = { ...teachers[existing], ...profile }
  } else {
    teachers.push(profile)
  }
  const stored = teachers.find(
    (t) => t.githubUsername.toLowerCase() === needle
  )
  mutated(KEYS.teachers, needle, stored ?? profile)
}

export function getPendingTeacherRequests(): TeacherProfile[] {
  return teachers.filter((t) => t.role === "pending")
}

export function approveTeacherRequest(
  githubUsername: string,
  approvedBy: string,
  role: ApprovedTeacherRole = "animator"
): void {
  const teacher = teachers.find(
    (t) => t.githubUsername.toLowerCase() === githubUsername.toLowerCase()
  )
  if (teacher) {
    teacher.role = role
    teacher.approvedBy = approvedBy
    teacher.approvedAt = new Date().toISOString()
    mutated(KEYS.teachers, teacher.githubUsername.toLowerCase(), teacher)
  }
}

export function denyTeacherRequest(githubUsername: string): void {
  const idx = teachers.findIndex(
    (t) => t.githubUsername.toLowerCase() === githubUsername.toLowerCase()
  )
  if (idx >= 0) {
    const removed = teachers[idx]
    teachers.splice(idx, 1)
    mutated(KEYS.teachers, removed.githubUsername.toLowerCase(), null)
  }
}

export function removeTeacher(githubUsername: string): void {
  denyTeacherRequest(githubUsername)
}

export function getTeachers(): TeacherProfile[] {
  return teachers
}