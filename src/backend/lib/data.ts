export interface Assignment {
  id: string
  title: string
  description: string
  templateOwner: string
  templateRepo: string
  deadline: string
  subject: string
  problemStatement: string
  objectives: string[]
  requirements: string[]
  evaluationCriteria: string[]
  submissionGuidelines: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface TeacherProfile {
  id: string
  githubUsername: string
  email: string
  role: "pending" | "animator" | "subject-teacher" | "elective-teacher"
  classes: string[]
  approvedBy?: string
  approvedAt?: string
  requestedAt: string
}

export interface RosterEntry {
  rollNo: string
  collegeEmail: string
  githubUsername?: string
  githubUserId?: number
  classTeam: string
  status: "invited" | "active" | "no-account"
  onboardedBy: string
  onboardedAt: string
}

export interface OnboardingSession {
  id: string
  teacherId: string
  classTeam: string
  csvRows: { rollNo: string; collegeEmail: string }[]
  matched: {
    rollNo: string
    collegeEmail: string
    githubUsername: string
    githubAvatar: string
  }[]
  unmatched: { rollNo: string; collegeEmail: string }[]
  status: "uploading" | "matching" | "confirming" | "completed"
  createdAt: string
}

export interface Submission {
  id: string
  studentUsername: string
  assignmentId: string
  forkUrl: string
  prUrl?: string
  prNumber?: number
  status: "forked" | "submitted" | "reviewed" | "accepted" | "merged"
  submittedAt?: string
  reviewedBy?: string
  reviewedAt?: string
}

const assignments: Assignment[] = [
  {
    id: "pbl-01",
    title: "Portfolio Website",
    description:
      "Build a personal portfolio website using HTML, CSS, and JavaScript. Showcase your projects, skills, and contact information.",
    templateOwner: process.env.GITHUB_ORG || "kjit-classroom",
    templateRepo: "portfolio-template",
    deadline: "2026-09-30",
    subject: "Web Development",
    problemStatement:
      "Build a personal portfolio website that showcases your projects, skills, and contact information. The website should be responsive and follow modern web design principles.",
    objectives: [
      "Create a responsive portfolio website",
      "Implement modern UI/UX design",
      "Showcase at least 3 projects",
      "Include a contact form",
    ],
    requirements: [
      "HTML5, CSS3, and vanilla JavaScript",
      "Responsive design (mobile-first)",
      "Clean and professional design",
      "Hosted on GitHub Pages",
    ],
    evaluationCriteria: [
      "Design and aesthetics (25%)",
      "Responsiveness (25%)",
      "Code quality (25%)",
      "Functionality (25%)",
    ],
    submissionGuidelines:
      "Fork the template repo, build your portfolio, and submit a PR with your changes.",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "pbl-02",
    title: "Task Manager API",
    description:
      "Create a RESTful API for a task management system using Node.js and Express. Include CRUD operations and authentication.",
    templateOwner: process.env.GITHUB_ORG || "kjit-classroom",
    templateRepo: "task-api-template",
    deadline: "2026-10-15",
    subject: "Backend Development",
    problemStatement:
      "Create a RESTful API for a task management system. The API should support user authentication, task CRUD operations, and task categorization.",
    objectives: [
      "Implement RESTful API design",
      "Add user authentication",
      "CRUD operations for tasks",
      "Input validation and error handling",
    ],
    requirements: [
      "Node.js and Express",
      "MongoDB or SQLite for data storage",
      "JWT authentication",
      "API documentation",
    ],
    evaluationCriteria: [
      "API design (25%)",
      "Authentication (25%)",
      "Code quality (25%)",
      "Documentation (25%)",
    ],
    submissionGuidelines:
      "Fork the template repo, implement the API, and submit a PR with your changes.",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "pbl-03",
    title: "Data Analysis Dashboard",
    description:
      "Analyze a dataset and create an interactive dashboard using Python and Streamlit. Include visualizations and insights.",
    templateOwner: process.env.GITHUB_ORG || "kjit-classroom",
    templateRepo: "data-dashboard-template",
    deadline: "2026-10-30",
    subject: "Data Science",
    problemStatement:
      "Analyze a given dataset and create an interactive dashboard using Python and Streamlit. The dashboard should provide insights through visualizations and summary statistics.",
    objectives: [
      "Perform data cleaning and analysis",
      "Create interactive visualizations",
      "Build a Streamlit dashboard",
      "Present insights clearly",
    ],
    requirements: [
      "Python 3.x",
      "Pandas for data manipulation",
      "Streamlit for dashboard",
      "Matplotlib or Plotly for charts",
    ],
    evaluationCriteria: [
      "Data analysis quality (25%)",
      "Visualizations (25%)",
      "Dashboard usability (25%)",
      "Insights and conclusions (25%)",
    ],
    submissionGuidelines:
      "Fork the template repo, build the dashboard, and submit a PR with your changes.",
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]

const teachers: TeacherProfile[] = []

const roster: RosterEntry[] = []

const submissions: Submission[] = []

const onboardingSessions: OnboardingSession[] = []

export function getAssignments(): Assignment[] {
  return assignments
}

export function getAssignment(id: string): Assignment | undefined {
  return assignments.find((a) => a.id === id)
}

export function addAssignment(assignment: Assignment): void {
  const existing = assignments.findIndex((a) => a.id === assignment.id)
  if (existing >= 0) {
    assignments[existing] = { ...assignments[existing], ...assignment }
  } else {
    assignments.push(assignment)
  }
}

export function updateAssignment(
  id: string,
  updates: Partial<Assignment>
): void {
  const assignment = assignments.find((a) => a.id === id)
  if (assignment) {
    Object.assign(assignment, updates, { updatedAt: new Date().toISOString() })
  }
}

export function deleteAssignment(id: string): void {
  const idx = assignments.findIndex((a) => a.id === id)
  if (idx >= 0) {
    assignments.splice(idx, 1)
  }
}

export function getRoster(): RosterEntry[] {
  return roster
}

export function getTeams(): string[] {
  return [...new Set(roster.map((r) => r.classTeam))].sort()
}

export function addSubmission(submission: Submission): void {
  const existing = submissions.findIndex(
    (s) =>
      s.studentUsername === submission.studentUsername &&
      s.assignmentId === submission.assignmentId
  )
  if (existing >= 0) {
    submissions[existing] = { ...submissions[existing], ...submission }
  } else {
    submissions.push(submission)
  }
}

export function getSubmissions(): Submission[] {
  return submissions
}

export function getSubmissionsByStudent(
  studentUsername: string
): Submission[] {
  return submissions.filter((s) => s.studentUsername === studentUsername)
}

export function getSubmissionsByAssignment(
  assignmentId: string
): Submission[] {
  return submissions.filter((s) => s.assignmentId === assignmentId)
}

export function getSubmissionById(id: string): Submission | undefined {
  return submissions.find((s) => s.id === id)
}

export function updateSubmissionStatus(
  id: string,
  status: Submission["status"],
  reviewedBy?: string
): void {
  const submission = submissions.find((s) => s.id === id)
  if (submission) {
    submission.status = status
    if (reviewedBy) {
      submission.reviewedBy = reviewedBy
      submission.reviewedAt = new Date().toISOString()
    }
  }
}

// Teacher profiles

export function getTeacherByGithubUsername(
  username: string
): TeacherProfile | undefined {
  return teachers.find((t) => t.githubUsername === username)
}

export function addTeacherProfile(profile: TeacherProfile): void {
  const existing = teachers.findIndex(
    (t) => t.githubUsername === profile.githubUsername
  )
  if (existing >= 0) {
    teachers[existing] = { ...teachers[existing], ...profile }
  } else {
    teachers.push(profile)
  }
}

export function getPendingTeacherRequests(): TeacherProfile[] {
  return teachers.filter((t) => t.role === "pending")
}

export function approveTeacherRequest(
  githubUsername: string,
  approvedBy: string
): void {
  const teacher = teachers.find((t) => t.githubUsername === githubUsername)
  if (teacher) {
    teacher.role = "animator"
    teacher.approvedBy = approvedBy
    teacher.approvedAt = new Date().toISOString()
  }
}

export function denyTeacherRequest(githubUsername: string): void {
  const idx = teachers.findIndex((t) => t.githubUsername === githubUsername)
  if (idx >= 0) {
    teachers.splice(idx, 1)
  }
}

// Onboarding sessions

export function createOnboardingSession(
  session: OnboardingSession
): OnboardingSession {
  onboardingSessions.push(session)
  return session
}

export function getOnboardingSession(
  id: string
): OnboardingSession | undefined {
  return onboardingSessions.find((s) => s.id === id)
}

export function updateOnboardingSession(
  id: string,
  updates: Partial<OnboardingSession>
): void {
  const session = onboardingSessions.find((s) => s.id === id)
  if (session) {
    Object.assign(session, updates)
  }
}

// Roster helpers

export function addRosterEntries(entries: RosterEntry[]): void {
  for (const entry of entries) {
    const existing = roster.findIndex(
      (r) =>
        r.rollNo === entry.rollNo && r.classTeam === entry.classTeam
    )
    if (existing >= 0) {
      roster[existing] = { ...roster[existing], ...entry }
    } else {
      roster.push(entry)
    }
  }
}

export function getRosterByClassTeam(classTeam: string): RosterEntry[] {
  return roster.filter((r) => r.classTeam === classTeam)
}

export function getRosterByOnboardedBy(teacherUsername: string): RosterEntry[] {
  return roster.filter((r) => r.onboardedBy === teacherUsername)
}
