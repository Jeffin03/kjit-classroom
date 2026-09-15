import { githubFetch } from "./client"
import type { DiffMetrics } from "../types"

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  clone_url: string
  description: string | null
  fork: boolean
  default_branch: string
}

export interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      date: string
    }
  }
  html_url: string
}

export interface GitHubCompareFile {
  filename: string
  status: "added" | "modified" | "removed" | "renamed" | "changed"
  additions: number
  deletions: number
  changes: number
}

export interface GitHubCompare {
  status: string
  ahead_by: number
  behind_by: number
  total_commits: number
  files: GitHubCompareFile[]
}

export function parseRepoUrl(url: string): { owner: string; repo: string } {
  const match = url
    .replace(/\.git$/, "")
    .match(/github\.com[/:]([^/]+)\/([^/?#]+)/i)
  if (!match) {
    throw new Error(`Invalid GitHub repository URL: ${url}`)
  }
  return { owner: match[1], repo: match[2] }
}

export async function getRepoInfo(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubRepo> {
  const res = await githubFetch(`/repos/${owner}/${repo}`, token)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Failed to get repo info")
  }
  return res.json()
}

export async function getLatestCommit(
  token: string,
  owner: string,
  repo: string,
  branch?: string
): Promise<GitHubCommit> {
  const params = new URLSearchParams()
  params.set("per_page", "1")
  if (branch) params.set("sha", branch)
  const res = await githubFetch(
    `/repos/${owner}/${repo}/commits?${params.toString()}`,
    token
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Failed to get latest commit")
  }
  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Repository has no commits yet")
  }
  return data[0]
}

export async function compareCommits(
  token: string,
  owner: string,
  repo: string,
  base: string,
  head: string
): Promise<GitHubCompare> {
  const res = await githubFetch(
    `/repos/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,
    token
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Failed to compare commits")
  }
  return res.json()
}

export async function getDiffMetrics(
  token: string,
  owner: string,
  repo: string,
  baseSha: string,
  headSha: string
): Promise<DiffMetrics> {
  const compare = await compareCommits(token, owner, repo, baseSha, headSha)

  const files = compare.files || []
  return {
    totalCommits: compare.total_commits,
    filesChanged: files.length,
    additions: files.reduce((sum, f) => sum + f.additions, 0),
    deletions: files.reduce((sum, f) => sum + f.deletions, 0),
    newFiles: files
      .filter((f) => f.status === "added")
      .map((f) => f.filename),
    modifiedFiles: files
      .filter((f) => f.status === "modified" || f.status === "renamed" || f.status === "changed")
      .map((f) => f.filename),
    removedFiles: files.filter((f) => f.status === "removed").map((f) => f.filename),
  }
}

export async function getFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<string> {
  const query = ref ? `?ref=${encodeURIComponent(ref)}` : ""
  const res = await githubFetch(`/repos/${owner}/${repo}/contents/${path}${query}`, token)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Failed to get file content")
  }
  const data = await res.json()
  if (data.encoding === "base64" && data.content) {
    return Buffer.from(data.content, "base64").toString("utf-8")
  }
  throw new Error("Unsupported file content format")
}