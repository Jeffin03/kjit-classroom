import { describe, expect, it } from "vitest"
import { parseRepoUrl } from "./repos"

describe("parseRepoUrl", () => {
  it("reads the standard https form", () => {
    expect(parseRepoUrl("https://github.com/ada/portfolio")).toEqual({
      owner: "ada",
      repo: "portfolio",
    })
  })

  it("strips a .git suffix", () => {
    expect(parseRepoUrl("https://github.com/ada/portfolio.git")).toEqual({
      owner: "ada",
      repo: "portfolio",
    })
  })

  it("accepts the ssh form", () => {
    expect(parseRepoUrl("git@github.com:ada/portfolio.git")).toEqual({
      owner: "ada",
      repo: "portfolio",
    })
  })

  it("ignores trailing paths and query strings", () => {
    expect(parseRepoUrl("https://github.com/ada/portfolio/tree/main?tab=readme")).toEqual({
      owner: "ada",
      repo: "portfolio",
    })
  })

  it("rejects a non-GitHub URL", () => {
    expect(() => parseRepoUrl("https://gitlab.com/ada/portfolio")).toThrow(
      /Invalid GitHub repository URL/
    )
  })
})
