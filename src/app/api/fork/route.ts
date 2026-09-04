import { NextResponse } from "next/server"
import { auth } from "@/backend/auth"
import { forkRepo, checkForkExists } from "@/backend/lib/github"
import { addSubmission } from "@/backend/lib/data"

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { owner, repo } = await request.json()

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Owner and repo are required" },
      { status: 400 }
    )
  }

  try {
    const existingFork = await checkForkExists(
      session.accessToken,
      owner,
      repo
    )

    if (existingFork) {
      addSubmission({
        id: `sub-${Date.now()}`,
        studentUsername: session.user?.name || "",
        assignmentId: repo,
        forkUrl: existingFork.html_url,
        status: "forked",
      })

      return NextResponse.json({
        fork: existingFork,
        alreadyExisted: true,
      })
    }

    const fork = await forkRepo(session.accessToken, owner, repo)

    addSubmission({
      id: `sub-${Date.now()}`,
      studentUsername: session.user?.name || "",
      assignmentId: repo,
      forkUrl: fork.html_url,
      status: "forked",
    })

    return NextResponse.json({ fork, alreadyExisted: false })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fork repository"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
