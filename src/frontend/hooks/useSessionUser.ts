"use client"

import { useEffect, useState } from "react"
import { signOut, useSession } from "next-auth/react"

export type Role =
  | "owner"
  | "animator"
  | "subject-teacher"
  | "elective-teacher"
  | "student"
  | "unrostered"

export interface AccessInfo {
  username: string
  role: Role
  isFaculty: boolean
  isOrgOwner: boolean
  team: string | null
  classes: string[]
  capabilities: string[]
}

export interface SessionUserInfo extends AccessInfo {
  user: { name: string; image: string } | null
  loading: boolean
}

const GUEST: AccessInfo = {
  username: "",
  role: "unrostered",
  isFaculty: false,
  isOrgOwner: false,
  team: null,
  classes: [],
  capabilities: [],
}

interface AccessResponse {
  status: number
  access: AccessInfo
}

/**
 * Several components mount this hook at once (Navbar, the page, the faculty
 * shell). They share one in-flight request instead of racing three identical
 * fetches; the entry is cleared on settle so the next mount refetches.
 */
let inflight: { key: string; promise: Promise<AccessResponse> } | null = null

function requestAccess(key: string): Promise<AccessResponse> {
  if (inflight?.key === key) return inflight.promise

  const promise: Promise<AccessResponse> = fetch("/api/me")
    .then(async (res) => {
      const body = res.ok ? await res.json().catch(() => null) : null
      return {
        status: res.status,
        access: (body as AccessInfo | null) ?? GUEST,
      }
    })
    .catch(() => ({ status: 0, access: GUEST }))
    .finally(() => {
      if (inflight?.promise === promise) inflight = null
    })

  inflight = { key, promise }
  return promise
}

/**
 * Single source of truth for the caller's role and capabilities, backed by
 * GET /api/me. The server is authoritative; the client only renders from this.
 */
export function useSessionUser(): SessionUserInfo {
  const { data: session, status } = useSession()
  const [resolved, setResolved] = useState<AccessInfo | null>(null)

  const authenticated = status === "authenticated" && !!session
  const sessionKey = authenticated ? session.user?.name : null

  useEffect(() => {
    if (!sessionKey) return

    let cancelled = false

    requestAccess(sessionKey).then(({ status, access }) => {
      if (cancelled) return
      setResolved(access)

      // Auth.js still reports a session but the server rejects it: the cookie
      // predates the `login` claim or the signing secret changed. Clear it so
      // the user signs in again instead of seeing a permanent guest state.
      if (status === 401) void signOut({ redirect: false })
    })

    return () => {
      cancelled = true
    }
  }, [sessionKey])

  const access = authenticated && resolved ? resolved : GUEST

  return {
    ...access,
    user: session?.user
      ? { name: session.user.name || "", image: session.user.image || "" }
      : null,
    loading: status === "loading" || (authenticated && !resolved),
  }
}
