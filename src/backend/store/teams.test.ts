import { beforeEach, describe, expect, it } from "vitest"
import {
  createTeam,
  getTeamByMemberAndAssignment,
  joinTeam,
  resolveTeamMembers,
} from "./teams"

const ASSIGNMENT_A = "test-assignment-a"
const ASSIGNMENT_B = "test-assignment-b"

describe("teams store", () => {
  let counter = 0
  const unique = (name: string) => `${name}${counter}`

  beforeEach(() => {
    counter += 1
  })

  it("scopes teams per assignment so one student can be on different teams", () => {
    const student = unique("scoped")
    const teammate = unique("scopedmate")

    const teamA = createTeam({
      assignmentId: ASSIGNMENT_A,
      projectTitle: "Project A",
      members: [student],
    })
    const teamB = createTeam({
      assignmentId: ASSIGNMENT_B,
      projectTitle: "Project B",
      members: [student, teammate],
    })

    expect(getTeamByMemberAndAssignment(student, ASSIGNMENT_A)?.id).toBe(teamA.id)
    expect(getTeamByMemberAndAssignment(student, ASSIGNMENT_B)?.id).toBe(teamB.id)
    expect(getTeamByMemberAndAssignment(teammate, ASSIGNMENT_A)).toBeUndefined()
  })

  it("rejects a student who is already on a team for the same assignment", () => {
    const student = unique("dupe")

    createTeam({
      assignmentId: ASSIGNMENT_A,
      projectTitle: "First",
      members: [student],
    })

    expect(() =>
      createTeam({
        assignmentId: ASSIGNMENT_A,
        projectTitle: "Second",
        members: [student],
      })
    ).toThrow(/already on a team/i)
  })

  it("lets a student join an open team", () => {
    const lead = unique("lead")
    const joiner = unique("joiner")

    const team = createTeam({
      assignmentId: ASSIGNMENT_A,
      projectTitle: "Open team",
      members: [lead],
    })

    const updated = joinTeam({
      teamId: team.id,
      username: joiner,
      rollNo: `R-${joiner}`,
      consentToExistingProject: true,
    })

    expect(updated.members.map((m) => m.username)).toEqual([lead, joiner])
    expect(getTeamByMemberAndAssignment(joiner, ASSIGNMENT_A)?.id).toBe(team.id)
  })

  it("refuses to join a full team", () => {
    const members = [unique("full1"), unique("full2"), unique("full3")]
    const extra = unique("full4")

    const team = createTeam({
      assignmentId: ASSIGNMENT_A,
      projectTitle: "Full team",
      members,
    })

    expect(() =>
      joinTeam({
        teamId: team.id,
        username: extra,
        rollNo: `R-${extra}`,
        consentToExistingProject: true,
      })
    ).toThrow(/full/i)
  })

  it("refuses to join a team when already on another for that assignment", () => {
    const lead = unique("crosslead")
    const joiner = unique("crossjoin")

    createTeam({
      assignmentId: ASSIGNMENT_A,
      projectTitle: "Their team",
      members: [joiner],
    })

    const other = createTeam({
      assignmentId: ASSIGNMENT_A,
      projectTitle: "Other team",
      members: [lead],
    })

    expect(() =>
      joinTeam({
        teamId: other.id,
        username: joiner,
        rollNo: `R-${joiner}`,
        consentToExistingProject: true,
      })
    ).toThrow(/already on a team/i)
  })

  it("refuses duplicate membership in the same team", () => {
    const lead = unique("self")

    const team = createTeam({
      assignmentId: ASSIGNMENT_A,
      projectTitle: "Solo",
      members: [lead],
    })

    expect(() =>
      joinTeam({
        teamId: team.id,
        username: lead,
        rollNo: `R-${lead}`,
        consentToExistingProject: true,
      })
    ).toThrow(/already a member/i)
  })
})

describe("resolveTeamMembers", () => {
  it("always puts the creator first, even with no teammates", () => {
    expect(resolveTeamMembers("creator", [])).toEqual(["creator"])
  })

  it("adds the creator ahead of the requested teammates", () => {
    expect(resolveTeamMembers("creator", ["alice", "bob"])).toEqual([
      "creator",
      "alice",
      "bob",
    ])
  })

  it("dedupes the creator and repeats case-insensitively", () => {
    expect(
      resolveTeamMembers("Creator", ["creator", "ALICE", "alice", ""])
    ).toEqual(["Creator", "ALICE"])
  })

  it("trims whitespace and ignores blank entries", () => {
    expect(resolveTeamMembers("creator", ["  alice  ", "   "])).toEqual([
      "creator",
      "alice",
    ])
  })

  it("makes the creator the lead when the team is created", () => {
    const creator = "leadcreator"
    const members = resolveTeamMembers(creator, ["mate1", "mate2"])

    const team = createTeam({
      assignmentId: "test-assignment-lead",
      projectTitle: "Lead check",
      members,
    })

    expect(team.members[0].username).toBe(creator)
    expect(team.members[0].isLead).toBe(true)
    expect(team.members.some((m) => m.isLead && m.username !== creator)).toBe(
      false
    )
  })
})
