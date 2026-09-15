"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

export interface SessionUserInfo {
  user: { name: string; image: string } | null
  isFaculty: boolean
  team: string | null
  loading: boolean
}

interface TeacherProfile {
  role: string
}

interface RosterResponse {
  roster: { githubUsername?: string; classTeam: string }[]
  teams: string[]
}

export function useSessionUser(): SessionUserInfo {
  const { data: session, status } = useSession()
  const [isFaculty, setIsFaculty] = useState(false)
  const [team, setTeam] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (status === "loading" || !session) return

    let cancelled = false

    Promise.all([
      fetch("/api/org/owners")
        .then((res) => (res.ok ? res.json() : { owners: [] }))
        .catch(() => ({ owners: [] })),
      fetch("/api/teachers")
        .then((res) => (res.ok ? res.json() : { profile: null }))
        .catch(() => ({ profile: null })),
      fetch("/api/roster")
        .then((res) => (res.ok ? res.json() : { roster: [], teams: [] }))
        .catch(() => ({ roster: [], teams: [] })),
    ]).then(([ownersData, teacherData, rosterData]: [
      { owners: string[] },
      { profile: TeacherProfile | null },
      RosterResponse
    ]) => {
      if (cancelled) return

      const username = session.user?.name
      const ownerList = Array.isArray(ownersData.owners) ? ownersData.owners : []
      const isOwner = username ? ownerList.includes(username) : false
      const teacher = teacherData.profile as TeacherProfile | null
      const teacherRole =
        teacher?.role === "animator" ||
        teacher?.role === "subject-teacher" ||
        teacher?.role === "elective-teacher"

      setIsFaculty(isOwner || teacherRole)

      const rosterList = Array.isArray(rosterData.roster) ? rosterData.roster : []
      const entry = rosterList.find((r) => r.githubUsername === username)
      setTeam(entry?.classTeam ?? null)
      setReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [session, status])

  return {
    user: session?.user
      ? { name: session.user.name || "", image: session.user.image || "" }
      : null,
    isFaculty,
    team,
    loading: status === "loading" || (session ? !ready : false),
  }
}