/**
 * Minimal RFC 4180 cell splitter for one CSV line.
 *
 * Roster exports from Excel/Sheets quote cells that contain a comma — e.g.
 * `"Doe, Jane",jane@kjit.edu,MCA-A-2025-26` — and the naive `line.split(",")`
 * shifts every later column, so the email ends up in the GitHub-username slot.
 * This handles quoted cells and the `""` escape for a literal quote.
 *
 * Line-based on purpose: the onboarding wizard reads one row per line, and a
 * quoted cell containing a real newline is not a shape any registrar export has
 * produced yet.
 */
export function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ",") {
      cells.push(current)
      current = ""
    } else {
      current += char
    }
  }

  cells.push(current)
  return cells.map((cell) => cell.trim())
}
