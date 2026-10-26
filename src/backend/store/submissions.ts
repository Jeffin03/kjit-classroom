import type { Submission, SprintSubmission } from "../types"
import { KEYS, mutated, registerCollection } from "./persistence"

const submissions: Submission[] = []
const sprintSubmissions: SprintSubmission[] = []

registerCollection({
  key: KEYS.submissions,
  getAll: () => submissions,
  replace: (items) => {
    submissions.splice(0, submissions.length, ...(items as Submission[]))
  },
  entityId: (item) => (item as Submission).id,
})

registerCollection({
  key: KEYS.sprints,
  getAll: () => sprintSubmissions,
  replace: (items) => {
    sprintSubmissions.splice(
      0,
      sprintSubmissions.length,
      ...(items as SprintSubmission[])
    )
  },
  // The store dedupes by submission + sprint, so that composite — not the
  // random id — is the stable identity for sync.
  entityId: (item) => {
    const sprint = item as SprintSubmission
    return `${sprint.submissionId}::${sprint.sprintNumber}`
  },
})

export function getSubmissionById(id: string): Submission | undefined {
  return submissions.find((s) => s.id === id)
}

export function getSubmissionsByStudent(
  studentUsername: string
): Submission[] {
  return submissions.filter((s) => s.studentUsername === studentUsername)
}

export function getSubmissionsByAssignment(
  assignmentId: string
): Submission[] {
  return submissions.filter((s) => s.assignmentId === assignmentId)
}

export function getSubmissionByStudentAndAssignment(
  studentUsername: string,
  assignmentId: string
): Submission | undefined {
  return submissions.find(
    (s) => s.studentUsername === studentUsername && s.assignmentId === assignmentId
  )
}

export function getSubmissions(): Submission[] {
  return submissions
}

export function addSubmission(submission: Submission): void {
  const existing = submissions.findIndex((s) => s.id === submission.id)
  if (existing >= 0) {
    submissions[existing] = { ...submissions[existing], ...submission }
  } else {
    submissions.push(submission)
  }
  const stored = submissions.find((s) => s.id === submission.id)
  mutated(KEYS.submissions, submission.id, stored ?? submission)
}

export function updateSubmission(
  id: string,
  updates: Partial<Omit<Submission, "id">>
): void {
  const submission = submissions.find((s) => s.id === id)
  if (submission) {
    Object.assign(submission, updates)
    mutated(KEYS.submissions, id, submission)
  }
}

// Sprint submissions

export function getSprintSubmissions(submissionId: string): SprintSubmission[] {
  return sprintSubmissions
    .filter((s) => s.submissionId === submissionId)
    .sort((a, b) => a.sprintNumber - b.sprintNumber)
}

export function getSprintSubmission(
  submissionId: string,
  sprintNumber: number
): SprintSubmission | undefined {
  return sprintSubmissions.find(
    (s) => s.submissionId === submissionId && s.sprintNumber === sprintNumber
  )
}

export function getSprintSubmissionById(
  id: string
): SprintSubmission | undefined {
  return sprintSubmissions.find((s) => s.id === id)
}

export function addSprintSubmission(sprint: SprintSubmission): void {
  const existing = sprintSubmissions.findIndex(
    (s) => s.submissionId === sprint.submissionId && s.sprintNumber === sprint.sprintNumber
  )
  if (existing >= 0) {
    sprintSubmissions[existing] = { ...sprintSubmissions[existing], ...sprint }
  } else {
    sprintSubmissions.push(sprint)
  }
  const key = `${sprint.submissionId}::${sprint.sprintNumber}`
  const stored = sprintSubmissions.find(
    (s) => `${s.submissionId}::${s.sprintNumber}` === key
  )
  mutated(KEYS.sprints, key, stored ?? sprint)
}

export function updateSprintSubmission(
  submissionId: string,
  sprintNumber: number,
  updates: Partial<Omit<SprintSubmission, "id" | "submissionId" | "sprintNumber">>
): void {
  const sprint = sprintSubmissions.find(
    (s) => s.submissionId === submissionId && s.sprintNumber === sprintNumber
  )
  if (sprint) {
    Object.assign(sprint, updates)
    mutated(KEYS.sprints, `${submissionId}::${sprintNumber}`, sprint)
  }
}

export function hasCommitHash(
  submissionId: string,
  commitSha: string
): boolean {
  return sprintSubmissions.some(
    (s) => s.submissionId === submissionId && s.commitSha === commitSha
  )
}