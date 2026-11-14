import { describe, expect, it } from "vitest"
import {
  addSubmission,
  addSprintSubmission,
  getSubmissionsByStudent,
  getSprintSubmissions,
  reconcileSubmissions,
} from "./submissions"
import type { Submission, SprintSubmission } from "../types"

describe("submissions store reconciliation", () => {
  it("merges duplicate submissions for the same student and assignment", () => {
    const student = "teststudent1"
    const assignmentId = "assign-pbl-erp"

    const sub1: Submission = {
      id: "sub-1001",
      studentUsername: student,
      assignmentId,
      repoUrl: "https://github.com/teststudent1/erp",
      abstractDocUrl: "https://docs.google.com/doc-1",
      status: "active",
      createdAt: "2026-11-01T10:00:00Z",
    }

    const sub2: Submission = {
      id: "sub-1002",
      studentUsername: student,
      assignmentId,
      repoUrl: "https://github.com/teststudent1/erp",
      abstractDocUrl: "https://docs.google.com/doc-1",
      status: "active",
      createdAt: "2026-11-02T10:00:00Z",
    }

    addSubmission(sub1)
    addSubmission(sub2)

    // sub1 has sprint 0 and sprint 1
    const sprint0: SprintSubmission = {
      id: "sp-0",
      submissionId: sub1.id,
      sprintNumber: 0,
      commitSha: "sha0",
      isPivot: false,
      documentationUrl: "https://doc.com/0",
      submittedAt: "2026-11-01T10:00:00Z",
    }
    const sprint1: SprintSubmission = {
      id: "sp-1",
      submissionId: sub1.id,
      sprintNumber: 1,
      commitSha: "sha1",
      isPivot: false,
      documentationUrl: "https://doc.com/1",
      submittedAt: "2026-11-02T10:00:00Z",
    }
    // sub2 only has sprint 0
    const sprint0Dup: SprintSubmission = {
      id: "sp-0-dup",
      submissionId: sub2.id,
      sprintNumber: 0,
      commitSha: "sha0-dup",
      isPivot: false,
      documentationUrl: "https://doc.com/0",
      submittedAt: "2026-11-02T10:00:00Z",
    }

    addSprintSubmission(sprint0)
    addSprintSubmission(sprint1)
    addSprintSubmission(sprint0Dup)

    reconcileSubmissions()

    const studentSubs = getSubmissionsByStudent(student)
    expect(studentSubs).toHaveLength(1)
    expect(studentSubs[0].id).toBe(sub1.id)

    const sprints = getSprintSubmissions(studentSubs[0].id)
    expect(sprints).toHaveLength(2)
    expect(sprints.map((s) => s.sprintNumber)).toEqual([0, 1])
  })

  it("re-associates missing sprints from the duplicate into the canonical submission", () => {
    const student = "teststudent2"
    const assignmentId = "assign-pbl-ai"

    const subCanonical: Submission = {
      id: "sub-2001",
      studentUsername: student,
      assignmentId,
      repoUrl: "https://github.com/teststudent2/ai",
      abstractDocUrl: "https://docs.google.com/doc-ai",
      status: "active",
      createdAt: "2026-11-01T10:00:00Z",
    }

    const subDup: Submission = {
      id: "sub-2002",
      studentUsername: student,
      assignmentId,
      repoUrl: "https://github.com/teststudent2/ai",
      abstractDocUrl: "https://docs.google.com/doc-ai",
      status: "active",
      createdAt: "2026-11-02T10:00:00Z",
    }

    addSubmission(subCanonical)
    addSubmission(subDup)

    // subCanonical has sprint 0
    const sprint0: SprintSubmission = {
      id: "sp-ai-0",
      submissionId: subCanonical.id,
      sprintNumber: 0,
      commitSha: "sha-ai-0",
      isPivot: false,
      documentationUrl: "https://doc.com/ai/0",
      submittedAt: "2026-11-01T10:00:00Z",
    }

    // subDup has sprint 1 (submitted separately)
    const sprint1: SprintSubmission = {
      id: "sp-ai-1",
      submissionId: subDup.id,
      sprintNumber: 1,
      commitSha: "sha-ai-1",
      isPivot: false,
      documentationUrl: "https://doc.com/ai/1",
      submittedAt: "2026-11-03T10:00:00Z",
    }

    addSprintSubmission(sprint0)
    addSprintSubmission(sprint1)

    reconcileSubmissions()

    const studentSubs = getSubmissionsByStudent(student)
    expect(studentSubs).toHaveLength(1)
    const canonicalId = studentSubs[0].id

    const sprints = getSprintSubmissions(canonicalId)
    expect(sprints).toHaveLength(2)
    expect(sprints.find((s) => s.sprintNumber === 1)?.submissionId).toBe(canonicalId)
  })
})
