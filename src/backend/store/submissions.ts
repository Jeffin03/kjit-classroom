import type { Submission, SprintSubmission } from "../types"
import { KEYS, mutated, registerCollection } from "./persistence"

const submissions: Submission[] = []
const sprintSubmissions: SprintSubmission[] = []

registerCollection({
  key: KEYS.submissions,
  getAll: () => submissions,
  replace: (items) => {
    submissions.splice(0, submissions.length, ...(items as Submission[]))
    reconcileSubmissions()
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
    reconcileSubmissions()
  },
  // The store dedupes by submission + sprint, so that composite — not the
  // random id — is the stable identity for sync.
  entityId: (item) => {
    const sprint = item as SprintSubmission
    return `${sprint.submissionId}::${sprint.sprintNumber}`
  },
})

/**
 * Deduplicates and reconciles submissions so that there is at most one
 * submission per (studentUsername, assignmentId). If duplicates exist (e.g. from
 * historical syncs or multiple submissions), merges missing sprints into the
 * canonical submission and removes the duplicate from memory and persistence.
 */
export function reconcileSubmissions(): void {
  if (submissions.length <= 1) return

  const byStudentAndAssignment = new Map<string, Submission[]>()
  for (const s of submissions) {
    const key = `${s.studentUsername.toLowerCase()}::${s.assignmentId}`
    const list = byStudentAndAssignment.get(key)
    if (list) list.push(s)
    else byStudentAndAssignment.set(key, [s])
  }

  for (const [, group] of byStudentAndAssignment) {
    if (group.length <= 1) continue

    // Find the canonical submission:
    // Prefer the one with the most sprint submissions; if equal, prefer accepted or most recent.
    group.sort((a, b) => {
      const aSprints = sprintSubmissions.filter((sp) => sp.submissionId === a.id).length
      const bSprints = sprintSubmissions.filter((sp) => sp.submissionId === b.id).length
      if (bSprints !== aSprints) return bSprints - aSprints
      if (a.status === "accepted" && b.status !== "accepted") return -1
      if (b.status === "accepted" && a.status !== "accepted") return 1
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })

    const canonical = group[0]
    const duplicates = group.slice(1)

    for (const dup of duplicates) {
      if (!canonical.repoUrl && dup.repoUrl) {
        canonical.repoUrl = dup.repoUrl
        mutated(KEYS.submissions, canonical.id, canonical)
      }
      if (!canonical.abstractDocUrl && dup.abstractDocUrl) {
        canonical.abstractDocUrl = dup.abstractDocUrl
        mutated(KEYS.submissions, canonical.id, canonical)
      }

      // Re-assign or prune sprints belonging to duplicate
      const dupSprints = sprintSubmissions.filter((sp) => sp.submissionId === dup.id)
      for (const dupSprint of dupSprints) {
        const canonicalSprint = sprintSubmissions.find(
          (sp) => sp.submissionId === canonical.id && sp.sprintNumber === dupSprint.sprintNumber
        )
        if (!canonicalSprint) {
          dupSprint.submissionId = canonical.id
          mutated(KEYS.sprints, `${canonical.id}::${dupSprint.sprintNumber}`, dupSprint)
        } else {
          let updated = false
          if (!canonicalSprint.commitSha && dupSprint.commitSha) {
            canonicalSprint.commitSha = dupSprint.commitSha
            updated = true
          }
          if (!canonicalSprint.documentationUrl && dupSprint.documentationUrl) {
            canonicalSprint.documentationUrl = dupSprint.documentationUrl
            updated = true
          }
          if (updated) {
            mutated(KEYS.sprints, `${canonical.id}::${canonicalSprint.sprintNumber}`, canonicalSprint)
          }
        }
        mutated(KEYS.sprints, `${dup.id}::${dupSprint.sprintNumber}`, null)
      }

      // Remove duplicate sprints from array
      for (let i = sprintSubmissions.length - 1; i >= 0; i--) {
        if (sprintSubmissions[i].submissionId === dup.id) {
          sprintSubmissions.splice(i, 1)
        }
      }

      // Remove duplicate submission from array
      const index = submissions.indexOf(dup)
      if (index >= 0) {
        submissions.splice(index, 1)
      }
      mutated(KEYS.submissions, dup.id, null)
    }
  }
}

export function getSubmissionById(id: string): Submission | undefined {
  reconcileSubmissions()
  return submissions.find((s) => s.id === id)
}

export function getSubmissionsByStudent(
  studentUsername: string
): Submission[] {
  reconcileSubmissions()
  const needle = studentUsername.toLowerCase()
  return submissions.filter((s) => s.studentUsername.toLowerCase() === needle)
}

export function getSubmissionsByAssignment(
  assignmentId: string
): Submission[] {
  reconcileSubmissions()
  return submissions.filter((s) => s.assignmentId === assignmentId)
}

export function getSubmissionByStudentAndAssignment(
  studentUsername: string,
  assignmentId: string
): Submission | undefined {
  reconcileSubmissions()
  const needle = studentUsername.toLowerCase()
  return submissions.find(
    (s) =>
      s.studentUsername.toLowerCase() === needle &&
      s.assignmentId === assignmentId
  )
}

export function getSubmissions(): Submission[] {
  reconcileSubmissions()
  return submissions
}

/**
 * Removes every submission for an assignment plus their sprint rows. Used when
 * an assignment is deleted so faculty views cannot show orphaned submissions.
 */
export function deleteSubmissionsByAssignment(assignmentId: string): number {
  const removed = submissions.filter((s) => s.assignmentId === assignmentId)
  if (removed.length === 0) return 0

  const ids = new Set(removed.map((s) => s.id))

  for (const submission of removed) {
    submissions.splice(submissions.indexOf(submission), 1)
    mutated(KEYS.submissions, submission.id, null)
  }

  for (let i = sprintSubmissions.length - 1; i >= 0; i--) {
    const sprint = sprintSubmissions[i]
    if (ids.has(sprint.submissionId)) {
      sprintSubmissions.splice(i, 1)
      mutated(
        KEYS.sprints,
        `${sprint.submissionId}::${sprint.sprintNumber}`,
        null
      )
    }
  }

  return removed.length
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