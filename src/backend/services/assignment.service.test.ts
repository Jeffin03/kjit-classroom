import { describe, expect, it } from "vitest"
import {
  isDeadlinePassed,
  validateAssignmentInput,
} from "./assignment.service"
import type { Assignment } from "../types"

const baseAssignment: Assignment = {
  id: "assignment-test",
  title: "Portfolio Website",
  description: "Build a portfolio",
  assignedTeams: ["MCA-A-2025-26"],
  deadline: "2099-12-31",
  subject: "Web Development",
  problemStatement: "Ship a portfolio",
  objectives: [],
  requirements: [],
  evaluationCriteria: [],
  sprintCount: 4,
  createdBy: "owner",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

const validInput = {
  title: "  Portfolio Website  ",
  description: "Build a portfolio",
  subject: "Web Development",
  deadline: "2099-12-31",
  problemStatement: "Ship a portfolio",
  assignedTeams: ["MCA-A-2025-26"],
}

describe("validateAssignmentInput", () => {
  it("rejects a missing required field", () => {
    const result = validateAssignmentInput({ ...validInput, title: "" })
    expect(result.ok).toBe(false)
  })

  it("trims text and defaults optional lists", () => {
    const result = validateAssignmentInput(validInput)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.title).toBe("Portfolio Website")
      expect(result.value.objectives).toBeUndefined()
    }
  })

  it("allows partial updates", () => {
    const result = validateAssignmentInput(
      { allowLateSubmissions: true },
      { partial: true }
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.allowLateSubmissions).toBe(true)
    }
  })

  it("requires every partial field it receives to be valid", () => {
    const result = validateAssignmentInput(
      { assignedTeams: [] },
      { partial: true }
    )
    expect(result.ok).toBe(false)
  })

  it("rejects a non-boolean late-submission flag", () => {
    const result = validateAssignmentInput(
      { ...validInput, allowLateSubmissions: "yes" as unknown as boolean }
    )
    expect(result.ok).toBe(false)
  })

  it("rejects more than the maximum number of teams", () => {
    const result = validateAssignmentInput({
      ...validInput,
      assignedTeams: Array.from({ length: 51 }, (_, i) => `team-${i}`),
    })
    expect(result.ok).toBe(false)
  })
})

describe("isDeadlinePassed", () => {
  it("keeps the deadline day open", () => {
    expect(isDeadlinePassed(baseAssignment)).toBe(false)
  })

  it("reports a past deadline", () => {
    expect(
      isDeadlinePassed({ ...baseAssignment, deadline: "2000-01-01" })
    ).toBe(true)
  })
})
