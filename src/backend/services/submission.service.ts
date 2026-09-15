import type {
  Submission,
  SprintSubmission,
  SubmissionWithSprints,
  CreateSubmissionInput,
  SubmitSprintInput,
  DiffMetrics,
} from "../types"
import {
  addSubmission,
  addSprintSubmission,
  getSprintSubmission,
  getSprintSubmissionById,
  getSprintSubmissions,
  getSubmissionByStudentAndAssignment,
  getSubmissionById,
  getSubmissionsByAssignment,
  getSubmissionsByStudent,
  getSubmissions,
  updateSprintSubmission,
  updateSubmission,
  hasCommitHash,
} from "../store/submissions"
import { getAssignment } from "../store/assignments"
import {
  getOrgToken,
} from "../github/client"
import { parseRepoUrl, getLatestCommit, getDiffMetrics } from "../github/repos"

export function createSubmission(
  input: CreateSubmissionInput
): Submission {
  const existing = getSubmissionByStudentAndAssignment(
    input.studentUsername,
    input.assignmentId
  )
  if (existing) {
    throw new Error("Submission already exists for this assignment")
  }

  const submission: Submission = {
    id: `sub-${Date.now()}`,
    studentUsername: input.studentUsername,
    assignmentId: input.assignmentId,
    repoUrl: input.repoUrl,
    abstractDocUrl: input.abstractDocUrl,
    status: "active",
    createdAt: new Date().toISOString(),
  }
  addSubmission(submission)
  return submission
}

export function getSubmissionsForStudent(
  studentUsername: string
): SubmissionWithSprints[] {
  const subs = getSubmissionsByStudent(studentUsername)
  return subs.map((s) => withSprints(s))
}

export function getSubmissionsForAssignment(
  assignmentId: string
): SubmissionWithSprints[] {
  const subs = getSubmissionsByAssignment(assignmentId)
  return subs.map((s) => withSprints(s))
}

export function getAllSubmissions(): SubmissionWithSprints[] {
  return getSubmissions().map((s) => withSprints(s))
}

export function getSubmissionForStudentAndAssignment(
  studentUsername: string,
  assignmentId: string
): SubmissionWithSprints | null {
  const sub = getSubmissionByStudentAndAssignment(studentUsername, assignmentId)
  return sub ? withSprints(sub) : null
}

function withSprints(sub: Submission): SubmissionWithSprints {
  return {
    ...sub,
    sprints: getSprintSubmissions(sub.id),
  }
}

export async function submitSprint(
  submissionId: string,
  input: SubmitSprintInput
): Promise<SprintSubmission> {
  const submission = getSubmissionById(submissionId)
  if (!submission) {
    throw new Error("Submission not found")
  }

  const assignment = getAssignment(submission.assignmentId)
  if (!assignment) {
    throw new Error("Assignment not found")
  }

  if (
    input.sprintNumber < 0 ||
    input.sprintNumber >= assignment.sprintCount
  ) {
    throw new Error(
      `Invalid sprint number ${input.sprintNumber}. Must be 0-${assignment.sprintCount - 1}`
    )
  }

  const existing = getSprintSubmission(submissionId, input.sprintNumber)
  if (existing && !input.isPivot) {
    throw new Error(`Sprint ${input.sprintNumber} was already submitted`)
  }

  const { owner, repo } = parseRepoUrl(input.repoUrl)

  const token = await getOrgToken()
  const latest = await getLatestCommit(token, owner, repo)
  const headSha = latest.sha

  let diffMetrics: DiffMetrics | undefined
  if (input.sprintNumber > 0) {
    const base = getSprintSubmission(submissionId, input.sprintNumber - 1)
    if (base) {
      diffMetrics = await getDiffMetrics(
        token,
        owner,
        repo,
        base.commitSha,
        headSha
      )
    }
  }

  const sprint: SprintSubmission = {
    id: existing?.id ?? `sprint-${Date.now()}`,
    submissionId,
    sprintNumber: input.sprintNumber,
    commitSha: headSha,
    isPivot: input.isPivot ?? false,
    previousRepoUrl: input.isPivot ? submission.repoUrl : undefined,
    documentationUrl: input.documentationUrl || submission.abstractDocUrl,
    summary: input.summary,
    diffMetrics,
    submittedAt: new Date().toISOString(),
  }
  addSprintSubmission(sprint)

  if (input.isPivot) {
    updateSubmission(submissionId, {
      repoUrl: input.repoUrl,
      status: "active",
    })
  }

  markSubmissionCompleted(submissionId)

  return sprint
}

export function updateSprintCommitHash(
  submissionId: string,
  sprintNumber: number,
  newCommitSha: string,
  requestedBy: string
): void {
  const sprint = getSprintSubmission(submissionId, sprintNumber)
  if (!sprint) {
    throw new Error(`Sprint ${sprintNumber} not found`)
  }

  if (sprint.commitSha === newCommitSha) {
    throw new Error("New commit hash is the same as the current one")
  }

  if (hasCommitHash(submissionId, newCommitSha)) {
    throw new Error("This commit hash is already used by another sprint")
  }

  updateSprintSubmission(submissionId, sprintNumber, {
    commitSha: newCommitSha,
    reviewedBy: requestedBy,
    reviewedAt: new Date().toISOString(),
  })
}

export function reviewSprint(
  sprintSubmissionId: string,
  reviewedBy: string,
  notes: string
): void {
  const sprint = getSprintSubmissionById(sprintSubmissionId)
  if (!sprint) {
    throw new Error("Sprint submission not found")
  }

  updateSprintSubmission(sprint.submissionId, sprint.sprintNumber, {
    reviewNotes: notes,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
  })
}

export function acceptSubmission(submissionId: string, reviewedBy: string): void {
  const submission = getSubmissionById(submissionId)
  if (!submission) {
    throw new Error("Submission not found")
  }

  const sprints = getSprintSubmissions(submissionId)
  for (const sprint of sprints) {
    if (!sprint.reviewedAt) {
      updateSprintSubmission(submissionId, sprint.sprintNumber, {
        reviewNotes: sprint.reviewNotes || "Accepted in lab review",
        reviewedBy,
        reviewedAt: new Date().toISOString(),
      })
    }
  }

  updateSubmission(submissionId, { status: "accepted" })
}

export function markSubmissionCompleted(submissionId: string): void {
  const submission = getSubmissionById(submissionId)
  if (!submission) return
  const sprints = getSprintSubmissions(submissionId)
  const assignment = getAssignment(submission.assignmentId)
  if (!assignment) return
  if (sprints.length >= assignment.sprintCount) {
    updateSubmission(submissionId, { status: "completed" })
  }
}