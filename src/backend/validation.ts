/**
 * Pure input-normalization helpers shared by API routes and services. Kept
 * free of framework imports so they can be unit-tested without a DOM or a
 * Next.js runtime.
 */

/** Trimmed non-empty string, or null. */
export function cleanString(value: unknown, maxLength?: number): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (maxLength && trimmed.length > maxLength) return null
  return trimmed
}

/**
 * Validates and normalizes a list of non-empty strings. Returns null when the
 * value is not an array of acceptable strings.
 */
export function cleanStringList(
  value: unknown,
  { maxItems = 50, maxLength = 500 }: { maxItems?: number; maxLength?: number } = {}
): string[] | null {
  if (!Array.isArray(value)) return null
  if (value.length > maxItems) return null

  const result: string[] = []
  for (const item of value) {
    const cleaned = cleanString(item, maxLength)
    if (!cleaned) return null
    result.push(cleaned)
  }
  return result
}

/** Capped, trimmed string that may legitimately be empty (e.g. "blockers"). */
function cleanOptionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (trimmed.length > maxLength) return null
  return trimmed
}

/**
 * Validates the structured sprint summary the submit form sends
 * (`{ completed[], changed, blockers, demoUrl? }`). Returns null when the
 * value is not a well-formed summary, so routes can answer 400 instead of
 * persisting an object the review UI cannot render.
 */
export function cleanSprintSummary(
  value: unknown
): { completed: string[]; changed: string; blockers: string; demoUrl?: string } | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>

  const completed = Array.isArray(raw.completed)
    ? raw.completed
        .filter(
          (item) => typeof item === "string" && item.trim().length > 0 && item.length <= 500
        )
        .map((item) => (item as string).trim())
    : null
  if (!completed) return null

  const changed = cleanOptionalText(raw.changed, 4000)
  const blockers = cleanOptionalText(raw.blockers ?? "", 4000)
  if (changed === null || blockers === null) return null

  const summary: {
    completed: string[]
    changed: string
    blockers: string
    demoUrl?: string
  } = { completed, changed, blockers }

  if (raw.demoUrl !== undefined && raw.demoUrl !== null && raw.demoUrl !== "") {
    const demoUrl = cleanOptionalText(raw.demoUrl, 2000)
    if (demoUrl === null) return null
    summary.demoUrl = demoUrl
  }

  return summary
}
