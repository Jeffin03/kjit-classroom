import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { getToken } from "next-auth/jwt"
import { getOrgToken } from "../github/client"
import { getOrgOwners } from "../github/org"
import { getTeacherByGithubUsername } from "../store/teachers"
import { getRosterByGithubUsername } from "../store/roster"
import { getAssignment } from "../store/assignments"
import type { Assignment } from "../types"

export type Role =
  | "owner"
  | "animator"
  | "subject-teacher"
  | "elective-teacher"
  | "student"
  | "unrostered"

export type Capability =
  | "assignment.read"
  | "assignment.create"
  | "assignment.readStats"
  | "roster.read"
  | "roster.write"
  | "submission.readOwn"
  | "submission.readAll"
  | "submission.create"
  | "submission.review"
  | "submission.accept"
  | "submission.commitOverride"
  | "teacher.request"
  | "teacher.approve"
  | "team.read"
  | "repo.read"

const OWNER: readonly Capability[] = [
  "assignment.read",
  "assignment.create",
  "assignment.readStats",
  "roster.read",
  "roster.write",
  "submission.readOwn",
  "submission.readAll",
  "submission.create",
  "submission.review",
  "submission.accept",
  "submission.commitOverride",
  "teacher.request",
  "teacher.approve",
  "team.read",
  "repo.read",
]

const ANIMATOR: readonly Capability[] = OWNER.filter(
  (c) => c !== "teacher.approve"
)

const SUBJECT_TEACHER: readonly Capability[] = [
  "assignment.read",
  "assignment.create",
  "assignment.readStats",
  "roster.read",
  "roster.write",
  "submission.readOwn",
  "submission.readAll",
  "submission.review",
  "submission.accept",
  "submission.commitOverride",
  "teacher.request",
  "team.read",
  "repo.read",
]

const ELECTIVE_TEACHER: readonly Capability[] = [
  "assignment.read",
  "assignment.readStats",
  "roster.read",
  "submission.readOwn",
  "submission.readAll",
  "submission.review",
  "submission.accept",
  "teacher.request",
  "team.read",
  "repo.read",
]

const STUDENT: readonly Capability[] = [
  "assignment.read",
  "submission.readOwn",
  "submission.create",
  "teacher.request",
  "team.read",
  "repo.read",
]

const UNROSTERED: readonly Capability[] = ["teacher.request", "team.read"]

export const ROLE_CAPABILITIES: Readonly<Record<Role, readonly Capability[]>> =
  {
    owner: OWNER,
    animator: ANIMATOR,
    "subject-teacher": SUBJECT_TEACHER,
    "elective-teacher": ELECTIVE_TEACHER,
    student: STUDENT,
    unrostered: UNROSTERED,
  }

const ORG_OWNER_CACHE_TTL_MS = 5 * 60 * 1000
let orgOwnerCache: { org: string; owners: string[]; at: number } | null = null

async function cachedOrgOwners(org: string): Promise<string[] | null> {
  const now = Date.now()
  if (orgOwnerCache && orgOwnerCache.org === org && now - orgOwnerCache.at < ORG_OWNER_CACHE_TTL_MS) {
    return orgOwnerCache.owners
  }
  try {
    const owners = await getOrgOwners(await getOrgToken(), org)
    orgOwnerCache = { org, owners, at: now }
    return owners
  } catch {
    return null
  }
}

export interface AccessContext {
  username: string
  role: Role
  capabilities: ReadonlySet<Capability>
  isOrgOwner: boolean
  isFaculty: boolean
  /**
   * Class teams the caller is limited to. `null` means unrestricted, which is
   * granted only to org owners and animators. An empty array means the caller
   * may see nothing — scoping must never widen access.
   */
  scopedClasses: string[] | null
  /** The caller's own class team, if they are a student. */
  team: string | null
  /** Class teams the caller teaches. */
  classes: string[]
}

export async function resolveAccess(username: string): Promise<AccessContext> {
  const org = process.env.GITHUB_ORG
  const owners = org ? await cachedOrgOwners(org) : null
  const isOrgOwner = !!owners?.includes(username)

  const teacher = getTeacherByGithubUsername(username)
  const teacherRole = teacher?.role
  const isApprovedTeacher =
    teacherRole === "animator" ||
    teacherRole === "subject-teacher" ||
    teacherRole === "elective-teacher"

  const rosterEntry = getRosterByGithubUsername(username)
  const team =
    rosterEntry?.status === "active" ? rosterEntry.classTeam : null

  let role: Role
  if (isOrgOwner) role = "owner"
  else if (teacherRole === "animator") role = "animator"
  else if (teacherRole === "subject-teacher") role = "subject-teacher"
  else if (teacherRole === "elective-teacher") role = "elective-teacher"
  else if (team) role = "student"
  else role = "unrostered"

  const classes = isApprovedTeacher ? (teacher?.classes ?? []) : []
  const unrestricted = role === "owner" || role === "animator"

  return {
    username,
    role,
    capabilities: new Set(ROLE_CAPABILITIES[role]),
    isOrgOwner,
    isFaculty: unrestricted || isApprovedTeacher,
    // A scoped teacher with no classes sees nothing rather than everything.
    scopedClasses: unrestricted ? null : classes,
    team,
    classes,
  }
}

export function can(
  access: AccessContext,
  capability: Capability
): boolean {
  return access.capabilities.has(capability)
}

export function canAccessClass(
  access: AccessContext,
  classTeam: string
): boolean {
  return access.scopedClasses === null || access.scopedClasses.includes(classTeam)
}

export function canAccessAssignment(
  access: AccessContext,
  assignment: Assignment
): boolean {
  if (access.scopedClasses === null) return true
  return assignment.assignedTeams.some((t) => access.scopedClasses!.includes(t))
}

/**
 * Students may only touch repositories they own — their project lives in a
 * personal repo, and allowing any repo they can read would let them record
 * metrics from a private repo they merely collaborate on. Staff read with
 * their own OAuth token too, so they are limited to what GitHub already lets
 * them see and need no extra restriction here.
 */
export function canUseRepo(access: AccessContext, owner: string): boolean {
  if (access.role !== "student") return true
  return owner.toLowerCase() === access.username.toLowerCase()
}

/**
 * Whether the caller may act on a specific submission: the owning student
 * always may, and anyone else needs `submission.readAll` plus the assignment
 * being in one of their classes.
 */
export function canAccessSubmission(
  access: AccessContext,
  submission: { studentUsername: string; assignmentId: string }
): boolean {
  if (submission.studentUsername === access.username) return true
  if (!can(access, "submission.readAll")) return false

  const assignment = getAssignment(submission.assignmentId)
  if (!assignment) return false
  return canAccessAssignment(access, assignment)
}

export function resolveAssignment(id: string): Assignment | null {
  return getAssignment(id) ?? null
}

export interface AccessSession {
  access: AccessContext
  accessToken: string
}

export type AccessResult =
  | { ok: true; session: AccessSession }
  | { ok: false; response: NextResponse }

/**
 * The caller's GitHub identity, read straight from the signed session JWT.
 *
 * The token is deliberately NOT read from `auth()`, because that goes through
 * the `session` callback whose result Auth.js hands to the browser on
 * /api/auth/session. Decoding the JWT here keeps the OAuth token server-side.
 */
export interface SessionIdentity {
  /** GitHub login — the value all authorization keys off. */
  login: string
  /** Per-user OAuth token with the `repo` scope. Never leaves the server. */
  accessToken: string
}

/**
 * Verifies the session cookie and returns the caller, or null when there is no
 * valid session. Accepts bare `Headers` rather than a `Request` so the proxy
 * can pass `NextRequest.headers` without this module depending on
 * `next/headers` in the edge runtime.
 */
export async function readSessionIdentity(
  requestHeaders: Headers
): Promise<SessionIdentity | null> {
  const secret = process.env.AUTH_SECRET
  if (!secret) return null

  // The cookie is `__Secure-authjs.session-token` over HTTPS and
  // `authjs.session-token` otherwise, so both spellings are attempted.
  for (const secureCookie of [true, false]) {
    const jwt = await getToken({
      req: { headers: requestHeaders },
      secret,
      secureCookie,
    }).catch(() => null)

    const accessToken = jwt?.accessToken
    if (typeof accessToken !== "string" || !accessToken) continue

    // Authorization keys off the GitHub login and nothing else. Sessions
    // issued before the `login` claim existed (or by a build that did not
    // capture it) are treated as signed out: falling back to the display name
    // would silently authorize the wrong identity for anyone whose GitHub
    // display name differs from their login. The user simply signs in again
    // and the claim is captured on the way through the `jwt` callback.
    const login = typeof jwt.login === "string" && jwt.login ? jwt.login : null

    if (!login) continue
    return { login, accessToken }
  }

  return null
}

const UNAUTHORIZED = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 })

/**
 * Authorizes a request. Returns the resolved access context or a ready-to-return
 * error response. Use this in every route handler instead of calling auth()
 * and isFaculty() separately.
 */
export async function authorize(
  capability: Capability
): Promise<AccessResult> {
  const identity = await readSessionIdentity(await headers())
  if (!identity) return { ok: false, response: UNAUTHORIZED() }

  const access = await resolveAccess(identity.login)

  if (!can(access, capability)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Forbidden: requires ${capability}` },
        { status: 403 }
      ),
    }
  }

  return {
    ok: true,
    session: { access, accessToken: identity.accessToken },
  }
}

/** Same as authorize() but for routes any signed-in user may reach. */
export async function authenticate(): Promise<AccessResult> {
  const identity = await readSessionIdentity(await headers())
  if (!identity) return { ok: false, response: UNAUTHORIZED() }

  return {
    ok: true,
    session: {
      access: await resolveAccess(identity.login),
      accessToken: identity.accessToken,
    },
  }
}

/** The public shape returned by /api/me. Never includes the access token. */
export function toPublicAccess(access: AccessContext) {
  return {
    username: access.username,
    role: access.role,
    isFaculty: access.isFaculty,
    isOrgOwner: access.isOrgOwner,
    team: access.team,
    classes: access.classes,
    capabilities: [...access.capabilities],
  }
}
