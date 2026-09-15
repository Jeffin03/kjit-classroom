"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const tabs = [
  { href: "/faculty", label: "Dashboard" },
  { href: "/faculty/assignments", label: "Assignments" },
  { href: "/faculty/review", label: "Review" },
  { href: "/faculty/roster", label: "Roster" },
  { href: "/faculty/onboard", label: "Onboard" },
  { href: "/faculty/requests", label: "Requests" },
]

export default function FacultyTabBar() {
  const pathname = usePathname()

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const active =
              pathname === tab.href ||
              (tab.href !== "/faculty" && pathname.startsWith(tab.href))
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}