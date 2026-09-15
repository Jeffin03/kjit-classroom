import type { Assignment, AssignmentWithStats, CreateAssignmentInput } from "../types"
import { addAssignment, getAssignment, getAssignments } from "../store/assignments"
import { getSubmissionsByAssignment, getSprintSubmissions } from "../store/submissions"
import { getClassTeamForUsername } from "../store/roster"

export function createAssignment(
  data: CreateAssignmentInput,
  createdBy: string
): Assignment {
  const assignment: Assignment = {
    id: `assignment-${Date.now()}`,
    title: data.title,
    description: data.description,
    assignedTeams: data.assignedTeams,
    deadline: data.deadline,
    subject: data.subject,
    problemStatement: data.problemStatement,
    objectives: data.objectives || [],
    requirements: data.requirements || [],
    evaluationCriteria: data.evaluationCriteria || [],
    sprintCount: 4,
    createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  addAssignment(assignment)
  return assignment
}

export function getAssignmentsForStudent(
  studentUsername: string
): Assignment[] {
  const team = getClassTeamForUsername(studentUsername)
  const all = getAssignments()
  if (!team) return []
  return all.filter((a) => a.assignedTeams.includes(team))
}

export function getAssignmentsForTeam(team: string | null): Assignment[] {
  const all = getAssignments()
  if (!team) return all
  return all.filter((a) => a.assignedTeams.includes(team))
}

export function getAssignmentWithStats(
  assignmentId: string
): AssignmentWithStats | null {
  const assignment = getAssignment(assignmentId)
  if (!assignment) return null

  const submissions = getSubmissionsByAssignment(assignmentId)
  const stats = submissions.map((sub) => {
    const sprints = getSprintSubmissions(sub.id)
    const latest = sprints[sprints.length - 1]
    return {
      studentUsername: sub.studentUsername,
      status: sub.status,
      sprintsCompleted: sprints.map((s) => s.sprintNumber),
      latestCommit: latest?.commitSha ?? "",
      pivot: sprints.some((s) => s.isPivot),
    }
  })

  return { ...assignment, submissions: stats }
}

export function isStudentAssigned(
  assignment: Assignment,
  team: string | null
): boolean {
  if (!team) return false
  return assignment.assignedTeams.includes(team)
}