import type { Submission, SprintSubmission } from "../types"

const submissions: Submission[] = []
const sprintSubmissions: SprintSubmission[] = []

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
}

export function updateSubmission(
  id: string,
  updates: Partial<Omit<Submission, "id">>
): void {
  const submission = submissions.find((s) => s.id === id)
  if (submission) {
    Object.assign(submission, updates)
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