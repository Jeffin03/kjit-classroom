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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="font-bold text-xl text-gray-900">
                KJIT Classroom
              </span>
            </Link>

            {session && (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  href="/assignments"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/assignments")
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Assignments
                </Link>
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/dashboard")
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  My Dashboard
                </Link>
                <Link
                  href="/announcements"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/announcements")
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Announcements
                </Link>
                {isFaculty && (
                  <Link
                    href="/faculty"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive("/faculty")
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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
                <span className="text-sm text-gray-700 hidden sm:block">
                  {session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/api/auth/signin"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
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
