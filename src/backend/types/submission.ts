export interface SprintSummary {
  completed: string[]
  changed: string
  blockers: string
  demoUrl?: string
}

export interface DiffMetrics {
  totalCommits: number
  filesChanged: number
  additions: number
  deletions: number
  newFiles: string[]
  modifiedFiles: string[]
  removedFiles: string[]
}

export interface SprintSubmission {
  id: string
  submissionId: string
  sprintNumber: number
  commitSha: string
  isPivot: boolean
  previousRepoUrl?: string
  documentationUrl: string
  summary?: SprintSummary
  diffMetrics?: DiffMetrics
  submittedAt: string
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
}

export interface Submission {
  id: string
  studentUsername: string
  assignmentId: string
  repoUrl: string
  abstractDocUrl: string
  status: "active" | "completed" | "accepted"
  createdAt: string
}

export interface SubmissionWithSprints extends Submission {
  sprints: SprintSubmission[]
}

export interface CreateSubmissionInput {
  studentUsername: string
  assignmentId: string
  repoUrl: string
  abstractDocUrl: string
}

export interface SubmitSprintInput {
  sprintNumber: number
  repoUrl: string
  documentationUrl?: string
  summary?: SprintSummary
  isPivot?: boolean
  previousRepoUrl?: string
}