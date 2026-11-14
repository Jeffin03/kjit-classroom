import { describe, expect, it } from "vitest"
import {
  extractRollNumber,
  compareRollNumbers,
  getStudentBatch,
} from "./batches"

describe("batch split utilities", () => {
  it("extracts numeric parts from varied roll number formats", () => {
    expect(extractRollNumber("25mcab11")).toBe(11)
    expect(extractRollNumber("25MCAB01")).toBe(1)
    expect(extractRollNumber("CS-42")).toBe(42)
    expect(extractRollNumber("100")).toBe(100)
    expect(extractRollNumber("no-digits")).toBeNull()
  })

  it("sorts roll numbers naturally", () => {
    const rolls = ["25mcab10", "25mcab2", "25mcab1", "25mcab20"]
    rolls.sort(compareRollNumbers)
    expect(rolls).toEqual(["25mcab1", "25mcab2", "25mcab10", "25mcab20"])
  })

  it("splits sequentially 50-50", () => {
    const total = 60
    // First 30 students (index 0..29) -> Batch 1
    expect(getStudentBatch("25mcab01", 0, total, { splitType: "sequential" })).toBe(1)
    expect(getStudentBatch("25mcab30", 29, total, { splitType: "sequential" })).toBe(1)
    // Next 30 students (index 30..59) -> Batch 2
    expect(getStudentBatch("25mcab31", 30, total, { splitType: "sequential" })).toBe(2)
    expect(getStudentBatch("25mcab60", 59, total, { splitType: "sequential" })).toBe(2)
  })

  it("splits odd-even", () => {
    expect(getStudentBatch("25mcab01", 0, 60, { splitType: "oddeven" })).toBe(1)
    expect(getStudentBatch("25mcab02", 1, 60, { splitType: "oddeven" })).toBe(2)
    expect(getStudentBatch("25mcab15", 14, 60, { splitType: "oddeven" })).toBe(1)
    expect(getStudentBatch("25mcab16", 15, 60, { splitType: "oddeven" })).toBe(2)
  })

  it("splits with custom cutoff", () => {
    const config = { splitType: "custom" as const, customCutoff: 25 }
    expect(getStudentBatch("25mcab25", 24, 60, config)).toBe(1)
    expect(getStudentBatch("25mcab26", 25, 60, config)).toBe(2)
  })
})
