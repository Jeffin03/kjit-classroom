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
