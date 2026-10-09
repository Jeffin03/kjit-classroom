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
 * yet hold a faculty role: it is the application form for requesting one.
 * Every other faculty route requires `assignment.readStats`.
 */
const FACULTY_PUBLIC_ROUTES = new Set(["/faculty/request"])

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const identity = await readSessionIdentity(request.headers)

  if (!identity) {
    const url = new URL("/signin", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  if (
    pathname.startsWith("/faculty") &&
    !FACULTY_PUBLIC_ROUTES.has(pathname)
  ) {
    const access = await resolveAccess(identity.login)
    if (!can(access, "assignment.readStats")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/faculty/:path*",
    "/assignments/:path*",
    "/announcements/:path*",
  ],
}
