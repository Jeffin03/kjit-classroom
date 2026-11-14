import { describe, expect, it } from "vitest"
import { cleanSprintSummary } from "./validation"

describe("cleanSprintSummary", () => {
  it("accepts the payload the submit form sends", () => {
    expect(
      cleanSprintSummary({
        completed: ["Built the layout"],
        changed: "Added CSS",
        blockers: "",
        demoUrl: "https://example.com/demo",
      })
    ).toEqual({
      completed: ["Built the layout"],
      changed: "Added CSS",
      blockers: "",
      demoUrl: "https://example.com/demo",
    })
  })

  it("drops empty completed items and trims text", () => {
    expect(
      cleanSprintSummary({
        completed: ["  Ship it  ", "", "   "],
        changed: "  x ",
        blockers: " none ",
      })
    ).toEqual({ completed: ["Ship it"], changed: "x", blockers: "none" })
  })

  it("omits demoUrl when blank", () => {
    const cleaned = cleanSprintSummary({
      completed: ["a"],
      changed: "b",
      blockers: "",
      demoUrl: "",
    })
    expect(cleaned).not.toBeNull()
    expect(cleaned!.demoUrl).toBeUndefined()
  })

  it("rejects a plain string (the shape that broke the API contract)", () => {
    expect(cleanSprintSummary("just a string")).toBeNull()
  })

  it("rejects non-objects and arrays", () => {
    expect(cleanSprintSummary(null)).toBeNull()
    expect(cleanSprintSummary(42)).toBeNull()
    expect(cleanSprintSummary([{ completed: [] }])).toBeNull()
  })

  it("rejects a non-array completed list", () => {
    expect(
      cleanSprintSummary({ completed: "Built it", changed: "x", blockers: "" })
    ).toBeNull()
  })

  it("rejects oversized text fields", () => {
    expect(
      cleanSprintSummary({
        completed: ["a"],
        changed: "x".repeat(4001),
        blockers: "",
      })
    ).toBeNull()
  })
})
