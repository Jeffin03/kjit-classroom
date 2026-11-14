"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useSessionUser, type Role } from "@/frontend/hooks/useSessionUser"
import banner from "@/frontend/assets/KJU_Banner.png"
import CommandPalette, { CommandPaletteTrigger } from "@/frontend/components/CommandPalette"

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

function getBreadcrumb(pathname: string, role: Role) {
  const root = role === "owner" ? "Admin" : "Faculty"
  if (pathname === "/faculty") return { section: root, page: "Dashboard" }
  if (pathname.startsWith("/faculty/review")) return { section: root, page: "Sprint Review" }
  if (pathname.startsWith("/faculty/roster")) return { section: root, page: "Student Roster" }
  if (pathname.startsWith("/faculty/requests")) return { section: root, page: "Faculty Roster & Staffing" }
  if (pathname.startsWith("/faculty/class")) {
    const parts = pathname.split("/")
    const team = parts[3] ? decodeURIComponent(parts[3]) : "Class"
    return { section: "Classes", page: team }
  }
  if (pathname.startsWith("/faculty/assignments/new")) return { section: "Assignments", page: "New Subject" }
  if (pathname.startsWith("/faculty/assignments")) return { section: root, page: "Assignments" }
  if (pathname.startsWith("/profile")) return { section: "Account", page: "Profile" }
  return { section: root, page: "Overview" }
}

function SidebarNav({
  pathname,
  capabilities,
  onNavigate,
  onClose,
  pendingRequests = 0,
  role = "animator",
}: {
  pathname: string
  capabilities: readonly string[]
  onNavigate: () => void
  onClose?: () => void
  pendingRequests?: number
  role?: Role
}) {
  const visibleItems = navItems.filter(
    (item) => !item.capability || capabilities.includes(item.capability)
  )

  return (
    <nav aria-label="Faculty" className="flex h-full flex-col bg-surface">
      {/* Brand & Portal Anchor */}
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-5">
        <Link
          href="/faculty"
          onClick={onNavigate}
          className="flex flex-col justify-center min-w-0 group"
        >
          <span className="text-sm font-bold tracking-tight text-ink leading-tight">
            KJIT Classroom
          </span>
          <span className="mt-1 inline-flex items-center">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                role === "owner"
                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                  : "bg-accent-soft text-accent"
              }`}
            >
              {role === "owner" ? "Admin Console" : "Faculty Portal"}
            </span>
          </span>
        </Link>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="-mr-1.5 inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-canvas hover:text-ink transition-colors"
          >
            <Icon>
              <path d="M6 18 18 6" />
              <path d="M18 18 6 6" />
            </Icon>
          </button>
        ) : null}
      </div>

      {/* Nav Items Section */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-ink-subtle">
          Workspace
        </div>
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const active = isActiveRoute(pathname, item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-accent-soft text-accent font-semibold shadow-2xs"
                      : "text-ink-muted hover:bg-canvas hover:text-ink"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-accent" />
                  )}
                  <span
                    className={`shrink-0 transition-colors ${
                      active
                        ? "text-accent"
                        : "text-ink-faint group-hover:text-ink"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.href === "/faculty/requests" && pendingRequests > 0 && (
                    <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                      {pendingRequests}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Quick Switch Footer */}
      <div className="mt-auto border-t border-border p-3">
        <Link
          href="/dashboard"
          className="flex items-center justify-between rounded-xl p-2.5 text-xs text-ink-muted hover:bg-canvas hover:text-ink transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="font-medium">Student View</span>
          </div>
          <span className="text-[11px] text-ink-faint font-medium">Switch →</span>
        </Link>
      </div>
    </nav>
  )
}

export default function FacultyShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user, username, role, capabilities } = useSessionUser()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingRequests, setPendingRequests] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [menuOpen])

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
  const breadcrumb = getBreadcrumb(pathname, role)

  return (
    <div className="min-h-full">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-surface lg:block">
        <SidebarNav
          pathname={pathname}
          capabilities={capabilities}
          onNavigate={closeDrawer}
          pendingRequests={pendingRequests}
          role={role}
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
            className="absolute inset-0 bg-ink/25"
          />
          <div
            id="faculty-drawer"
            className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface shadow-2xl"
          >
            <SidebarNav
              pathname={pathname}
              capabilities={capabilities}
              onNavigate={closeDrawer}
              onClose={closeDrawer}
              pendingRequests={pendingRequests}
              role={role}
            />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 relative">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              aria-controls="faculty-drawer"
              className="-ml-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-canvas hover:text-ink transition-colors lg:hidden"
            >
              <Icon>
                <path d="M3.75 6.75h16.5" />
                <path d="M3.75 12h16.5" />
                <path d="M3.75 17.25h16.5" />
              </Icon>
            </button>

            {/* Desktop Contextual Breadcrumb */}
            <nav aria-label="Breadcrumb" className="hidden lg:flex items-center gap-2 text-sm">
              <span className="font-medium text-ink-muted">
                {breadcrumb.section}
              </span>
              <span className="text-border-strong select-none font-light">/</span>
              <span className="font-semibold text-ink tracking-tight">
                {breadcrumb.page}
              </span>
            </nav>
          </div>

          {/* Center: KJU Banner */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto">
            <Link
              href="/faculty"
              className="flex items-center transition-opacity hover:opacity-90"
            >
              <Image
                src={banner}
                alt="Somaiya Vidyavihar University / KJIT"
                priority
                className="h-8 sm:h-9 md:h-10 w-auto object-contain max-w-[170px] sm:max-w-[240px] md:max-w-none"
              />
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <CommandPaletteTrigger onClick={() => setSearchOpen(true)} />

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
                className="flex items-center gap-2.5 rounded-xl p-1 transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-accent"
              >
                <span
                  aria-hidden
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent)] shrink-0"
                >
                  {initial}
                </span>
                <span className="hidden min-w-0 sm:block text-left">
                  <span className="block truncate text-sm font-medium leading-tight text-[var(--color-ink)]">
                    {displayName}
                  </span>
                  <span className="block truncate text-xs leading-tight text-[var(--color-ink-muted)]">
                    {roleLabels[role]}
                  </span>
                </span>
                <svg
                  className="size-3.5 text-ink-faint transition-transform hidden sm:block"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-border bg-surface p-2 shadow-lg"
                >
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    <p className="truncate text-xs text-ink-subtle">{roleLabels[role]}</p>
                  </div>
                  <div className="my-1 h-px bg-border" />
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-canvas hover:text-ink"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/dashboard"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-canvas hover:text-ink"
                  >
                    Switch to student view
                  </Link>
                  <div className="my-1 h-px bg-border" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false)
                      void signOut()
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink-muted hover:bg-canvas hover:text-ink"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>

      <CommandPalette
        open={searchOpen}
        onOpen={() => setSearchOpen(true)}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  )
}
