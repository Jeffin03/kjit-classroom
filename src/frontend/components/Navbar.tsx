"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isFaculty, setIsFaculty] = useState(false)

  const isActive = (path: string) => pathname === path

  useEffect(() => {
    if (session) {
      const username = session.user?.name
      if (!username) return

      Promise.all([
        fetch("/api/org/owners").then((r) => r.json()),
        fetch("/api/teachers").then((r) => r.json()),
      ]).then(([ownersData, teacherData]) => {
        const isOwner = ownersData.owners?.includes(username)
        const isAnimator = teacherData.profile?.role === "animator"
        setIsFaculty(isOwner || isAnimator)
      })
    }
  }, [session])

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
                  className="text-sm text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] px-3 py-1 rounded-md hover:bg-[var(--color-canvas)]"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/api/auth/signin"
                className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#372FA8] transition-colors"
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