export interface RosterEntry {
  rollNo: string
  collegeEmail: string
  githubUsername?: string
  githubUserId?: number
  /** GitHub profile display name, captured at onboarding. Falls back to the handle. */
  displayName?: string
  classTeam: string
  status: "invited" | "active" | "no-account"
  onboardedBy: string
  onboardedAt: string
}

export type ApprovedTeacherRole =
  | "animator"
  | "subject-teacher"
  | "elective-teacher"

export interface TeacherProfile {
  id: string
  githubUsername: string
  /** GitHub profile display name, captured when the faculty record is created. */
  displayName?: string
  email: string
  role: "pending" | ApprovedTeacherRole
  classes: string[]
  approvedBy?: string
  approvedAt?: string
  requestedAt: string
}

export interface OnboardingSession {
  id: string
  teacherId: string
  classTeam: string
  csvRows: { rollNo: string; collegeEmail: string; githubUsername?: string }[]
  matched: {
    rollNo: string
    collegeEmail: string
    githubUsername: string
    githubAvatar: string
    /** GitHub profile display name, when GitHub returned one. */
    displayName?: string
    matchedVia?: "email" | "username"
  }[]
  unmatched: { rollNo: string; collegeEmail: string }[]
  status: "uploading" | "matching" | "confirming" | "completed"
  createdAt: string
}