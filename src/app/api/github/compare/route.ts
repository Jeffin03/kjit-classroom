import { NextResponse } from "next/server"
import { auth } from "@/backend/auth"
import { getOrgToken } from "@/backend/github/client"
import { parseRepoUrl, getDiffMetrics } from "@/backend/github/repos"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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

  try {
    const { owner, repo: name } = parseRepoUrl(repo)
    const token = await getOrgToken()
    const metrics = await getDiffMetrics(token, owner, name, base, head)
    return NextResponse.json(metrics)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to compare commits" },
      { status: 500 }
    )
  }
}