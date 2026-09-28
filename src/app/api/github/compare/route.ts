import { NextResponse } from "next/server"
import { parseRepoUrl, getDiffMetrics } from "@/backend/github/repos"
import { authorize, canUseRepo } from "@/backend/services/permissions"

export async function GET(request: Request) {
  const auth = await authorize("repo.read")
  if (!auth.ok) return auth.response

  const { access, accessToken } = auth.session

  const { searchParams } = new URL(request.url)
  const repo = searchParams.get("repo")
  const base = searchParams.get("base")
  const head = searchParams.get("head")

  if (!repo || !base || !head) {
    return NextResponse.json(
      { error: "repo, base, and head query params are required" },
      { status: 400 }
    )
  }

  let owner: string
  let name: string
  try {
    ;({ owner, repo: name } = parseRepoUrl(repo))
  } catch {
    return NextResponse.json({ error: "Malformed repo" }, { status: 400 })
  }

  // Students may only compare within their own repositories.
  if (!canUseRepo(access, owner)) {
    return NextResponse.json(
      { error: "You can only inspect your own repositories" },
      { status: 403 }
    )
  }

  try {
    // Read with the caller's own OAuth token, never the org token: a student's
    // project usually lives in a personal repo the org token cannot see.
    const metrics = await getDiffMetrics(
      accessToken,
      owner,
      name,
      base,
      head
    )
    return NextResponse.json(metrics)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to compare commits" },
      { status: 500 }
    )
  }
}
