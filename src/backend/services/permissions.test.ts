import { describe, expect, it } from "vitest"
import { ROLE_CAPABILITIES } from "./permissions"

const caps = (role: keyof typeof ROLE_CAPABILITIES) =>
  new Set<string>(ROLE_CAPABILITIES[role])

describe("role capability matrix", () => {
  it("lets students create submissions but never review or see all", () => {
    const student = caps("student")
    expect(student.has("submission.create")).toBe(true)
    expect(student.has("submission.review")).toBe(false)
    expect(student.has("submission.readAll")).toBe(false)
    expect(student.has("roster.write")).toBe(false)
  })

  it("keeps teaching approval owner-only", () => {
    expect(caps("owner").has("teacher.approve")).toBe(true)
    expect(caps("animator").has("teacher.approve")).toBe(false)
    expect(caps("subject-teacher").has("teacher.approve")).toBe(false)
    expect(caps("elective-teacher").has("teacher.approve")).toBe(false)
  })

  it("does not let elective teachers create assignments or edit rosters", () => {
    const elective = caps("elective-teacher")
    expect(elective.has("assignment.create")).toBe(false)
    expect(elective.has("roster.write")).toBe(false)
    expect(elective.has("submission.review")).toBe(true)
  })

  it("gives subject teachers the same review surface as animators", () => {
    const subject = caps("subject-teacher")
    const animator = caps("animator")
    expect(subject.has("assignment.create")).toBe(true)
    expect(subject.has("roster.write")).toBe(true)
    expect(animator.has("submission.accept")).toBe(true)
    expect(subject.has("submission.commitOverride")).toBe(true)
  })

  it("gives unrostered users nothing but class names", () => {
    expect([...ROLE_CAPABILITIES.unrostered]).toEqual(["team.read"])
  })
})
