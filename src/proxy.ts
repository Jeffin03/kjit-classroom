import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import {
  readSessionIdentity,
  resolveAccess,
  can,
} from "@/backend/services/permissions"

/**
 * Optimistic gate only — authoritative checks live in the route handlers via
 * services/permissions.ts. Role resolution reads in-memory state (org owners
 * are cached), and only `/faculty/*` needs it, so the matched public routes
 * skip it entirely.
 */

/**
 * The one `/faculty` route that must stay open to signed-in users who do not
 * yet hold a faculty role: none anymore — the teacher self-request surface was
 * removed (owners onboard teachers directly). Every faculty route requires
 * `assignment.readStats`.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const identity = await readSessionIdentity(request.headers)

  if (!identity) {
    const url = new URL("/signin", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  const access = await resolveAccess(identity.login)

  if (pathname.startsWith("/faculty")) {
    if (!can(access, "assignment.readStats")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // Faculty never see the student shell: bounce them to their own dashboard.
  const isStudentView =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/assignments" ||
    pathname.startsWith("/assignments/")
  if (isStudentView && access.isFaculty) {
    return NextResponse.redirect(new URL("/faculty", request.url))
  }

  return NextResponse.next()
}

/**
 * `/announcements` is deliberately not matched: the page only client-redirects
 * to `/dashboard#announcements`, so gating it here would bounce signed-out
 * visitors to /signin just to send them back through this gate.
 */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/faculty/:path*",
    "/assignments/:path*",
  ],
}
