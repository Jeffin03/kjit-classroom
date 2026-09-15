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

export interface TeacherProfile {
  id: string
  githubUsername: string
  email: string
  role: "pending" | "animator" | "subject-teacher" | "elective-teacher"
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