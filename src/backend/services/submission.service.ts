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
import { parseRepoUrl, getRepoInfo, getLatestCommit, getDiffMetrics } from "../github/repos"

export async function createSubmission(
  input: CreateSubmissionInput,
  studentToken?: string
): Promise<SubmissionWithSprints> {
  const existing = getSubmissionByStudentAndAssignment(
    input.studentUsername,
    input.assignmentId
  )
  if (existing) {
    throw new Error("Submission already exists for this assignment")
  }

  const { owner, repo } = parseRepoUrl(input.repoUrl)

  if (!studentToken) {
    throw new Error(
      "Your GitHub session has no access token, so the repository could not be read. Sign out and back in, then submit again."
    )
  }

  // Faculty review commit diffs on github.com with their own account: a
  // private repository answers 404 for them and the sprint can never be
  // reviewed. Catch it now, while the student can still flip visibility.
  let repoInfo
  try {
    repoInfo = await getRepoInfo(studentToken, owner, repo)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(
      `GitHub could not read ${owner}/${repo}: ${msg}. Check the URL and that the repository exists.`
    )
  }
  if (repoInfo.private) {
    throw new Error(
      "This repository is private. Faculty review commit diffs on GitHub, so set the repository to public (Settings → Danger Zone → Change visibility) and submit again."
    )
  }

  // A transient GitHub failure must not cost the student their submission:
  // record Sprint 0 without a SHA, and let later sprints diff from their own
  // base instead. The timeline shows "commit not captured" for it.
  let initialSha = ""
  try {
    const latest = await getLatestCommit(studentToken, owner, repo)
    initialSha = latest.sha
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.toLowerCase().includes("no commit")) {
      throw new Error(
        "Repository has no commits yet. Please push an initial commit (e.g. README.md) before submitting Sprint 0."
      )
    }
    console.error("[submission] could not snapshot the Sprint 0 commit:", msg)
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

  const sprint0: SprintSubmission = {
    id: `sprint-${Date.now()}-0`,
    submissionId: submission.id,
    sprintNumber: 0,
    commitSha: initialSha,
    isPivot: false,
    documentationUrl: input.abstractDocUrl,
    summary: {
      completed: ["Sprint 0: Project abstract and repository initialized"],
      changed: "Initial commit snapshot",
      blockers: "",
    },
    submittedAt: submission.createdAt,
  }
  addSprintSubmission(sprint0)

  return withSprints(submission)
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

/**
 * Submissions across every assignment, narrowed to the class teams a scoped
 * member of staff is allowed to see. Pass null for unrestricted access.
 */
export function getSubmissionsForFaculty(
  scopedClasses: string[] | null
): SubmissionWithSprints[] {
  if (scopedClasses === null) return getAllSubmissions()

  return getSubmissions()
    .filter((s) => {
      const assignment = getAssignment(s.assignmentId)
      if (!assignment) return false
      return assignment.assignedTeams.some((t) => scopedClasses.includes(t))
    })
    .map((s) => withSprints(s))
}

export function getSubmissionForStudentAndAssignment(
  studentUsername: string,
  assignmentId: string
): SubmissionWithSprints | null {
  const sub = getSubmissionByStudentAndAssignment(studentUsername, assignmentId)
  return sub ? withSprints(sub) : null
}

function withSprints(sub: Submission): SubmissionWithSprints {
  let sprints = getSprintSubmissions(sub.id)
  // Ensure legacy or existing submissions created without Sprint 0 get backfilled
  if (!sprints.some((s) => s.sprintNumber === 0) && sub.repoUrl) {
    const syntheticSprint0: SprintSubmission = {
      id: `sprint-${sub.id}-0`,
      submissionId: sub.id,
      sprintNumber: 0,
      commitSha: "",
      isPivot: false,
      documentationUrl: sub.abstractDocUrl,
      summary: {
        completed: ["Sprint 0: Project abstract and repository initialized"],
        changed: "Initial commit snapshot",
        blockers: "",
      },
      submittedAt: sub.createdAt,
    }
    addSprintSubmission(syntheticSprint0)
    sprints = getSprintSubmissions(sub.id)
  }
  return {
    ...sub,
    sprints,
  }
}

/** Normalizes a repo URL to `owner/repo` (lowercase) for equality checks. */
function repoUrlKey(url: string): string {
  try {
    const { owner, repo } = parseRepoUrl(url)
    return `${owner.toLowerCase()}/${repo.toLowerCase()}`
  } catch {
    return url.trim().toLowerCase()
  }
}

/**
 * Records a sprint submission.
 *
 * `studentToken` must be the submitting student's own OAuth token, not the org
 * token: students keep their project in a personal repo, which an org-scoped
 * credential (App installation token, or a PAT owned by someone else) cannot
 * see. GitHub answers 404 for repos it will not show you, so using the wrong
 * token here fails as "Not Found" on a repo the student can open fine.
 */
export async function submitSprint(
  submissionId: string,
  input: SubmitSprintInput,
  studentToken: string
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

  const latest = await getLatestCommit(studentToken, owner, repo)
  const headSha = latest.sha

  // The previous sprint always lives in the repository that was current when
  // it was recorded — `submission.repoUrl` only changes on a pivot, and this
  // pivot has not been applied yet. A pivot therefore changes repos, and
  // GitHub cannot compare commits across two different repositories, so the
  // diff is skipped rather than failing the whole submission.
  const sameRepoAsPrevious =
    !input.isPivot ||
    repoUrlKey(input.repoUrl) === repoUrlKey(submission.repoUrl)

  let diffMetrics: DiffMetrics | undefined
  if (input.sprintNumber > 0 && sameRepoAsPrevious) {
    const base = getSprintSubmission(submissionId, input.sprintNumber - 1)
    if (base?.commitSha) {
      try {
        diffMetrics = await getDiffMetrics(
          studentToken,
          owner,
          repo,
          base.commitSha,
          headSha
        )
      } catch (err) {
        // Metrics are informational. A rewritten history (force push), a base
        // commit GitHub can no longer compare, or a rate limit must not throw
        // away a submission the student has already made.
        console.error(
          "[submission] could not compute the sprint diff:",
          err instanceof Error ? err.message : err
        )
      }
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

  // Deliberately not touching reviewedBy/reviewedAt: correcting a missing or
  // wrong SHA (e.g. a Sprint 0 snapshot that failed) is bookkeeping, and the
  // timeline renders any reviewedAt as "reviewed".
  updateSprintSubmission(submissionId, sprintNumber, {
    commitSha: newCommitSha,
  })
  console.info(
    `[submission] ${requestedBy} corrected sprint ${sprintNumber} of ${submissionId} to ${newCommitSha}`
  )
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