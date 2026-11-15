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
  /** The student who clicked submit (for backward compat & audit). */
  studentUsername: string
  /** Optional: the team this submission belongs to. When set, dedup & ownership are team-scoped. */
  teamId?: string
  /** All team member usernames (for display & permission checks). */
  teamMembers?: string[]
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
  /** Optional team id for team-based submissions. */
  teamId?: string
  /** Optional team members for team-based submissions. */
  teamMembers?: string[]
}

export interface SubmitSprintInput {
  sprintNumber: number
  repoUrl: string
  documentationUrl?: string
  summary?: SprintSummary
  isPivot?: boolean
  previousRepoUrl?: string
}