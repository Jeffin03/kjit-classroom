import { NextResponse } from "next/server"
import { parseRepoUrl, getLatestCommit } from "@/backend/github/repos"
import { authorize, canUseRepo } from "@/backend/services/permissions"

export async function GET(request: Request) {
  const auth = await authorize("repo.read")
  if (!auth.ok) return auth.response

  const { access, accessToken } = auth.session

  const { searchParams } = new URL(request.url)
  const repo = searchParams.get("repo")

  if (!repo) {
    return NextResponse.json(
      { error: "repo query param is required (format: owner/name)" },
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

  // Students may only read their own repositories through this proxy.
  // Faculty may read any repo they can personally see.
  if (!canUseRepo(access, owner)) {
    return NextResponse.json(
      { error: "You can only inspect your own repositories" },
      { status: 403 }
    )
  }

  try {
    // Read with the caller's own OAuth token, never the org token: a student's
    // project usually lives in a personal repo the org token cannot see.
    const commit = await getLatestCommit(accessToken, owner, name)
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
