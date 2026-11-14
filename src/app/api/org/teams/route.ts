import { NextResponse } from "next/server"
import { getOrgToken } from "@/backend/github/client"
import {
  addTeamMaintainer,
  createTeam,
  isFacultyTeam,
  listTeams,
} from "@/backend/github/teams"
import { authorize } from "@/backend/services/permissions"
import { isDevTestAuthEnabled, TEST_CLASSES } from "@/backend/dev/testAccounts"
import { jsonError, readJson } from "@/backend/http"
import {
  getTeacherByGithubUsername,
  updateTeacherProfile,
} from "@/backend/store/teachers"

export async function GET() {
  const auth = await authorize("team.read")
  if (!auth.ok) return auth.response

  const org = process.env.GITHUB_ORG
  if (!org) {
    return NextResponse.json({ teams: [] })
  }

  try {
    const { access } = auth.session
    let allTeams
    if (isDevTestAuthEnabled()) {
      allTeams = TEST_CLASSES.map((name, i) => ({
        id: i,
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        description: null,
        members_count: 0,
      }))
    } else {
      allTeams = await listTeams(await getOrgToken(auth.session.accessToken), org).catch(() => [])
    }
    // The faculty team ("KJIT Faculty" on the production org) is not a class:
    // without this every picker — dashboard, onboarding, assignment creation —
    // would offer it as one.
    const classTeams = allTeams.filter((t) => !isFacultyTeam(t))
    // Scoped teachers only ever pick from their own classes.
    const teams =
      access.scopedClasses === null
        ? classTeams
        : classTeams.filter((t) => access.scopedClasses!.includes(t.name))

    // Only faculty see team metadata; everyone else just needs the class names
    // to pick from when requesting a role.
    if (!access.isFaculty) {
      return NextResponse.json({
        teams: teams.map((t) => ({ name: t.name, slug: t.slug })),
      })
    }

    return NextResponse.json({ teams })
  } catch (err) {
    // Surface the real reason (missing org token, bad credentials, ...) —
    // swallowing it here leaves the onboarding wizard with a dead-end
    // "the org request failed" box and no way to diagnose.
    return NextResponse.json({
      teams: [],
      error: err instanceof Error ? err.message : "Failed to load classes",
    })
  }
}

export async function POST(request: Request) {
  // Allow org owners and teachers with roster.write to create class cohorts
  const auth = await authorize("roster.write")
  if (!auth.ok) return auth.response

  const body = await readJson<{
    name?: unknown
    description?: unknown
    animatorUsername?: unknown
  }>(request)
  if (!body) return jsonError("Request body must be valid JSON")

  const name =
    typeof body.name === "string" ? body.name.trim() : ""
  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Class name is required (at least 2 characters)" },
      { status: 400 }
    )
  }

  const description =
    typeof body.description === "string" ? body.description.trim() : ""
  const animatorUsername =
    typeof body.animatorUsername === "string"
      ? body.animatorUsername.trim().replace(/^@/, "")
      : ""

  if (isDevTestAuthEnabled()) {
    if (!TEST_CLASSES.includes(name)) {
      TEST_CLASSES.push(name)
    }
    if (animatorUsername) {
      const teacher = getTeacherByGithubUsername(animatorUsername)
      if (teacher) {
        const updatedClasses = Array.from(
          new Set([...(teacher.classes || []), name])
        )
        updateTeacherProfile(animatorUsername, {
          classes: updatedClasses,
          role: teacher.role === "pending" ? "animator" : teacher.role,
        })
      }
    }
    return NextResponse.json(
      {
        team: {
          id: Date.now(),
          name,
          slug: name.toLowerCase().replace(/\s+/g, "-"),
          description: description || null,
          members_count: 0,
        },
      },
      { status: 201 }
    )
  }

  const org = process.env.GITHUB_ORG
  if (!org) {
    return NextResponse.json(
      { error: "GITHUB_ORG is not configured" },
      { status: 500 }
    )
  }

  try {
    const token = await getOrgToken(auth.session.accessToken)
    const team = await createTeam(token, org, name, description, "closed")

    const warnings: string[] = []

    // If an animator was specified, make them maintainer and update their scope
    if (animatorUsername) {
      try {
        await addTeamMaintainer(token, org, team.slug, animatorUsername)
      } catch (err) {
        warnings.push(
          `Could not add @${animatorUsername} as team maintainer: ${
            err instanceof Error ? err.message : "GitHub API error"
          }`
        )
      }
      const teacher = getTeacherByGithubUsername(animatorUsername)
      if (teacher) {
        const updatedClasses = Array.from(
          new Set([...(teacher.classes || []), name])
        )
        updateTeacherProfile(animatorUsername, {
          classes: updatedClasses,
          role: teacher.role === "pending" ? "animator" : teacher.role,
        })
      }
    } else if (auth.session.access.isFaculty && auth.session.access.username) {
      // Creator is faculty: add as maintainer
      try {
        await addTeamMaintainer(
          token,
          org,
          team.slug,
          auth.session.access.username
        )
      } catch {
        // best-effort
      }
    }

    return NextResponse.json(
      {
        team,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
      { status: 201 }
    )
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to create class cohort",
      },
      { status: 500 }
    )
  }
}
