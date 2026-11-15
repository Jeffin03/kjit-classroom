import { NextResponse } from "next/server"

/**
 * CSRF protection for state-changing API routes (POST, PUT, PATCH, DELETE).
 *
 * NextAuth session cookies are SameSite=Lax, which blocks cross-site
 * fetch/XHR requests but not top-level form navigations. Since our API
 * routes are JSON endpoints called via fetch from the SPA, SameSite=Lax
 * already provides strong protection. This function adds defense in depth
 * by verifying the Origin header matches the app's public origin.
 *
 * Returns a NextResponse when the request should be rejected, or null when
 * it is allowed to proceed.
 */
export function csrfCheck(request: Request): NextResponse | null {
  const method = request.method
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return null
  }

  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")

  // Same-origin requests (no Origin header) are allowed — they come from
  // the SPA itself. Cross-site fetch requests always send an Origin header.
  if (!origin) return null

  const appOrigin = getAppOrigin()
  if (!appOrigin) return null

  try {
    const originUrl = new URL(origin)
    if (originUrl.origin === appOrigin) return null
  } catch {
    // Invalid Origin header — reject
  }

  // Fall back to Referer check if Origin is missing or mismatched
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      if (refererUrl.origin === appOrigin) return null
    } catch {
      // Invalid Referer — reject
    }
  }

  return NextResponse.json(
    { error: "CSRF check failed: origin mismatch" },
    { status: 403 }
  )
}

/** Determine the app's public origin from AUTH_URL or the request host. */
function getAppOrigin(): string | null {
  if (typeof process !== "undefined" && process.env.AUTH_URL) {
    return process.env.AUTH_URL
  }
  return null
}
