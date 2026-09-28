export interface RosterEntry {
  rollNo: string
  collegeEmail: string
  githubUsername?: string
  githubUserId?: number
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
  csvRows: { rollNo: string; collegeEmail: string }[]
  matched: {
    rollNo: string
    collegeEmail: string
    githubUsername: string
    githubAvatar: string
  }[]
  unmatched: { rollNo: string; collegeEmail: string }[]
  status: "uploading" | "matching" | "confirming" | "completed"
  createdAt: string
}