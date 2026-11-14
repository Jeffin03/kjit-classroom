"use client"

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import {
  ClipboardIcon,
  SearchIcon,
  UsersIcon,
} from "@/frontend/components/Icons"

interface SearchItem {
  id: string
  title: string
  subtitle?: string
  category: "Quick Actions" | "Classes" | "Assignments" | "Students"
  href: string
  keywords?: string[]
  badge?: string
}

interface RawAssignment {
  id: string
  title: string
  subject: string
  deadline: string
  assignedTeams: string[]
}

interface RawRosterEntry {
  rollNo: string
  displayName?: string
  githubUsername?: string
  classTeam: string
  collegeEmail?: string
}

function BoltIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

function FolderIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
}

function subscribeNoop() {
  return () => {}
}

function checkIsMac() {
  return (
    typeof window !== "undefined" &&
    /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent)
  )
}

function checkIsMacServer() {
  return true
}

export function CommandPaletteTrigger({
  onClick,
  className = "",
}: {
  onClick: () => void
  className?: string
}) {
  const isMac = useSyncExternalStore(subscribeNoop, checkIsMac, checkIsMacServer)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Search or jump to..."
      className={`group flex items-center gap-2 rounded-lg border border-border bg-canvas/80 px-2.5 py-1.5 text-xs text-ink-muted transition-all hover:border-ink-faint hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-accent ${className}`}
    >
      <SearchIcon className="size-3.5 text-ink-faint transition-colors group-hover:text-ink-muted" />
      <span className="hidden sm:inline">Search or jump to...</span>
      <span className="sm:hidden">Search</span>
      <kbd className="ml-1 hidden items-center gap-0.5 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-faint shadow-2xs group-hover:text-ink-muted sm:inline-flex">
        {isMac ? "⌘K" : "Ctrl K"}
      </kbd>
    </button>
  )
}

function CommandPaletteDialog({
  onClose,
  assignments,
  roster,
  teams,
  loadingData,
}: {
  onClose: () => void
  assignments: RawAssignment[]
  roster: RawRosterEntry[]
  teams: string[]
  loadingData: boolean
}) {
  const router = useRouter()
  const { isFaculty, isOrgOwner, capabilities } = useSessionUser()
  const canCreate = capabilities.includes("assignment.create")
  const canApprove = capabilities.includes("teacher.approve")

  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map())

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Build searchable items
  const allItems: SearchItem[] = useMemo(() => {
    const items: SearchItem[] = []

    // Quick Actions
    if (isFaculty) {
      items.push(
        {
          id: "nav-faculty-dashboard",
          title: "Faculty Dashboard",
          subtitle: "View classes, submissions, and assignment rollups",
          category: "Quick Actions",
          href: "/faculty",
          keywords: ["home", "classes", "overview"],
        },
        {
          id: "nav-review-queue",
          title: "Review Queue",
          subtitle: "Evaluate sprint submissions and commits",
          category: "Quick Actions",
          href: "/faculty/review",
          keywords: ["grading", "sprints", "submissions", "feedback", "accept"],
        },
        {
          id: "nav-student-roster",
          title: "Student Roster",
          subtitle: "All onboarded students across your classes",
          category: "Quick Actions",
          href: "/faculty/roster",
          keywords: ["students", "directory", "rolls"],
        },
        {
          id: "nav-onboard-students",
          title: "Onboard Students",
          subtitle: "Upload class roster CSV and match GitHub accounts",
          category: "Quick Actions",
          href: "/faculty/roster?view=onboard",
          keywords: ["csv", "import", "invite", "add"],
        }
      )

      if (canCreate) {
        items.push({
          id: "nav-new-assignment",
          title: "Create New Assignment",
          subtitle: "Draft problem statement, objectives, and deadlines",
          category: "Quick Actions",
          href: "/faculty/assignments/new",
          keywords: ["new", "add", "project"],
        })
      }

      if (canApprove || isOrgOwner) {
        items.push({
          id: "nav-faculty-access",
          title: "Faculty Access & Roles",
          subtitle: "Approve teachers and scope class permissions",
          category: "Quick Actions",
          href: "/faculty/requests",
          keywords: ["roles", "teachers", "permissions", "access", "owner"],
        })
      }

      items.push({
        id: "nav-profile",
        title: "My Profile",
        subtitle: "View your GitHub account and teaching role",
        category: "Quick Actions",
        href: "/profile",
        keywords: ["account", "me", "settings"],
      })
    } else {
      items.push(
        {
          id: "nav-student-dashboard",
          title: "Dashboard",
          subtitle: "KPI overview and active subject cards",
          category: "Quick Actions",
          href: "/dashboard",
          keywords: ["home", "overview"],
        },
        {
          id: "nav-student-assignments",
          title: "All Assignments",
          subtitle: "Browse project specifications and sprint deadlines",
          category: "Quick Actions",
          href: "/assignments",
          keywords: ["projects", "subjects", "tasks"],
        },
        {
          id: "nav-student-profile",
          title: "My Profile",
          subtitle: "View your roll number, class team, and GitHub link",
          category: "Quick Actions",
          href: "/profile",
          keywords: ["account", "me", "settings"],
        }
      )
    }

    // Classes (Faculty only)
    if (isFaculty) {
      const distinctTeams = new Set<string>(teams)
      roster.forEach((r) => r.classTeam && distinctTeams.add(r.classTeam))
      assignments.forEach((a) =>
        a.assignedTeams?.forEach((t) => distinctTeams.add(t))
      )

      Array.from(distinctTeams)
        .sort()
        .forEach((team) => {
          items.push({
            id: `class-${team}`,
            title: team,
            subtitle: "Class Team",
            category: "Classes",
            href: `/faculty/class/${encodeURIComponent(team)}`,
            keywords: ["class", "team", "section"],
          })
        })
    }

    // Assignments
    assignments.forEach((assignment) => {
      const formattedDate = assignment.deadline
        ? new Date(assignment.deadline).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : ""

      items.push({
        id: `assign-${assignment.id}`,
        title: assignment.title,
        subtitle: `${assignment.subject}${
          formattedDate ? ` · Due ${formattedDate}` : ""
        }`,
        category: "Assignments",
        href: isFaculty
          ? `/faculty/assignments/${assignment.id}`
          : `/assignments/timeline?assignmentId=${assignment.id}`,
        keywords: [
          assignment.subject,
          ...(assignment.assignedTeams || []),
          "sprint",
        ],
        badge: assignment.subject,
      })
    })

    // Students (Faculty only)
    if (isFaculty) {
      roster.forEach((entry) => {
        const studentName = entry.displayName || entry.rollNo
        const handle = entry.githubUsername ? `@${entry.githubUsername}` : ""
        items.push({
          id: `student-${entry.rollNo}-${entry.classTeam}`,
          title: studentName,
          subtitle: `${entry.rollNo} ${handle ? `· ${handle} ` : ""}· ${entry.classTeam}`,
          category: "Students",
          href: entry.githubUsername
            ? `/profile?username=${encodeURIComponent(entry.githubUsername)}`
            : `/faculty/roster?class=${encodeURIComponent(
                entry.classTeam
              )}&search=${encodeURIComponent(entry.rollNo)}`,
          keywords: [
            entry.rollNo,
            entry.githubUsername || "",
            entry.classTeam,
            entry.collegeEmail || "",
          ],
        })
      })
    }

    return items
  }, [assignments, roster, teams, isFaculty, canCreate, canApprove, isOrgOwner])

  // Filter and prioritize results based on query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return allItems.filter(
        (item) =>
          item.category === "Quick Actions" || item.category === "Assignments"
      )
    }

    return allItems.filter((item) => {
      if (item.title.toLowerCase().includes(q)) return true
      if (item.subtitle?.toLowerCase().includes(q)) return true
      if (item.badge?.toLowerCase().includes(q)) return true
      if (item.keywords?.some((k) => k.toLowerCase().includes(q))) return true
      return false
    })
  }, [allItems, query])

  // Group items by category for rendering
  const groupedItems = useMemo(() => {
    const groups: {
      category: SearchItem["category"]
      items: SearchItem[]
    }[] = []

    const categoryOrder: SearchItem["category"][] = [
      "Quick Actions",
      "Classes",
      "Assignments",
      "Students",
    ]

    for (const cat of categoryOrder) {
      const inCat = filteredItems.filter((item) => item.category === cat)
      const capped = cat === "Students" ? inCat.slice(0, 10) : inCat
      if (capped.length > 0) {
        groups.push({ category: cat, items: capped })
      }
    }

    return groups
  }, [filteredItems])

  // Flattened array of visible items for keyboard navigation index
  const flatVisibleItems = useMemo(() => {
    return groupedItems.flatMap((g) => g.items)
  }, [groupedItems])

  // Scroll active item into view
  useEffect(() => {
    const el = itemRefs.current.get(activeIndex)
    if (el) {
      el.scrollIntoView({ block: "nearest" })
    }
  }, [activeIndex])

  const selectItem = (item: SearchItem) => {
    router.push(item.href)
    onClose()
  }

  // Handle keyboard navigation inside the modal
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault()
      onClose()
      return
    }

    if (flatVisibleItems.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % flatVisibleItems.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(
        (prev) => (prev - 1 + flatVisibleItems.length) % flatVisibleItems.length
      )
    } else if (e.key === "Enter") {
      e.preventDefault()
      const current = flatVisibleItems[activeIndex]
      if (current) selectItem(current)
    }
  }

  let globalIndexCounter = 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/35 p-4 pt-12 sm:pt-20 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="flex max-h-[82vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-100"
        onKeyDown={handleModalKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex h-14 shrink-0 items-center border-b border-border px-4">
          <SearchIcon className="size-4 shrink-0 text-ink-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            placeholder={
              isFaculty
                ? "Search students, assignments, classes, or actions..."
                : "Search assignments, subjects, or actions..."
            }
            className="w-full bg-transparent px-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("")
                setActiveIndex(0)
              }}
              className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-ink-faint hover:bg-canvas hover:text-ink"
              aria-label="Clear search"
            >
              ×
            </button>
          ) : null}
          <kbd className="hidden rounded border border-border bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-ink-faint sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2"
          tabIndex={-1}
        >
          {loadingData && (
            <div className="p-4 text-center text-xs text-ink-muted">
              Loading index...
            </div>
          )}

          {groupedItems.length === 0 && !loadingData ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-ink">
                No results found for &ldquo;{query}&rdquo;
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {isFaculty
                  ? "Try searching by student name, roll number, class, or assignment title."
                  : "Try searching by assignment title or subject name."}
              </p>
            </div>
          ) : (
            groupedItems.map((group) => (
              <div key={group.category} className="mb-3 last:mb-1">
                <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                  {group.category}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const currentIndex = globalIndexCounter++
                    const isSelected = currentIndex === activeIndex

                    return (
                      <button
                        key={item.id}
                        type="button"
                        ref={(el) => {
                          if (el) itemRefs.current.set(currentIndex, el)
                          else itemRefs.current.delete(currentIndex)
                        }}
                        onClick={() => selectItem(item)}
                        onMouseEnter={() => setActiveIndex(currentIndex)}
                        className={`group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                          isSelected
                            ? "bg-accent-soft text-accent"
                            : "text-ink hover:bg-canvas"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
                              isSelected
                                ? "bg-accent/10 text-accent"
                                : "bg-canvas text-ink-muted"
                            }`}
                          >
                            {item.category === "Quick Actions" && (
                              <BoltIcon className="size-3.5" />
                            )}
                            {item.category === "Classes" && (
                              <FolderIcon className="size-3.5" />
                            )}
                            {item.category === "Assignments" && (
                              <ClipboardIcon className="size-3.5" />
                            )}
                            {item.category === "Students" && (
                              <UsersIcon className="size-3.5" />
                            )}
                          </span>

                          <div className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {item.title}
                            </span>
                            {item.subtitle && (
                              <span
                                className={`block truncate text-xs ${
                                  isSelected
                                    ? "text-accent/80"
                                    : "text-ink-muted"
                                }`}
                              >
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {item.badge && (
                            <span className="rounded bg-canvas px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                              {item.badge}
                            </span>
                          )}
                          <span
                            className={`font-mono text-xs ${
                              isSelected ? "text-accent" : "text-ink-faint"
                            }`}
                          >
                            ↵
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer with Keyboard Navigation hints */}
        <div className="flex shrink-0 items-center justify-between border-t border-border bg-canvas/60 px-4 py-2.5 text-[11px] text-ink-faint">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd> to navigate
            </span>
            <span>·</span>
            <span>
              <kbd className="font-mono">↵</kbd> to select
            </span>
            <span>·</span>
            <span>
              <kbd className="font-mono">esc</kbd> to close
            </span>
          </div>
          <span className="hidden sm:inline">Tip: Type / anywhere to search</span>
        </div>
      </div>
    </div>
  )
}

export default function CommandPalette({
  open,
  onOpen,
  onClose,
}: {
  open: boolean
  onOpen: () => void
  onClose: () => void
}) {
  const { isFaculty } = useSessionUser()
  const [assignments, setAssignments] = useState<RawAssignment[]>([])
  const [roster, setRoster] = useState<RawRosterEntry[]>([])
  const [teams, setTeams] = useState<string[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  // Global keyboard shortcuts: Cmd+K / Ctrl+K and '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        if (open) {
          onClose()
        } else {
          onOpen()
        }
        return
      }

      // '/' shortcut (only when not typing in an input/textarea)
      if (e.key === "/" && !open) {
        const target = e.target as HTMLElement | null
        const isEditable =
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement ||
          target?.isContentEditable
        if (!isEditable) {
          e.preventDefault()
          onOpen()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpen, onClose])

  // Fetch index data once on first open
  useEffect(() => {
    if (!open || dataLoaded) return

    let cancelled = false
    async function loadIndex() {
      try {
        setLoadingData(true)
        const fetches: Promise<unknown>[] = [
          fetch("/api/assignments")
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
              if (!cancelled && Array.isArray(data)) setAssignments(data)
            }),
        ]

        if (isFaculty) {
          fetches.push(
            fetch("/api/roster")
              .then((r) => (r.ok ? r.json() : { roster: [] }))
              .then((data) => {
                if (!cancelled && Array.isArray(data?.roster)) setRoster(data.roster)
              }),
            fetch("/api/org/teams")
              .then((r) => (r.ok ? r.json() : { teams: [] }))
              .then((data) => {
                if (!cancelled && Array.isArray(data?.teams)) {
                  setTeams(
                    data.teams
                      .map((t: { name?: string }) => t.name || "")
                      .filter(Boolean)
                  )
                }
              })
          )
        }

        await Promise.all(fetches)
        if (!cancelled) {
          setDataLoaded(true)
          setLoadingData(false)
        }
      } catch {
        if (!cancelled) setLoadingData(false)
      }
    }

    void loadIndex()
    return () => {
      cancelled = true
    }
  }, [open, dataLoaded, isFaculty])

  if (!open) return null

  return (
    <CommandPaletteDialog
      onClose={onClose}
      assignments={assignments}
      roster={roster}
      teams={teams}
      loadingData={loadingData}
    />
  )
}
