import type { Assignment, AssignmentWithStats, CreateAssignmentInput } from "../types"
import { addAssignment, getAssignment, getAssignments } from "../store/assignments"
import { cleanString, cleanStringList } from "../validation"
import { getSubmissionsByAssignment, getSprintSubmissions } from "../store/submissions"
import { getClassTeamForUsername } from "../store/roster"

export const DEFAULT_SPRINT_COUNT = 4

export type AssignmentInputResult =
  | { ok: true; value: Partial<CreateAssignmentInput> }
  | { ok: false; error: string }

/**
 * Validates untrusted assignment input once, so POST and PATCH cannot drift
 * apart. `partial` allows PATCH to send only the fields it changes.
 */
export function validateAssignmentInput(
  input: Partial<CreateAssignmentInput>,
  { partial = false }: { partial?: boolean } = {}
): AssignmentInputResult {
  const value: Partial<CreateAssignmentInput> = {}

  const textFields = [
    ["title", 200],
    ["description", 2000],
    ["subject", 120],
    ["problemStatement", 10_000],
  ] as const

  for (const [field, max] of textFields) {
    if (input[field] === undefined) {
      if (!partial) return { ok: false, error: `${field} is required` }
      continue
    }
    const cleaned = cleanString(input[field], max)
    if (!cleaned) {
      return {
        ok: false,
        error: `${field} must be a non-empty string of at most ${max} characters`,
      }
    }
    value[field] = cleaned
  }

  if (input.deadline === undefined) {
    if (!partial) return { ok: false, error: "deadline is required" }
  } else {
    const deadline = cleanString(input.deadline, 40)
    if (!deadline || Number.isNaN(new Date(deadline).getTime())) {
      return { ok: false, error: "deadline must be a valid date (YYYY-MM-DD)" }
    }
    value.deadline = deadline
  }

  if (input.assignedTeams === undefined) {
    if (!partial) return { ok: false, error: "assignedTeams is required" }
  } else {
    const teams = cleanStringList(input.assignedTeams, {
      maxItems: 50,
      maxLength: 200,
    })
    if (!teams || teams.length === 0) {
      return {
        ok: false,
        error: "assignedTeams must contain at least one class team",
      }
    }
    value.assignedTeams = teams
  }

  for (const field of [
    "objectives",
    "requirements",
    "evaluationCriteria",
  ] as const) {
    if (input[field] === undefined) continue
    const list = cleanStringList(input[field], {
      maxItems: 50,
      maxLength: 500,
    })
    if (!list) {
      return {
        ok: false,
        error: `${field} must be a list of non-empty strings`,
      }
    }
    value[field] = list
  }

  if (input.allowLateSubmissions !== undefined) {
    if (typeof input.allowLateSubmissions !== "boolean") {
      return { ok: false, error: "allowLateSubmissions must be a boolean" }
    }
    value.allowLateSubmissions = input.allowLateSubmissions
  }

  return { ok: true, value }
}

/** Submissions stay open through the end of the deadline day. */
export function isDeadlinePassed(assignment: Assignment): boolean {
  const end = new Date(`${assignment.deadline}T23:59:59.999`)
  if (!Number.isNaN(end.getTime())) return Date.now() > end.getTime()

  const fallback = new Date(assignment.deadline)
  return !Number.isNaN(fallback.getTime()) && Date.now() > fallback.getTime()
}

export function deadlineMessage(assignment: Assignment): string {
  return (
    `The deadline for "${assignment.title}" passed on ${assignment.deadline} ` +
    "and late submissions are not enabled."
  )
}

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
    sprintCount: DEFAULT_SPRINT_COUNT,
    allowLateSubmissions: data.allowLateSubmissions === true,
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

/**
 * Assignments visible to a member of staff. `scopedClasses` of null means
 * unrestricted; otherwise only assignments targeting those class teams.
 */
export function getAssignmentsForFaculty(
  scopedClasses: string[] | null
): Assignment[] {
  const all = getAssignments()
  if (scopedClasses === null) return all
  return all.filter((a) => a.assignedTeams.some((t) => scopedClasses.includes(t)))
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