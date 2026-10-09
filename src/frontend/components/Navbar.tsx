"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { isFaculty, role, team, loading: accessLoading } = useSessionUser()

  const isActive = (path: string) => pathname === path

  if (pathname.startsWith("/faculty")) return null

  return (
    <nav className="bg-white border-b border-[var(--color-border)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--color-accent)] rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">K</span>
              </div>
              <span className="font-semibold text-lg tracking-tight text-[var(--color-ink)]">
                KJIT Classroom
              </span>
            </Link>

            {session && (
              <div className="hidden md:flex items-center gap-4">
                {!accessLoading && role === "unrostered" && (
                  <span className="px-3 py-1 rounded-md text-xs font-medium bg-[var(--color-caution-soft)] text-[var(--color-caution-text)]">
                    Not on roster
                  </span>
                )}
                {!accessLoading && team && !isFaculty && (
                  <span className="px-3 py-1 rounded-md text-xs font-medium bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                    {team}
                  </span>
                )}
                <Link
                  href="/assignments"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/assignments")
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                      : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-canvas)]"
                  }`}
                >
                  Assignments
                </Link>
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/dashboard")
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                      : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-canvas)]"
                  }`}
                >
                  My Dashboard
                </Link>
                <Link
                  href="/announcements"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/announcements")
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                      : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-canvas)]"
                  }`}
                >
                  Announcements
                </Link>
                {isFaculty && (
                  <Link
                    href="/faculty"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive("/faculty")
                        ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                        : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-canvas)]"
                    }`}
                  >
                    Faculty
                  </Link>
                )}
                {!accessLoading && !isFaculty && (
                  <Link
                    href="/faculty/request"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive("/faculty/request")
                        ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                        : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-canvas)]"
                    }`}
                  >
                    Request access
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3">
                <img
                  src={session.user?.image || ""}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-[var(--color-ink-muted)] hidden sm:block">
                  {session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] px-3 py-1 rounded-md hover:bg-[var(--color-canvas)]"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/signin"
                className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Sign in with GitHub
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}