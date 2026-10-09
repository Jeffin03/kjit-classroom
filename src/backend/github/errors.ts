// GitHub reports validation failures as { message: "Validation Failed",
// errors: [...] }, which is useless on its own in the UI — flatten the
// error list into readable detail ("login not_found", ...).
export type GitHubErrorEntry =
  | { resource?: string; field?: string; code?: string }
  | string

export function githubErrorDetail(
  errors: GitHubErrorEntry[] | undefined
): string {
  if (!Array.isArray(errors) || errors.length === 0) return ""
  return errors
    .map((e) =>
      typeof e === "string" ? e : [e.field, e.code].filter(Boolean).join(" ")
    )
    .filter(Boolean)
    .join("; ")
}

export function githubErrorMessage(
  err: { message?: string; errors?: GitHubErrorEntry[] },
  fallback: string,
  status: number
): string {
  const detail = githubErrorDetail(err.errors)
  return (
    (err.message || fallback) +
    ` (HTTP ${status})` +
    (detail ? `: ${detail}` : "")
  )
}

export function githubErrorCodes(
  err: { errors?: GitHubErrorEntry[] } | undefined
): string[] {
  const errors = err?.errors
  if (!Array.isArray(errors)) return []
  return errors.map((e) => (typeof e === "string" ? e : (e.code ?? "")))
}
