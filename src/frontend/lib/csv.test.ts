import { describe, expect, it } from "vitest"
import { splitCsvLine } from "./csv"

describe("splitCsvLine", () => {
  it("splits an unquoted row", () => {
    expect(splitCsvLine("23MCA001,ada@kjit.edu,ada")).toEqual([
      "23MCA001",
      "ada@kjit.edu",
      "ada",
    ])
  })

  it("keeps a comma inside a quoted name in one cell", () => {
    // The regression this parser exists for: a naive split(",") shifts every
    // later column, so the email lands in the GitHub-username slot.
    expect(splitCsvLine('"Doe, Jane",jane@kjit.edu,janedoe')).toEqual([
      "Doe, Jane",
      "jane@kjit.edu",
      "janedoe",
    ])
  })

  it('unescapes "" inside a quoted cell', () => {
    expect(splitCsvLine('23MCA002,"a ""quoted"" name",ana@kjit.edu,ana')).toEqual([
      "23MCA002",
      'a "quoted" name',
      "ana@kjit.edu",
      "ana",
    ])
  })

  it("trims whitespace around cells and quoted cells", () => {
    expect(splitCsvLine(' 23MCA003 , "B, C" ,b@kjit.edu ')).toEqual([
      "23MCA003",
      "B, C",
      "b@kjit.edu",
    ])
  })

  it("preserves empty cells", () => {
    expect(splitCsvLine("23MCA004,,b@kjit.edu,")).toEqual([
      "23MCA004",
      "",
      "b@kjit.edu",
      "",
    ])
  })

  it("treats a single cell as one column", () => {
    expect(splitCsvLine("23MCA005")).toEqual(["23MCA005"])
  })
})
