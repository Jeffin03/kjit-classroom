"use client"

import Link from "next/link"
import FacultyPageHeader from "./FacultyPageHeader"
import CreateSubjectModal from "./CreateSubjectModal"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import Button from "@/frontend/components/Button"
import Avatar from "@/frontend/components/Avatar"
import KpiCard from "@/frontend/components/KpiCard"
import RoleBadge from "@/frontend/components/RoleBadge"
import {
  UsersIcon,
  ClipboardIcon,
  CheckCircleIcon,
  SearchIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  StarFilledIcon,
  BookOpenIcon,
} from "@/frontend/components/Icons"
import type { Assignment, TeacherProfile } from "@/backend/types"

interface TeacherRequest extends TeacherProfile {
  requestedAt: string
}

type GrantableRole = "animator" | "subject-teacher" | "elective-teacher"

const ROLE_LABELS: Record<string, string> = {
  animator: "Class Animator",
  "subject-teacher": "Subject Teacher",
  "elective-teacher": "Elective Teacher",
  owner: "Organization Owner",
}

const GRANTABLE_ROLES: GrantableRole[] = [
  "animator",
  "subject-teacher",
  "elective-teacher",
]

export default function FacultyRequests() {
  const { status } = useSession()
  const router = useRouter()

  const [requests, setRequests] = useState<TeacherRequest[]>([])
  const [teachers, setTeachers] = useState<TeacherProfile[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, GrantableRole>>({})
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null)

  // Tabs: "teachers" (default) | "classes" | "requests"
  const [activeTab, setActiveTab] = useState<"teachers" | "classes" | "requests">("teachers")

  // Filters for "teachers" view
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterClass, setFilterClass] = useState("all")

  // Add Faculty Modal state
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [facultyMembers, setFacultyMembers] = useState<
    Array<{ login: string; name?: string | null; email?: string | null; avatar?: string | null }>
  >([])
  const [newUsername, setNewUsername] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<GrantableRole>("subject-teacher")
  const [newClasses, setNewClasses] = useState<string[]>([])
  const [addingFaculty, setAddingFaculty] = useState(false)

  // Edit Faculty Modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null)
  const [editRole, setEditRole] = useState<GrantableRole>("subject-teacher")
  const [editClasses, setEditClasses] = useState<string[]>([])

  // Create Class Modal state
  const [createClassModalOpen, setCreateClassModalOpen] = useState(false)
  const [newClassName, setNewClassName] = useState("")
  const [newClassDesc, setNewClassDesc] = useState("")
  const [newClassAnimator, setNewClassAnimator] = useState("")
  const [creatingClass, setCreatingClass] = useState(false)

  // Create Subject Modal state
  const [createSubjectModalOpen, setCreateSubjectModalOpen] = useState(false)
  const [subjectInitialClass, setSubjectInitialClass] = useState<string | undefined>(undefined)

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!addModalOpen) return
    let cancelled = false
    async function loadFaculty() {
      try {
        const res = await fetch("/api/org/faculty-members")
        const data = await res.json().catch(() => ({ members: [] }))
        if (cancelled) return
        setFacultyMembers(data.members || [])
      } catch {
        /* ignore */
      }
    }
    loadFaculty()
    return () => {
      cancelled = true
    }
  }, [addModalOpen])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [reqRes, teamsRes, assignRes] = await Promise.all([
          fetch("/api/requests"),
          fetch("/api/org/teams"),
          fetch("/api/assignments"),
        ])
        const data = await reqRes.json().catch(() => ({}))
        const teamsData = await teamsRes.json().catch(() => ({}))
        const assignData = await assignRes.json().catch(() => [])

        if (cancelled) return

        if (reqRes.ok) {
          setRequests(data.requests || [])
          setTeachers(data.teachers || [])
        } else {
          setLoadError(
            reqRes.status === 403
              ? "Only org owners can manage faculty access."
              : data.error || "Failed to load faculty roster."
          )
        }

        if (teamsRes.ok && Array.isArray(teamsData.teams)) {
          setAvailableTeams(
            teamsData.teams
              .map((t: { name?: string }) => t.name || "")
              .filter(Boolean)
          )
        }

        if (Array.isArray(assignData)) {
          setAssignments(assignData)
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const refetch = () => setRefreshKey((k) => k + 1)

  // Map subjects created by teacher: username.toLowerCase() -> Assignment[]
  const subjectsByTeacher = useMemo(() => {
    const map = new Map<string, Assignment[]>()
    assignments.forEach((a) => {
      if (a.createdBy) {
        const key = a.createdBy.toLowerCase()
        const list = map.get(key) || []
        list.push(a)
        map.set(key, list)
      }
    })
    return map
  }, [assignments])

  // Map assignments by class team: teamName -> Assignment[]
  const assignmentsByClass = useMemo(() => {
    const map = new Map<string, Assignment[]>()
    assignments.forEach((a) => {
      (a.assignedTeams || []).forEach((team) => {
        const list = map.get(team) || []
        list.push(a)
        map.set(team, list)
      })
    })
    return map
  }, [assignments])

  // Teachers filtered for "teachers" view
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      if (filterRole !== "all" && t.role !== filterRole) return false
      if (
        filterClass !== "all" &&
        !(t.classes || []).includes(filterClass) &&
        t.role !== "animator"
      ) {
        return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesName = t.displayName?.toLowerCase().includes(q)
        const matchesUser = t.githubUsername.toLowerCase().includes(q)
        const matchesEmail = t.email?.toLowerCase().includes(q)
        const matchesClass = (t.classes || []).some((c) =>
          c.toLowerCase().includes(q)
        )
        return matchesName || matchesUser || matchesEmail || matchesClass
      }
      return true
    })
  }, [teachers, filterRole, filterClass, search])

  // KPI stats
  const stats = useMemo(() => {
    const animatorsCount = teachers.filter((t) => t.role === "animator").length
    const subjectTeachersCount = teachers.filter(
      (t) => t.role === "subject-teacher" || t.role === "elective-teacher"
    ).length
    return {
      totalFaculty: teachers.length,
      animators: animatorsCount,
      subjectTeachers: subjectTeachersCount,
      classes: availableTeams.length,
      pending: requests.length,
    }
  }, [teachers, availableTeams.length, requests.length])

  // Handlers
  const handleAction = async (
    githubUsername: string,
    action: "approve" | "deny"
  ) => {
    setProcessing(githubUsername)
    setMessage(null)
    try {
      const res = await fetch("/api/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUsername,
          action,
          ...(action === "approve"
            ? { role: selectedRoles[githubUsername] ?? "animator" }
            : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setMessage({ tone: "error", text: data.error || "Request failed" })
        return
      }

      if (data.warnings?.length) {
        setMessage({
          tone: "error",
          text: `Approved, but some team grants failed: ${data.warnings.join("; ")}`,
        })
      } else if (action === "approve") {
        setMessage({
          tone: "success",
          text: `@${githubUsername} approved as ${ROLE_LABELS[(data.role as GrantableRole) ?? "animator"]}.`,
        })
      }

      setRequests((prev) => prev.filter((r) => r.githubUsername !== githubUsername))
      if (action === "deny") {
        setMessage({
          tone: "success",
          text: `Denied @${githubUsername}.`,
        })
      }
      refetch()
    } catch {
      setMessage({ tone: "error", text: "Network error" })
    } finally {
      setProcessing(null)
    }
  }

  const handleRemoveTeacher = async (githubUsername: string) => {
    if (
      !confirm(
        `Are you sure you want to remove @${githubUsername} from faculty?`
      )
    ) {
      return
    }
    setProcessing(githubUsername)
    setMessage(null)
    try {
      const res = await fetch(
        `/api/requests?username=${encodeURIComponent(githubUsername)}`,
        { method: "DELETE" }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({
          tone: "error",
          text: data.error || "Failed to remove teacher",
        })
        return
      }
      const warningText = data.warnings?.length
        ? ` ${data.warnings.join("; ")}`
        : ""
      const removedFromClassTeams: string[] = data.removedFromClassTeams ?? []
      setMessage({
        tone: data.stillInFacultyTeam ? "error" : "success",
        text:
          (data.message || `@${githubUsername} removed from faculty.`) +
          warningText +
          (removedFromClassTeams.length > 0
            ? ` Removed from class teams: ${removedFromClassTeams.join(", ")}.`
            : ""),
      })
      refetch()
    } catch {
      setMessage({ tone: "error", text: "Network error" })
    } finally {
      setProcessing(null)
    }
  }

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUsername.trim()) return

    setAddingFaculty(true)
    setMessage(null)
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUsername: newUsername.trim(),
          email: newEmail.trim(),
          role: newRole,
          classes: newClasses,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({
          tone: "error",
          text: data.error || "Failed to add faculty member",
        })
        return
      }

      const warnings: string[] = data.warnings ?? []
      setMessage(
        warnings.length > 0
          ? {
              tone: "error",
              text: `@${newUsername} added as ${ROLE_LABELS[newRole]}, but: ${warnings.join("; ")}`,
            }
          : {
              tone: "success",
              text: `@${newUsername} added as ${ROLE_LABELS[newRole]}.`,
            }
      )
      setAddModalOpen(false)
      setNewUsername("")
      setNewEmail("")
      setNewClasses([])
      refetch()
    } catch {
      setMessage({ tone: "error", text: "Network error" })
    } finally {
      setAddingFaculty(false)
    }
  }

  const openEditModal = (teacher: TeacherProfile) => {
    setEditingTeacher(teacher)
    setEditRole(
      (teacher.role === "animator" ||
      teacher.role === "subject-teacher" ||
      teacher.role === "elective-teacher"
        ? teacher.role
        : "subject-teacher") as GrantableRole
    )
    setEditClasses([...(teacher.classes || [])])
    setEditModalOpen(true)
  }

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTeacher) return

    setProcessing(editingTeacher.githubUsername)
    setMessage(null)
    try {
      const res = await fetch("/api/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUsername: editingTeacher.githubUsername,
          role: editRole,
          classes: editClasses,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({
          tone: "error",
          text: data.error || "Failed to update faculty member",
        })
        return
      }

      const warnings: string[] = data.warnings ?? []
      setMessage(
        warnings.length > 0
          ? {
              tone: "error",
              text: `@${editingTeacher.githubUsername} updated, but: ${warnings.join("; ")}`,
            }
          : {
              tone: "success",
              text: `Updated @${editingTeacher.githubUsername} (${ROLE_LABELS[editRole]}).`,
            }
      )
      setEditModalOpen(false)
      setEditingTeacher(null)
      refetch()
    } catch {
      setMessage({ tone: "error", text: "Network error" })
    } finally {
      setProcessing(null)
    }
  }

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClassName.trim()) return

    setCreatingClass(true)
    setMessage(null)
    try {
      const res = await fetch("/api/org/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClassName.trim(),
          description: newClassDesc.trim(),
          animatorUsername: newClassAnimator || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({
          tone: "error",
          text: data.error || "Failed to create class cohort",
        })
        return
      }

      setMessage({
        tone: "success",
        text: `Class cohort "${newClassName.trim()}" created successfully!${
          newClassAnimator ? ` Assigned @${newClassAnimator} as Animator.` : ""
        }`,
      })
      setCreateClassModalOpen(false)
      setNewClassName("")
      setNewClassDesc("")
      setNewClassAnimator("")
      refetch()
    } catch {
      setMessage({ tone: "error", text: "Network error" })
    } finally {
      setCreatingClass(false)
    }
  }

  const toggleNewClass = (cls: string) => {
    setNewClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    )
  }

  const toggleEditClass = (cls: string) => {
    setEditClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    )
  }

  if (status === "loading" || loading) {
    return (
      <div className="max-w-6xl space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-border)] rounded w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-[var(--color-border)] rounded-xl" />
            ))}
          </div>
          <div className="space-y-3 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-[var(--color-border)] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-6xl space-y-8">
        <FacultyPageHeader
          title="Faculty & Class Staffing"
          subtitle="Manage teachers, assign class animators, and oversee subject teaching across cohorts"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCreateClassModalOpen(true)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-canvas transition-colors shadow-xs"
              >
                <span>+ Create Class Cohort</span>
              </button>
              <button
                type="button"
                onClick={() => setCreateSubjectModalOpen(true)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-canvas transition-colors shadow-xs"
              >
                <span>+ Create Subject</span>
              </button>
              <Button onClick={() => setAddModalOpen(true)}>
                + Add Faculty Member
              </Button>
            </div>
          }
        />

        {message && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              message.tone === "error"
                ? "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                : "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]"
            }`}
          >
            <p className="font-medium break-words">{message.text}</p>
          </div>
        )}

        {loadError ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-surface p-12 text-center">
            <h2 className="text-lg font-semibold text-ink mb-1">
              Access Management Unavailable
            </h2>
            <p className="text-sm text-ink-muted">{loadError}</p>
          </div>
        ) : (
          <>
            {/* KPI STATS BAR */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <KpiCard
                label="Total Faculty"
                value={stats.totalFaculty}
                hint="active teachers"
                icon={<UsersIcon className="size-4" />}
                onClick={() => {
                  setActiveTab("teachers")
                  setFilterRole("all")
                  setFilterClass("all")
                }}
              />
              <KpiCard
                label="Class Animators"
                value={stats.animators}
                hint="cohort coordinators"
                tone="accent"
                icon={<StarFilledIcon className="size-4 text-amber-600" />}
                onClick={() => {
                  setActiveTab("teachers")
                  setFilterRole("animator")
                }}
              />
              <KpiCard
                label="Subject Teachers"
                value={stats.subjectTeachers}
                hint="lab & subject faculty"
                icon={<BookOpenIcon className="size-4 text-blue-600" />}
                onClick={() => {
                  setActiveTab("teachers")
                  setFilterRole("subject-teacher")
                }}
              />
              <KpiCard
                label="Class Cohorts"
                value={stats.classes}
                hint="active class teams"
                icon={<ClipboardIcon className="size-4" />}
                onClick={() => setActiveTab("classes")}
              />
              <KpiCard
                label="Pending Requests"
                value={stats.pending}
                hint={stats.pending > 0 ? "needs review" : "up to date"}
                tone={stats.pending > 0 ? "caution" : undefined}
                icon={<CheckCircleIcon className="size-4" />}
                onClick={() => setActiveTab("requests")}
              />
            </div>

            {/* VIEW SWITCHER TABS */}
            <div className="flex border-b border-border">
              <button
                type="button"
                onClick={() => setActiveTab("teachers")}
                className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "teachers"
                    ? "border-accent text-accent"
                    : "border-transparent text-ink-muted hover:border-border hover:text-ink"
                }`}
              >
                <span>By Faculty Member</span>
                <span className="rounded-full bg-canvas px-2 py-0.5 text-xs text-ink-muted font-normal">
                  {teachers.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("classes")}
                className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "classes"
                    ? "border-accent text-accent"
                    : "border-transparent text-ink-muted hover:border-border hover:text-ink"
                }`}
              >
                <span>By Class Cohort</span>
                <span className="rounded-full bg-canvas px-2 py-0.5 text-xs text-ink-muted font-normal">
                  {availableTeams.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("requests")}
                className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "requests"
                    ? "border-accent text-accent"
                    : "border-transparent text-ink-muted hover:border-border hover:text-ink"
                }`}
              >
                <span>Pending Approvals</span>
                {requests.length > 0 && (
                  <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold">
                    {requests.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: BY FACULTY MEMBER */}
            {activeTab === "teachers" && (
              <div className="space-y-6">
                {/* Search & Filter Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[240px]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-faint" />
                    <input
                      type="text"
                      placeholder="Search faculty by name, @username, email, or class..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent-soft focus:outline-hidden"
                    />
                  </div>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    aria-label="Filter by role"
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent-soft"
                  >
                    <option value="all">All Teaching Roles</option>
                    <option value="animator">Class Animators</option>
                    <option value="subject-teacher">Subject Teachers</option>
                    <option value="elective-teacher">Elective Teachers</option>
                  </select>
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    aria-label="Filter by class"
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent-soft"
                  >
                    <option value="all">All Classes</option>
                    {availableTeams.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {filteredTeachers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-ink-muted">
                    No faculty members match these filters.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTeachers.map((teacher) => {
                      // Subjects created by this teacher, plus any subject
                      // assigned to a class they are responsible for (e.g. an
                      // animator of MCA B 25-26 should see subjects created in
                      // that class even if another teacher created them).
                      const ownSubjects =
                        subjectsByTeacher.get(
                          teacher.githubUsername.toLowerCase()
                        ) || []
                      const classSubjects = (teacher.classes || []).flatMap(
                        (cls) => assignmentsByClass.get(cls) || []
                      )
                      const createdSubjects = Array.from(
                        new Map(
                          [...ownSubjects, ...classSubjects].map((a) => [a.id, a])
                        ).values()
                      )
                      const isAnimator = teacher.role === "animator"

                      return (
                        <div
                          key={teacher.githubUsername}
                          className="rounded-2xl border border-border bg-surface p-6 shadow-xs transition-shadow hover:shadow-md"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            {/* Teacher Profile Head */}
                            <div className="flex items-start gap-4">
                              <Avatar
                                name={
                                  teacher.displayName || teacher.githubUsername
                                }
                                size="md"
                              />
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link
                                    href={`/profile?username=${encodeURIComponent(
                                      teacher.githubUsername
                                    )}`}
                                    className="text-base font-bold text-ink hover:text-accent hover:underline"
                                  >
                                    {teacher.displayName ||
                                      teacher.githubUsername}
                                  </Link>
                                  <Link
                                    href={`/profile?username=${encodeURIComponent(
                                      teacher.githubUsername
                                    )}`}
                                    className="font-mono text-xs text-ink-muted hover:text-accent hover:underline"
                                  >
                                    @{teacher.githubUsername}
                                  </Link>
                                  <RoleBadge role={teacher.role} />
                                </div>
                                <div className="text-xs text-ink-muted mt-0.5">
                                  {teacher.email || "No email on record"}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(teacher)}
                                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-canvas transition-colors"
                              >
                                Edit Role & Classes
                              </button>
                              <Link
                                href={`/profile?username=${encodeURIComponent(
                                  teacher.githubUsername
                                )}`}
                                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
                              >
                                View Profile →
                              </Link>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveTeacher(teacher.githubUsername)
                                }
                                disabled={processing === teacher.githubUsername}
                                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger-soft transition-colors disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          {/* Class & Subject Breakdown */}
                          <div className="mt-5 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Classes & Animatorship */}
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-2">
                                Assigned Classes & Animatorship
                              </div>
                              {teacher.classes?.length ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  {teacher.classes.map((cls) => (
                                    <span
                                      key={cls}
                                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                                        isAnimator
                                          ? "bg-amber-50 text-amber-900 border border-amber-200"
                                          : "bg-canvas text-ink border border-border"
                                      }`}
                                    >
                                      {isAnimator && (
                                        <span
                                          title="Class Animator"
                                          className="text-amber-700 font-semibold inline-flex items-center gap-1"
                                        >
                                          <StarFilledIcon className="size-3 text-amber-600" />
                                          Animator:
                                        </span>
                                      )}
                                      <Link
                                        href={`/faculty/class/${encodeURIComponent(
                                          cls
                                        )}`}
                                        className="hover:underline"
                                      >
                                        {cls}
                                      </Link>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-ink-faint inline-flex items-center gap-1">
                                  {isAnimator && (
                                    <StarFilledIcon className="size-3 text-amber-600 inline" />
                                  )}
                                  {isAnimator
                                    ? "Animator for all classes (unrestricted institute-wide access)"
                                    : "No classes assigned yet"}
                                </span>
                              )}
                            </div>

                            {/* Subjects Created / Taught */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                                  Subjects Created ({createdSubjects.length})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubjectInitialClass(
                                      teacher.classes?.[0]
                                    )
                                    setCreateSubjectModalOpen(true)
                                  }}
                                  className="text-xs font-medium text-accent hover:underline"
                                >
                                  + Create Subject
                                </button>
                              </div>
                              {createdSubjects.length > 0 ? (
                                <div className="space-y-1.5">
                                  {createdSubjects.map((subject) => (
                                    <div
                                      key={subject.id}
                                      className="flex items-center justify-between text-xs rounded-md bg-canvas px-2.5 py-1.5 border border-border"
                                    >
                                      <div className="font-medium text-ink truncate mr-2">
                                        <span className="text-ink-muted mr-1.5">
                                          [{subject.subject}]
                                        </span>
                                        {subject.title}
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {(subject.assignedTeams || []).map(
                                          (team) => (
                                            <span
                                              key={team}
                                              className="rounded bg-accent-soft text-accent px-1.5 py-0.5 text-[10px] font-semibold"
                                            >
                                              {team}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-ink-faint italic">
                                  No PBL subjects created by this teacher yet.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: BY CLASS COHORT */}
            {activeTab === "classes" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-ink">
                      Cohort Staffing Matrix
                    </h2>
                    <p className="text-xs text-ink-muted">
                      Shows which teachers are animators and subject teachers
                      for each active cohort
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCreateClassModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                  >
                    + Create New Class
                  </button>
                </div>

                {availableTeams.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-ink-muted">
                    No classes found. Click &quot;Create Class Cohort&quot; to
                    add one.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {availableTeams.map((teamName) => {
                      const classAssignments =
                        assignmentsByClass.get(teamName) || []
                      const classTeachers = teachers.filter(
                        (t) =>
                          (t.classes || []).includes(teamName) ||
                          (t.role === "animator" &&
                            (!t.classes || t.classes.length === 0))
                      )
                      const classAnimators = classTeachers.filter(
                        (t) => t.role === "animator"
                      )
                      const classSubjectTeachers = classTeachers.filter(
                        (t) => t.role === "subject-teacher"
                      )
                      const classElectiveTeachers = classTeachers.filter(
                        (t) => t.role === "elective-teacher"
                      )

                      return (
                        <div
                          key={teamName}
                          className="rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between"
                        >
                          <div>
                            {/* Class Card Header */}
                            <div className="flex items-start justify-between gap-2 border-b border-border pb-4">
                              <div>
                                <h3 className="text-lg font-bold text-ink">
                                  {teamName}
                                </h3>
                                <p className="text-xs text-ink-muted">
                                  {classAssignments.length} active subject
                                  {classAssignments.length === 1 ? "" : "s"} ·{" "}
                                  {classTeachers.length} staff member
                                  {classTeachers.length === 1 ? "" : "s"}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Link
                                  href={`/faculty/roster?class=${encodeURIComponent(
                                    teamName
                                  )}`}
                                  className="rounded px-2 py-1 text-xs font-semibold text-accent hover:underline"
                                >
                                  Student Roster →
                                </Link>
                              </div>
                            </div>

                            {/* Section: Class Animator */}
                            <div className="mt-4">
                              <div className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-2">
                                Class Animator (Coordinator)
                              </div>
                              {classAnimators.length > 0 ? (
                                <div className="space-y-2">
                                  {classAnimators.map((animator) => (
                                    <div
                                      key={animator.githubUsername}
                                      className="flex items-center justify-between rounded-lg bg-amber-50/70 border border-amber-200 p-2.5"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <Avatar
                                          name={
                                            animator.displayName ||
                                            animator.githubUsername
                                          }
                                          size="sm"
                                        />
                                        <div>
                                          <Link
                                            href={`/profile?username=${encodeURIComponent(
                                              animator.githubUsername
                                            )}`}
                                            className="text-xs font-bold text-amber-950 hover:underline"
                                          >
                                            {animator.displayName ||
                                              animator.githubUsername}
                                          </Link>
                                          <div className="text-[11px] text-amber-800 font-mono">
                                            @{animator.githubUsername}
                                          </div>
                                        </div>
                                      </div>
                                      <RoleBadge role="animator" label="Animator" size="xs" />
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
                                  <span className="inline-flex items-center gap-1.5">
                                    <AlertCircleIcon className="size-3.5 text-amber-700" />
                                    No Class Animator assigned
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setAddModalOpen(true)}
                                    className="font-bold underline text-amber-950 hover:text-accent"
                                  >
                                    Assign Animator
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Section: Subject Teachers */}
                            <div className="mt-4">
                              <div className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-2">
                                Subject Teachers (
                                {classSubjectTeachers.length +
                                  classElectiveTeachers.length}
                                )
                              </div>
                              {classSubjectTeachers.length > 0 ||
                              classElectiveTeachers.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    ...classSubjectTeachers,
                                    ...classElectiveTeachers,
                                  ].map((st) => (
                                    <span
                                      key={st.githubUsername}
                                      className="inline-flex items-center gap-1.5 rounded-full bg-canvas border border-border px-2.5 py-1 text-xs text-ink"
                                    >
                                      <Avatar
                                        name={
                                          st.displayName || st.githubUsername
                                        }
                                        size="sm"
                                      />
                                      <Link
                                        href={`/profile?username=${encodeURIComponent(
                                          st.githubUsername
                                        )}`}
                                        className="font-medium hover:underline"
                                      >
                                        {st.displayName || st.githubUsername}
                                      </Link>
                                      <RoleBadge role={st.role} size="xs" />
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-ink-faint">
                                  No subject teachers assigned yet.
                                </span>
                              )}
                            </div>

                            {/* Section: Subjects / PBL Assignments */}
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                                  PBL Subjects ({classAssignments.length})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubjectInitialClass(teamName)
                                    setCreateSubjectModalOpen(true)
                                  }}
                                  className="text-xs font-medium text-accent hover:underline"
                                >
                                  + Add Subject
                                </button>
                              </div>
                              {classAssignments.length > 0 ? (
                                <div className="space-y-1.5">
                                  {classAssignments.map((a) => (
                                    <div
                                      key={a.id}
                                      className="flex items-center justify-between rounded-md bg-canvas px-2.5 py-1.5 text-xs border border-border"
                                    >
                                      <span className="font-medium text-ink truncate mr-2">
                                        <span className="text-ink-muted mr-1">
                                          [{a.subject}]
                                        </span>
                                        {a.title}
                                      </span>
                                      <span className="text-[11px] text-ink-muted shrink-0">
                                        by @{a.createdBy}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-ink-faint italic">
                                  No subjects created for this class yet.
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Class Card Footer Actions */}
                          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                            <Link
                              href={`/faculty/class/${encodeURIComponent(
                                teamName
                              )}`}
                              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                            >
                              <span>Class Dashboard</span>
                              <ChevronRightIcon className="size-3" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setSubjectInitialClass(teamName)
                                setCreateSubjectModalOpen(true)
                              }}
                              className="text-xs font-medium text-ink-muted hover:text-accent hover:underline"
                            >
                              + New Subject
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PENDING REQUESTS */}
            {activeTab === "requests" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-ink">
                    Pending Teacher Requests ({requests.length})
                  </h2>
                </div>

                {requests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-ink-muted">
                    No pending access requests. All faculty applications have
                    been reviewed.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div
                        key={request.githubUsername}
                        className="rounded-2xl border border-border bg-surface p-6 shadow-xs"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <Avatar
                              name={
                                request.displayName || request.githubUsername
                              }
                              size="md"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/profile?username=${encodeURIComponent(
                                    request.githubUsername
                                  )}`}
                                  className="font-bold text-ink hover:text-accent hover:underline"
                                >
                                  {request.displayName ||
                                    request.githubUsername}
                                </Link>
                                <Link
                                  href={`/profile?username=${encodeURIComponent(
                                    request.githubUsername
                                  )}`}
                                  className="font-mono text-xs text-ink-muted hover:text-accent hover:underline"
                                >
                                  @{request.githubUsername}
                                </Link>
                              </div>
                              <div className="text-xs text-ink-muted">
                                {request.email || "No email"}
                              </div>
                              <div className="text-xs text-ink-faint mt-1">
                                Applied on{" "}
                                {new Date(
                                  request.requestedAt
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <label className="text-xs text-ink-muted">
                              Grant Role
                              <select
                                value={
                                  selectedRoles[request.githubUsername] ??
                                  "animator"
                                }
                                onChange={(e) =>
                                  setSelectedRoles((prev) => ({
                                    ...prev,
                                    [request.githubUsername]: e.target
                                      .value as GrantableRole,
                                  }))
                                }
                                disabled={processing === request.githubUsername}
                                className="mt-1 block rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-accent focus:ring-1 focus:ring-accent"
                              >
                                {GRANTABLE_ROLES.map((r) => (
                                  <option key={r} value={r}>
                                    {ROLE_LABELS[r]}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleAction(
                                    request.githubUsername,
                                    "approve"
                                  )
                                }
                                disabled={processing === request.githubUsername}
                                className="bg-accent text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
                              >
                                {processing === request.githubUsername
                                  ? "..."
                                  : "Approve"}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleAction(request.githubUsername, "deny")
                                }
                                disabled={processing === request.githubUsername}
                                className="bg-surface border border-border text-ink-muted px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-canvas transition-colors disabled:opacity-50"
                              >
                                Deny
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border">
                          <div className="text-xs text-ink-muted mb-1.5 font-medium">
                            Requested Classes:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(request.classes || []).map((className) => (
                              <span
                                key={className}
                                className="inline-flex items-center rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent"
                              >
                                {className}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL 1: CREATE CLASS COHORT */}
      {createClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-ink">Create Class Cohort</h3>
            <p className="text-xs text-ink-muted mt-1">
              Creates a new closed GitHub team for the cohort and registers it
              across KJIT Classroom.
            </p>

            <form onSubmit={handleCreateClass} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Class Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. MCA C 25-26, BTech CS 2026"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent-soft"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2025–2026 MCA Section C"
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent-soft"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Class Animator (Coordinator)
                </label>
                <select
                  value={newClassAnimator}
                  onChange={(e) => setNewClassAnimator(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent-soft"
                >
                  <option value="">None / Assign Later</option>
                  {teachers.map((t) => (
                    <option key={t.githubUsername} value={t.githubUsername}>
                      {t.displayName || t.githubUsername} (@{t.githubUsername})
                      {t.role === "animator" ? " [Animator]" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-ink-muted mt-1">
                  The selected teacher will automatically be promoted to
                  Maintainer on GitHub and designated as the Class Animator.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCreateClassModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-ink-muted hover:bg-canvas"
                >
                  Cancel
                </button>
                <Button type="submit" disabled={creatingClass}>
                  {creatingClass ? "Creating..." : "Create Class Cohort"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT FACULTY MEMBER */}
      {editModalOpen && editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-ink">
              Edit Faculty Member: @{editingTeacher.githubUsername}
            </h3>
            <p className="text-xs text-ink-muted mt-1">
              Update teaching role and assigned class scopes for{" "}
              {editingTeacher.displayName || `@${editingTeacher.githubUsername}`}
              .
            </p>

            <form onSubmit={handleUpdateTeacher} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Teaching Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as GrantableRole)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent-soft"
                >
                  <option value="animator">
                    Class Animator (Class Coordinator)
                  </option>
                  <option value="subject-teacher">
                    Subject Teacher (Lab & PBL Teacher)
                  </option>
                  <option value="elective-teacher">
                    Elective Teacher
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Assigned Class Cohorts
                </label>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border p-3 space-y-2 bg-canvas">
                  {availableTeams.map((cls) => (
                    <label
                      key={cls}
                      className="flex items-center gap-2 text-xs text-ink cursor-pointer hover:text-accent"
                    >
                      <input
                        type="checkbox"
                        checked={editClasses.includes(cls)}
                        onChange={() => toggleEditClass(cls)}
                        className="rounded border-border text-accent focus:ring-accent"
                      />
                      <span>{cls}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[11px] text-ink-muted mt-1">
                  Animators assigned to specific classes become maintainers of
                  those class cohorts.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false)
                    setEditingTeacher(null)
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-ink-muted hover:bg-canvas"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={processing === editingTeacher.githubUsername}
                >
                  {processing === editingTeacher.githubUsername
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD FACULTY MEMBER */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-ink">Add Faculty Member</h3>
            <p className="text-xs text-ink-muted mt-1">
              Enroll an onboarded GitHub user as a faculty member and assign
              their teaching classes.
            </p>

            <form onSubmit={handleAddFaculty} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  GitHub Username <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. prof-smith or @prof-smith"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent-soft"
                  required
                />
                {facultyMembers.length > 0 && (
                  <div className="mt-2">
                    <span className="text-[11px] text-ink-muted">
                      Quick select from org faculty team:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto">
                      {facultyMembers.map((m) => (
                        <button
                          key={m.login}
                          type="button"
                          onClick={() => {
                            setNewUsername(m.login)
                            if (m.email) setNewEmail(m.email)
                          }}
                          className="rounded bg-canvas border border-border px-2 py-0.5 text-[11px] text-ink hover:border-accent hover:text-accent"
                        >
                          @{m.login}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  College Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. teacher@kjit.ac.in"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent-soft"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as GrantableRole)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:ring-2 focus:ring-accent-soft"
                >
                  <option value="animator">
                    Class Animator (Class Coordinator)
                  </option>
                  <option value="subject-teacher">
                    Subject Teacher (Lab & PBL Teacher)
                  </option>
                  <option value="elective-teacher">
                    Elective Teacher
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Classes Taught
                </label>
                <div className="max-h-36 overflow-y-auto rounded-lg border border-border p-3 space-y-2 bg-canvas">
                  {availableTeams.map((cls) => (
                    <label
                      key={cls}
                      className="flex items-center gap-2 text-xs text-ink cursor-pointer hover:text-accent"
                    >
                      <input
                        type="checkbox"
                        checked={newClasses.includes(cls)}
                        onChange={() => toggleNewClass(cls)}
                        className="rounded border-border text-accent focus:ring-accent"
                      />
                      <span>{cls}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-ink-muted hover:bg-canvas"
                >
                  Cancel
                </button>
                <Button type="submit" disabled={addingFaculty}>
                  {addingFaculty ? "Adding..." : "Add Faculty Member"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE SUBJECT */}
      {createSubjectModalOpen && (
        <CreateSubjectModal
          open={createSubjectModalOpen}
          onClose={() => setCreateSubjectModalOpen(false)}
          onSuccess={() => {
            setCreateSubjectModalOpen(false)
            setRefreshKey((k) => k + 1)
          }}
          initialClass={subjectInitialClass}
        />
      )}
    </>
  )
}
