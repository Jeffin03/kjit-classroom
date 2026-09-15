import { NextResponse } from "next/server"
import { auth } from "@/backend/auth"
import { getOrgToken } from "@/backend/github/client"
import { parseRepoUrl, getLatestCommit } from "@/backend/github/repos"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const repo = searchParams.get("repo")

  if (!repo) {
    return NextResponse.json(
      { error: "repo query param is required (format: owner/name)" },
      { status: 400 }
    )
  }

  try {
    const { owner, repo: name } = parseRepoUrl(repo)
    const token = await getOrgToken()
    const commit = await getLatestCommit(token, owner, name)
    return NextResponse.json({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      html_url: commit.html_url,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch commit" },
      { status: 500 }
    )
  }
}