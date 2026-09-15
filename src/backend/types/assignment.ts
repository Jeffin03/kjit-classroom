export interface Assignment {
  id: string
  title: string
  description: string
  assignedTeams: string[]
  deadline: string
  subject: string
  problemStatement: string
  objectives: string[]
  requirements: string[]
  evaluationCriteria: string[]
  sprintCount: 4
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CreateAssignmentInput {
  title: string
  description: string
  assignedTeams: string[]
  deadline: string
  subject: string
  problemStatement: string
  objectives?: string[]
  requirements?: string[]
  evaluationCriteria?: string[]
}

export interface SprintCompletion {
  studentUsername: string
  sprintNumber: number
  completed: boolean
  pivot?: boolean
}

export interface AssignmentWithStats extends Assignment {
  submissions: {
    studentUsername: string
    status: "active" | "completed" | "accepted"
    sprintsCompleted: number[]
    latestCommit: string
    pivot?: boolean
  }[]
}