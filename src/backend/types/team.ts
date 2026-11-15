export interface TeamMember {
  /** GitHub username of the team member. */
  username: string
  /** Roll number (unique, e.g. 25MCAB24). */
  rollNo: string
  /** Display name. */
  displayName?: string
  /** Whether this member created the team. */
  isLead: boolean
  /** ISO timestamp when the member joined. */
  joinedAt: string
}

export interface Team {
  id: string
  /** The assignment this team belongs to (Sprint 0 = assignment being formed against). */
  assignmentId: string
  /** Project title chosen by the team. */
  projectTitle: string
  /** Optional abstract document URL (submitted at Sprint 0). */
  abstractDocUrl?: string
  /** Team members. Max 3, min 1. */
  members: TeamMember[]
  /** GitHub username of the student who created the team. */
  createdBy: string
  /** ISO timestamp. */
  createdAt: string
  /** ISO timestamp of last update. */
  updatedAt: string
  /** Current sprint status: "forming" | "submitted" | "accepted" | "rejected" | "completed" */
  status: "forming" | "submitted" | "accepted" | "rejected" | "completed"
  /** Faculty feedback when rejected. */
  reviewNotes?: string
  /** ISO timestamp of faculty review. */
  reviewedAt?: string
  /** Faculty member who reviewed. */
  reviewedBy?: string
}

export interface CreateTeamInput {
  assignmentId: string
  projectTitle: string
  members: string[] // usernames
  /** The roll number of the creator, used to look up the roster entry. */
  creatorRollNo?: string
}

export interface JoinTeamInput {
  teamId: string
  username: string
  rollNo: string
  /** The student joining consents to join the existing project by default. */
  consentToExistingProject: boolean
}

export interface LeaveTeamInput {
  teamId: string
  username: string
}

export interface TeamWithRoster extends Team {
  /** Resolved roster entries for each member (for roll number sorting/display). */
  rosterEntries: Array<{ rollNo: string; displayName?: string; githubUsername?: string }>
}

export interface UpdateTeamInput {
  projectTitle?: string
  abstractDocUrl?: string
  members?: TeamMember[]
  status?: Team["status"]
  reviewNotes?: string
  reviewedBy?: string
}
