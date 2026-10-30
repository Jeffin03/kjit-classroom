/**
 * Runs once per server process. Surfaces missing configuration at boot instead
 * of letting the app silently render as signed-out / unrostered.
 *
 * This deliberately logs rather than throws so a build or preview deployment
 * without secrets still starts; `/api/health` reports the same checks and
 * returns 503 while anything is missing.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (process.env.NEXT_PHASE === "phase-production-build") return

  const { checkEnv } = await import("./backend/env")
  const issues = checkEnv().filter((check) => !check.ok)

  if (issues.length === 0) return

  console.error(
    [
      "[env] Missing or invalid configuration:",
      ...issues.map((issue) => `  - ${issue.name}${issue.hint ? ` — ${issue.hint}` : ""}`),
      "See /api/health for the live status.",
    ].join("\n")
  )
}
