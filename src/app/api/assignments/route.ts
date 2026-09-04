import { NextResponse } from "next/server"
import { auth } from "@/backend/auth"
import { getAssignments, addAssignment } from "@/backend/lib/data"
import { getOrgToken, getOrgOwners, createRepoWithREADME } from "@/backend/lib/github"

export async function GET() {
  const assignments = getAssignments()
  return NextResponse.json(assignments)
}

function buildReadme(data: {
  title: string
  description: string
  problemStatement: string
  objectives: string[]
  requirements: string[]
  evaluationCriteria: string[]
  submissionGuidelines: string
  deadline: string
  subject: string
}): string {
  const lines = [
    `# ${data.title}`,
    "",
    `> **Subject:** ${data.subject}`,
    `> **Deadline:** ${data.deadline}`,
    "",
    "## Overview",
    "",
    data.description,
    "",
    "## Problem Statement",
    "",
    data.problemStatement,
    "",
    "## Objectives",
    "",
    ...data.objectives.map((o, i) => `${i + 1}. ${o}`),
    "",
    "## Requirements",
    "",
    ...data.requirements.map((r) => `- ${r}`),
    "",
    "## Evaluation Criteria",
    "",
    ...data.evaluationCriteria.map((c) => `- ${c}`),
    "",
    "## Submission Guidelines",
    "",
    data.submissionGuidelines,
    "",
    "---",
    "",
    "*Created with [KJIT Classroom](https://github.com/kjit-classroom)*",
  ]
  return lines.join("\n")
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const org = process.env.GITHUB_ORG
  if (!org) {
    return NextResponse.json(
      { error: "GITHUB_ORG not configured" },
      { status: 500 }
    )
  }

  const currentUser = session.user?.name
  if (!currentUser) {
    return NextResponse.json({ error: "No user info" }, { status: 400 })
  }

  const isOwner = await (async () => {
    try {
      const token = await getOrgToken()
      const owners = await getOrgOwners(token, org)
      return owners.includes(currentUser)
    } catch {
      return false
    }
  })()

  const teacher = (await import("@/backend/lib/data")).getTeacherByGithubUsername(currentUser)
  const isAnimator = teacher?.role === "animator"

  if (!isOwner && !isAnimator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const {
    title,
    description,
    subject,
    deadline,
    problemStatement,
    objectives,
    requirements,
    evaluationCriteria,
    submissionGuidelines,
  } = body

  if (!title || !description || !subject || !deadline || !problemStatement) {
    return NextResponse.json(
      { error: "title, description, subject, deadline, and problemStatement are required" },
      { status: 400 }
    )
  }

  const repoName = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  const id = `assignment-${Date.now()}`

  const readmeContent = buildReadme({
    title,
    description,
    problemStatement,
    objectives: objectives || [],
    requirements: requirements || [],
    evaluationCriteria: evaluationCriteria || [],
    submissionGuidelines: submissionGuidelines || "Fork the repo and submit a PR with your solution.",
    deadline,
    subject,
  })

  try {
    const token = await getOrgToken()
    const repo = await createRepoWithREADME(
      token,
      org,
      repoName,
      `${title} - ${subject}`,
      readmeContent
    )

    const assignment = {
      id,
      title,
      description,
      templateOwner: org,
      templateRepo: repo.name,
      deadline,
      subject,
      problemStatement,
      objectives: objectives || [],
      requirements: requirements || [],
      evaluationCriteria: evaluationCriteria || [],
      submissionGuidelines: submissionGuidelines || "",
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addAssignment(assignment)

    return NextResponse.json({
      assignment,
      repoUrl: repo.html_url,
      message: "Assignment created with GitHub repo",
    })
  } catch (err) {
    const assignment = {
      id,
      title,
      description,
      templateOwner: org,
      templateRepo: repoName,
      deadline,
      subject,
      problemStatement,
      objectives: objectives || [],
      requirements: requirements || [],
      evaluationCriteria: evaluationCriteria || [],
      submissionGuidelines: submissionGuidelines || "",
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addAssignment(assignment)

    return NextResponse.json({
      assignment,
      repoUrl: null,
      message: "Assignment created (repo creation failed — no GitHub token configured)",
    })
  }
}
