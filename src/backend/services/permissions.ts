import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { getToken } from "next-auth/jwt"
import { getOrgToken } from "../github/client"
import { getOrgOwners } from "../github/org"
import { getTeamMembers, facultyTeamSlugs } from "../github/teams"
import { getTeacherByGithubUsername } from "../store/teachers"
import { getTestAccount, isDevTestAuthEnabled } from "../dev/testAccounts"
import { getRosterByGithubUsername } from "../store/roster"
import { getAssignment } from "../store/assignments"
import { ensureFresh } from "../store/persistence"
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
  "team.read",
  "repo.read",
]

const STUDENT: readonly Capability[] = [
  "assignment.read",
  "submission.readOwn",
  "submission.create",
  "team.read",
  "repo.read",
]

const UNROSTERED: readonly Capability[] = ["team.read"]

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

async function cachedOrgOwners(org: string, userAccessToken?: string): Promise<string[] | null> {
  const now = Date.now()
  if (orgOwnerCache && orgOwnerCache.org === org && now - orgOwnerCache.at < ORG_OWNER_CACHE_TTL_MS) {
    return orgOwnerCache.owners
  }
  try {
    const owners = await getOrgOwners(await getOrgToken(userAccessToken), org)
    orgOwnerCache = { org, owners, at: now }
    return owners
  } catch {
    return null
  }
}

const FACULTY_TEAM_CACHE_TTL_MS = 5 * 60 * 1000
/**
 * Short TTL for the "nobody is in a faculty team" result. Without it every
 * request from every non-faculty user (i.e. every student) would re-probe
 * GitHub on each `resolveAccess` call — three round-trips per API request and
 * per page navigation. Kept short so adding the first faculty member takes
 * effect within a minute, before the longer positive TTL can expire.
 */
const FACULTY_TEAM_MISS_TTL_MS = 60 * 1000
let facultyTeamCache: {
  org: string
  members: string[]
  at: number
  ttl: number
} | null = null

async function cachedFacultyTeamMembers(org: string, userAccessToken?: string): Promise<string[]> {
  const now = Date.now()
  if (
    facultyTeamCache &&
    facultyTeamCache.org === org &&
    now - facultyTeamCache.at < facultyTeamCache.ttl
  ) {
    return facultyTeamCache.members
  }
  try {
    const token = await getOrgToken(userAccessToken)
    const candidateSlugs = facultyTeamSlugs()

    // Probe in parallel — sequential probes would multiply the latency every
    // student pays on a cache miss.
    const settled = await Promise.allSettled(
      candidateSlugs.map(async (slug) => ({
        members: await getTeamMembers(token, org, slug),
      }))
    )

    // First candidate slug with members wins, matching the old precedence.
    for (const result of settled) {
      if (result.status !== "fulfilled") continue
      if (result.value.members.length > 0) {
        facultyTeamCache = {
          org,
          members: result.value.members,
          at: now,
          ttl: FACULTY_TEAM_CACHE_TTL_MS,
        }
        return result.value.members
      }
    }

    // Cache the miss as well: an empty result must not mean three GitHub
    // calls on the next request.
    facultyTeamCache = {
      org,
      members: [],
      at: now,
      ttl: FACULTY_TEAM_MISS_TTL_MS,
    }
    return []
  } catch {
    return []
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

export async function resolveAccess(
  username: string,
  userAccessToken?: string
): Promise<AccessContext> {
  // Every API route and the proxy funnel through here, so this is the single
  // place to pull a fresh store snapshot written by another instance.
  await ensureFresh()

  // Dev-only: synthetic test accounts bypass GitHub-backed role resolution.
  if (isDevTestAuthEnabled()) {
    const account = getTestAccount(username)
    if (account) {
      const role = account.role
      const classes = account.classes ?? []
      const team = account.team ?? null
      const unrestricted = role === "owner" || role === "animator"
      return {
        username,
        role,
        capabilities: new Set(ROLE_CAPABILITIES[role]),
        isOrgOwner: role === "owner",
        isFaculty: role !== "student" && role !== "unrostered",
        scopedClasses: unrestricted ? null : classes,
        team,
        classes,
      }
    }
  }

  const org = process.env.GITHUB_ORG
  const owners = org ? await cachedOrgOwners(org, userAccessToken) : null
  const isOrgOwner = !!owners?.some(
    (owner) => owner.toLowerCase() === username.toLowerCase()
  )

  const facultyMembers = org ? await cachedFacultyTeamMembers(org, userAccessToken) : []
  const isInFacultyTeam = facultyMembers.some(
    (m) => m.toLowerCase() === username.toLowerCase()
  )

  const teacher = getTeacherByGithubUsername(username)
  const teacherRole = teacher?.role
  const isApprovedTeacher =
    isInFacultyTeam ||
    teacherRole === "animator" ||
    teacherRole === "subject-teacher" ||
    teacherRole === "elective-teacher"

  const rosterEntry = getRosterByGithubUsername(username)
  const team =
    rosterEntry?.status === "active" ? rosterEntry.classTeam : null

  let role: Role
  if (isOrgOwner) role = "owner"
  else if (isInFacultyTeam) {
    // GitHub team membership is the source of truth. An explicit class-scoped
    // record still narrows access, but a stale "pending" request record must
    // not leave a faculty-team member locked out of /faculty.
    role =
      teacherRole === "subject-teacher" || teacherRole === "elective-teacher"
        ? teacherRole
        : "animator"
  } else if (teacherRole === "animator") role = "animator"
  else if (teacherRole === "subject-teacher") role = "subject-teacher"
  else if (teacherRole === "elective-teacher") role = "elective-teacher"
  else if (team) role = "student"
  else role = "unrostered"

  const classes = isApprovedTeacher ? (teacher?.classes ?? []) : []
  const unrestricted = role === "owner" || (role === "animator" && isInFacultyTeam)

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
  if (submission.studentUsername.toLowerCase() === access.username.toLowerCase())
    return true
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
  /** Per-user GitHub App token (Contents: read-only). Never leaves the server. */
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

    // A GitHub App user token that has passed its expiry is useless. The jwt
    // callback refreshes it on the next session read; until then, treat the
    // session as signed out rather than calling GitHub with dead credentials.
    const expiresAt =
      typeof jwt.expiresAt === "number" ? jwt.expiresAt : null
    if (expiresAt && Date.now() >= expiresAt) continue

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

  const access = await resolveAccess(identity.login, identity.accessToken)

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
      access: await resolveAccess(identity.login, identity.accessToken),
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


/**
 * Default post-login landing route for a resolved access context. Faculty and
 * owners land on the faculty shell; everyone else on the student dashboard.
 */
export function defaultLandingPath(access: AccessContext): string {
  return access.isFaculty ? "/faculty" : "/dashboard"
}

export function landingPath(access: AccessContext): string {
  return defaultLandingPath(access)
}

export function landingPathForRole(role: Role): string {
  return role === "student" || role === "unrostered" ? "/dashboard" : "/faculty"
}

export function defaultRouteForRole(role: Role): string {
  return landingPathForRole(role)
}
