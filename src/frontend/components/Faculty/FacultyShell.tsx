"use client"

import { useEffect, useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useSessionUser, type Role } from "@/frontend/hooks/useSessionUser"
import logo from "@/frontend/assets/KJU_Logo.webp"

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

interface NavItem {
  href: string
  label: string
  capability?: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  {
    href: "/faculty",
    label: "Dashboard",
    icon: (
      <Icon>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </Icon>
    ),
  },
  {
    href: "/faculty/review",
    label: "Review",
    icon: (
      <Icon>
        <path d="M4.75 12.75 9.5 17.5 19.25 6.5" />
      </Icon>
    ),
  },
  {
    href: "/faculty/roster",
    label: "Student Roster",
    icon: (
      <Icon>
        <circle cx="9" cy="8" r="3.25" />
        <path d="M2.75 19.75v-1a4.25 4.25 0 0 1 4.25-4.25h4a4.25 4.25 0 0 1 4.25 4.25v1" />
        <path d="M16 5.2a3.25 3.25 0 0 1 0 5.9" />
        <path d="M17.5 14.7a4.25 4.25 0 0 1 3.75 4.25v.8" />
      </Icon>
    ),
  },
  {
    href: "/faculty/requests",
    label: "Faculty Roster",
    capability: "teacher.approve",
    icon: (
      <Icon>
        <path d="M3.5 13h5l1.5 2.5h4L15.5 13h5" />
        <path d="M5 4.75h14l1.5 8.25V19a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-6l1.5-8.25Z" />
      </Icon>
    ),
  },
]

const roleLabels: Record<Role, string> = {
  owner: "Org owner",
  animator: "Animator (all classes)",
  "subject-teacher": "Subject teacher",
  "elective-teacher": "Elective teacher",
  student: "Student",
  unrostered: "Not on roster",
}

function isActiveRoute(pathname: string, href: string) {
  if (href === "/faculty") return pathname === "/faculty"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarNav({
  pathname,
  capabilities,
  onNavigate,
  onClose,
  pendingRequests = 0,
  title = "Faculty",
}: {
  pathname: string
  capabilities: readonly string[]
  onNavigate: () => void
  onClose?: () => void
  pendingRequests?: number
  title?: string
}) {
  const visibleItems = navItems.filter(
    (item) => !item.capability || capabilities.includes(item.capability)
  )

  return (
    <nav aria-label="Faculty" className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border)] px-5">
        <span className="flex items-center gap-2.5">
          <Image
            src={logo}
            alt=""
            sizes="32px"
            className="h-8 w-8 object-contain"
          />
          <span className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
            {title}
          </span>
        </span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]"
          >
            <Icon>
              <path d="M6 18 18 6" />
              <path d="M18 18 6 6" />
            </Icon>
          </button>
        ) : null}
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map((item) => {
          const active = isActiveRoute(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                    : "text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {item.label}
                {item.href === "/faculty/requests" && pendingRequests > 0 && (
                  <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">
                    {pendingRequests}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>

    </nav>
  )
}

export default function FacultyShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user, username, role, capabilities } = useSessionUser()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pendingRequests, setPendingRequests] = useState(0)

  useEffect(() => {
    if (!capabilities.includes("teacher.approve")) return
    fetch("/api/requests")
      .then((r) => (r.ok ? r.json() : { requests: [] }))
      .then((data) => {
        if (Array.isArray(data.requests)) setPendingRequests(data.requests.length)
      })
      .catch(() => {})
  }, [capabilities])

  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [drawerOpen])

  const closeDrawer = () => setDrawerOpen(false)
  const displayName = user?.name || (username ? `@${username}` : "Faculty")
  const initial = (user?.name || username || "?").trim().charAt(0).toUpperCase()

  return (
    <div className="min-h-full">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[var(--color-border)] bg-white lg:block">
        <SidebarNav
          pathname={pathname}
          capabilities={capabilities}
          onNavigate={closeDrawer}
          pendingRequests={pendingRequests}
          title={role === "owner" ? "Admin" : "Faculty"}
        />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            aria-hidden="true"
            tabIndex={-1}
            onClick={closeDrawer}
            className="absolute inset-0 bg-[var(--color-ink)]/25"
          />
          <div
            id="faculty-drawer"
            className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-[var(--color-border)] bg-white shadow-xl"
          >
            <SidebarNav
              pathname={pathname}
              capabilities={capabilities}
              onNavigate={closeDrawer}
              onClose={closeDrawer}
              pendingRequests={pendingRequests}
              title={role === "owner" ? "Admin" : "Faculty"}
            />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              aria-controls="faculty-drawer"
              className="-ml-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)] lg:hidden"
            >
              <Icon>
                <path d="M3.75 6.75h16.5" />
                <path d="M3.75 12h16.5" />
                <path d="M3.75 17.25h16.5" />
              </Icon>
            </button>
            <span className="truncate text-sm font-medium text-[var(--color-ink-muted)]">
              KJIT Classroom
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent)]"
            >
              {initial}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-sm font-medium leading-tight text-[var(--color-ink)]">
                {displayName}
              </span>
              <span className="block truncate text-xs leading-tight text-[var(--color-ink-muted)]">
                {roleLabels[role]}
              </span>
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]"
            >
              Sign out
            </button>
          </div>
        </header>

        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  )
}
