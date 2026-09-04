import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createPR, listPRs } from "@/lib/github"
import { addSubmission } from "@/lib/data"

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { templateOwner, templateRepo, forkOwner, title, body } =
    await request.json()

  if (!templateOwner || !templateRepo || !forkOwner) {
    return NextResponse.json(
      { error: "Template owner, template repo, and fork owner are required" },
      { status: 400 }
    )
  }

  try {
    const pr = await createPR(
      session.accessToken,
      templateOwner,
      templateRepo,
      `${forkOwner}:${templateRepo}`,
      "main",
      title || `Project submission by ${forkOwner}`,
      body || `This PR submits the project from ${forkOwner}'s fork.`
    )

    addSubmission({
      id: `sub-${Date.now()}`,
      studentUsername: forkOwner,
      assignmentId: templateRepo,
      forkUrl: `https://github.com/${forkOwner}/${templateRepo}`,
      prUrl: pr.html_url,
      prNumber: pr.number,
      status: "submitted",
      submittedAt: new Date().toISOString(),
    })

    return NextResponse.json({ pr })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create PR"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const owner = searchParams.get("owner")
  const repo = searchParams.get("repo")

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Owner and repo are required" },
      { status: 400 }
    )
  }

  try {
    const prs = await listPRs(session.accessToken, owner, repo)
    return NextResponse.json(prs)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list PRs"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
