import { describe, expect, it } from "vitest"
import { facultyTeamSlugs, isFacultyTeam } from "./teams"

describe("faculty team recognition", () => {
  it("probes kjt-faculty alongside conventional names by default", () => {
    expect(facultyTeamSlugs()).toContain("kjit-faculty")
    expect(facultyTeamSlugs()).toContain("faculty")
  })

  it("honors GITHUB_FACULTY_TEAM when set", () => {
    process.env.GITHUB_FACULTY_TEAM = "kjit-faculty"
    expect(facultyTeamSlugs()).toEqual(["kjit-faculty"])
    delete process.env.GITHUB_FACULTY_TEAM
  })

  it("matches the KJIT Faculty team by slug or display name", () => {
    expect(isFacultyTeam({ slug: "kjit-faculty" })).toBe(true)
    expect(isFacultyTeam({ slug: "KJIT-FACULTY" })).toBe(true)
    expect(isFacultyTeam({ name: "KJIT Faculty" })).toBe(true)
    expect(isFacultyTeam({ name: "KJIT-Faculty" })).toBe(true)
  })

  it("does not mistake class teams for faculty", () => {
    expect(isFacultyTeam({ slug: "cse-ai-2024", name: "CSE AI 2024" })).toBe(false)
    expect(isFacultyTeam({ slug: "faculty", name: "Faculty" })).toBe(true)
    expect(isFacultyTeam({ name: "KJIT Faculty Alumni" })).toBe(false)
  })
})
