# KJIT Classroom — Implementation Plan

## Overview

Redesign the assignment submission flow from a fork-PR model to a sprint-based model where students build their own repos, submit progressively, and faculty tracks progress via git commits and structured summaries.

---

## Sprint Workflow

### Sprint 0 (Abstract)
- Student creates a GitHub repo
- Submits repo URL + Google Doc/Sheet link for abstract
- Timestamped as the project baseline
- Commit SHA recorded

### Sprints 1–3 (Progress)
- Student marks sprint as submitted when stable
- System records the commit SHA at that point
- System fetches diff metrics from GitHub API (commits, files changed, +/- lines)
- Student provides Google Doc/Sheet link for updated documentation
- Student fills structured sprint summary:
  - What was completed
  - What changed since last sprint
  - Blockers
  - Demo link (optional)
- Faculty reviews in lab, adds digital review notes on the portal

### Pivots (Edge Case)
- Student can change topic or implementation approach mid-way
- At any sprint, student checks "I'm pivoting" and provides new repo URL
- Previous sprints stay as historical record (marked "superseded")
- Subsequent sprints compare against the new repo
- System resets baseline commit SHA to new repo's initial commit

### Commit Hash Updates
- With faculty permission, student can update a sprint's commit hash
- The new commit must be from the same repo
- No duplicate commit hashes allowed across sprints for the same submission
- Use case: previous commit was buggy, student wants to point to a fixed version

### Faculty Review
- Review happens in lab (in-person)
- Portal is for tracking progress and adding review notes digitally
- Faculty can add review notes and mark sprints as reviewed at any time

---

## Data Model

### Assignment

```ts
interface Assignment {
  id: string
  title: string
  description: string
  assignedTeams: string[]          // e.g. ["MCA-A-2025-26"]
  deadline: string
  subject: string
  problemStatement: string
  objectives: string[]
  requirements: string[]
  evaluationCriteria: string[]
  sprintCount: 4                   // fixed at 4
  createdBy: string
  createdAt: string
  updatedAt: string
}
```

### Submission

```ts
interface Submission {
  id: string
  studentUsername: string
  assignmentId: string
  repoUrl: string                  // current repo (changes on pivot)
  abstractDocUrl: string           // Google Doc/Sheet link for abstract
  status: "active" | "completed" | "accepted"
  createdAt: string                // sprint 0 timestamp
}
```

### SprintSubmission

```ts
interface SprintSubmission {
  id: string
  submissionId: string
  sprintNumber: number             // 0, 1, 2, 3
  commitSha: string                // git commit at submission time
  isPivot: boolean                 // true if this sprint introduces a new repo
  previousRepoUrl?: string         // old repo URL if pivoted
  documentationUrl: string         // Google Doc/Sheet link (required for all sprints)
  summary?: {
    completed: string[]            // checklist of what was done
    changed: string                // what changed since last sprint
    blockers: string
    demoUrl?: string
  }
  // Diff metrics (fetched from GitHub API, not student-entered)
  diffMetrics?: {
    totalCommits: number
    filesChanged: number
    additions: number
    deletions: number
    newFiles: string[]
    modifiedFiles: string[]
    removedFiles: string[]
  }
  submittedAt: string
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
}
```

**Notes:**
- `diffMetrics` is populated server-side when student submits — backend calls GitHub compare API
- `documentationUrl` accepts any URL (Google Doc, Google Sheet, Notion, etc.) — no file upload
- `commitSha` can be updated by faculty permission (no duplicates allowed)

### Existing Models (unchanged)

```ts
interface RosterEntry {
  rollNo: string
  collegeEmail: string
  githubUsername?: string
  githubUserId?: number
  classTeam: string
  status: "invited" | "active" | "no-account"
  onboardedBy: string
  onboardedAt: string
}

interface TeacherProfile {
  id: string
  githubUsername: string
  email: string
  role: "pending" | "animator" | "subject-teacher" | "elective-teacher"
  classes: string[]
  approvedBy?: string
  approvedAt?: string
  requestedAt: string
}
```

---

## Target Directory Structure

```
kjit-classroom/src/
├── backend/
│   ├── auth.ts                              (keep)
│   ├── types/
│   │   ├── assignment.ts
│   │   ├── submission.ts
│   │   ├── roster.ts
│   │   └── index.ts
│   ├── store/
│   │   ├── assignments.ts
│   │   ├── submissions.ts
│   │   ├── roster.ts
│   │   └── teachers.ts
│   ├── services/
│   │   ├── assignment.service.ts
│   │   ├── submission.service.ts
│   │   ├── auth.service.ts
│   │   └── roster.service.ts
│   └── github/
│       ├── client.ts
│       ├── repos.ts
│       ├── teams.ts
│       └── org.ts
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts      (keep)
│   │   ├── assignments/route.ts             (rewrite)
│   │   ├── assignments/[id]/route.ts        (new)
│   │   ├── submissions/route.ts             (rewrite)
│   │   ├── submissions/[id]/sprints/route.ts       (new)
│   │   ├── submissions/[id]/sprints/[sprint]/route.ts (new)
│   │   ├── submissions/[id]/review/route.ts        (new)
│   │   ├── github/commit/route.ts           (new)
│   │   ├── github/compare/route.ts          (new)
│   │   ├── roster/route.ts                  (keep)
│   │   ├── org/owners/route.ts              (keep)
│   │   ├── org/teams/route.ts               (keep)
│   │   ├── onboard/invite/route.ts          (keep)
│   │   ├── onboard/match/route.ts           (keep)
│   │   ├── requests/route.ts                (keep)
│   │   └── teachers/route.ts                (keep)
│   ├── layout.tsx                           (keep)
│   ├── page.tsx                             (keep)
│   ├── assignments/page.tsx                 (keep)
│   ├── dashboard/page.tsx                   (keep)
│   ├── announcements/page.tsx               (keep)
│   └── faculty/
│       ├── page.tsx                         (keep)
│       ├── assignments/page.tsx             (keep)
│       ├── assignments/[id]/page.tsx        (new)
│       ├── assignments/new/page.tsx         (keep)
│       ├── onboard/page.tsx                 (keep)
│       ├── roster/page.tsx                  (keep)
│       ├── review/page.tsx                  (keep)
│       ├── requests/page.tsx                (keep)
│       └── request/page.tsx                 (keep)
├── frontend/
│   ├── globals.css                          (keep)
│   ├── hooks/
│   │   ├── useAssignments.ts                (new)
│   │   ├── useSubmissions.ts                (new)
│   │   └── useSessionUser.ts                (new)
│   └── components/
│       ├── Navbar.tsx                       (update)
│       ├── FacultyTabBar.tsx                (new)
│       ├── ChecklistProgress.tsx            (new)
│       ├── SprintTimeline.tsx               (new)
│       ├── SprintSubmitForm.tsx             (new)
│       ├── SubmissionCard.tsx               (new)
│       ├── Home.tsx                         (update)
│       ├── Assignments.tsx                  (rewrite)
│       ├── Dashboard.tsx                    (rewrite)
│       ├── Announcements.tsx                (keep)
│       ├── FacultyDashboard.tsx             (rewrite)
│       ├── FacultyAssignments.tsx           (rewrite)
│       ├── FacultyAssignmentDetail.tsx      (new)
│       ├── FacultyReview.tsx                (rewrite)
│       ├── NewAssignment.tsx                (rewrite)
│       ├── FacultyOnboard.tsx               (keep)
│       ├── FacultyRoster.tsx                (keep)
│       ├── FacultyRequest.tsx               (keep)
│       └── FacultyRequests.tsx              (keep)
└── middleware.ts                            (keep)
```

---

## API Routes

### Assignments

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/assignments` | GET | List assignments (filtered by team if student) |
| `/api/assignments` | POST | Create assignment (faculty only) |
| `/api/assignments/[id]` | GET | Assignment detail + sprint stats per student |

### Submissions

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/submissions` | GET | Student's own submissions |
| `/api/submissions` | POST | Sprint 0: create submission (repo URL + abstract doc URL) |
| `/api/submissions/[id]/sprints` | POST | Submit sprint N (or pivot) — system fetches commit SHA + diff metrics |
| `/api/submissions/[id]/sprints/[sprint]` | GET | Get sprint detail with diff metrics |
| `/api/submissions/[id]/sprints/[sprint]` | PUT | Update sprint commit hash (faculty permission required) |
| `/api/submissions/[id]/review` | PUT | Faculty adds review notes |

### GitHub Proxy

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/github/commit` | GET | `?repo=owner/name` → latest commit SHA |
| `/api/github/compare` | GET | `?repo=owner/name&base=sha&head=sha` → diff summary |

### Unchanged

- `/api/roster` — GET
- `/api/org/owners` — GET
- `/api/org/teams` — GET
- `/api/onboard/invite` — POST
- `/api/onboard/match` — POST
- `/api/requests` — GET, PUT
- `/api/teachers` — GET, POST
- `/api/auth/[...nextauth]` — GET, POST

---

## Services

### auth.service.ts

```ts
isFaculty(username: string): Promise<boolean>
  // checks org owners list + teacher profile role

getStudentTeam(username: string): string | null
  // looks up classTeam from roster
```

### assignment.service.ts

```ts
createAssignment(data: CreateAssignmentInput, createdBy: string): Assignment
  // validates required fields, generates ID, stores

getAssignmentsForStudent(studentUsername: string): Assignment[]
  // gets student's team, filters assignments by assignedTeams

getAssignmentWithStats(assignmentId: string): AssignmentWithStats
  // returns assignment + per-student sprint completion array
```

### submission.service.ts

```ts
createSubmission(studentUsername, assignmentId, repoUrl, abstractDocUrl): Submission
  // sprint 0 — creates submission, records initial commit SHA

submitSprint(submissionId, sprintNumber, repoUrl, documentationUrl, summary, isPivot): SprintSubmission
  // sprint N — fetches latest commit SHA from GitHub
  // fetches diff metrics from GitHub compare API
  // if isPivot, updates submission.repoUrl and resets baseline

updateCommitHash(submissionId, sprintNumber, newCommitSha, requestedBy): void
  // faculty-initiated commit hash update
  // validates: new sha != existing sha, same repo, faculty permission

reviewSprint(sprintSubmissionId, reviewedBy, notes): void
  // faculty adds review notes after lab review

getSubmissionsForStudent(studentUsername): Submission[]
getSubmissionsForAssignment(assignmentId): SubmissionWithSprints[]
```

---

## GitHub Client

### client.ts

```ts
getOrgToken(): Promise<string>
  // returns PAT or installation token (moved from github.ts lines 1-76)
```

### repos.ts

```ts
getRepoInfo(token, owner, repo): Promise<GitHubRepo>
  // GET /repos/{owner}/{repo}

getLatestCommit(token, owner, repo, branch?): Promise<GitHubCommit>
  // GET /repos/{owner}/{repo}/commits?sha=main&per_page=1

compareCommits(token, owner, repo, base, head): Promise<GitHubCompare>
  // GET /repos/{owner}/{repo}/compare/{base}...{head}
  // returns: total_commits, files[] with additions/deletions/status

getDiffMetrics(token, owner, repo, baseSha, headSha): Promise<DiffMetrics>
  // calls compareCommits, extracts:
  // totalCommits, filesChanged, additions, deletions
  // newFiles, modifiedFiles, removedFiles

getFileContent(token, owner, repo, path, ref?): Promise<string>
  // GET /repos/{owner}/{repo}/contents/{path}?ref={sha}
```

### teams.ts

```ts
addTeamMember(token, org, teamSlug, username): Promise<void>
isTeamMember(token, org, teamSlug, username): Promise<boolean>
createTeam(token, org, name, description, privacy): Promise<Team>
listTeams(token, org): Promise<Team[]>
addTeamMaintainer(token, org, teamSlug, username): Promise<void>
```

### org.ts

```ts
getOrgOwners(token, org): Promise<string[]>
inviteToOrg(token, org, username, role): Promise<OrgInvitation>
checkOrgMember(token, org, username): Promise<boolean>
getUserByEmail(token, org, email): Promise<GitHubUser | null>
getGitHubUser(accessToken): Promise<GitHubUser>
```

---

## Frontend Hooks

### useSessionUser.ts

```ts
function useSessionUser(): {
  user: { name: string; image: string } | null
  isFaculty: boolean
  team: string | null
  loading: boolean
}
// combines: session + /api/org/owners + /api/teachers + /api/roster
```

### useAssignments.ts

```ts
function useAssignments(): {
  assignments: Assignment[]
  loading: boolean
  error: string | null
  refetch: () => void
}
// fetches: /api/assignments
```

### useSubmissions.ts

```ts
function useSubmissions(assignmentId?: string): {
  submissions: SubmissionWithSprints[]
  loading: boolean
  error: string | null
  refetch: () => void
}
// fetches: /api/submissions?assignmentId=...
```

---

## UI Design System

All visual conventions extracted from the Figma prototype:

### Layout

| Element | Classes |
|---------|---------|
| Page wrapper | `max-w-4xl mx-auto px-4 py-12` |
| Wide page | `max-w-6xl mx-auto px-4 py-12` |
| Navbar | `sticky top-0 z-50 bg-white border-b border-gray-200` |
| Faculty tabs | `border-b border-gray-200 bg-white` |

### Cards

| Element | Classes |
|---------|---------|
| Card | `bg-white border border-gray-100 rounded-xl p-6` |
| Card (hoverable) | `bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow` |
| Stat card | `bg-white border border-gray-100 rounded-xl p-4` |
| Empty state | `bg-white border border-gray-100 rounded-xl p-8 text-center` |

### Buttons

| Element | Classes |
|---------|---------|
| Primary | `bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors` |
| Success | `bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 transition-colors` |
| Danger | `bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition-colors` |
| Secondary | `bg-white border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors` |
| Ghost | `text-sm text-gray-600 hover:text-gray-900` |
| Inline link | `text-sm text-indigo-600 hover:text-indigo-700` |
| Disabled | `disabled:opacity-60` |

### Badges

| Element | Classes |
|---------|---------|
| Base | `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium` |
| Submitted | `bg-blue-100 text-blue-700` |
| Accepted | `bg-green-100 text-green-700` |
| Reviewed | `bg-purple-100 text-purple-700` |
| Past deadline | `bg-red-100 text-red-700` |
| Subject | `bg-indigo-100 text-indigo-700` |
| Pivot | `bg-orange-100 text-orange-700` |

### Typography

| Element | Classes |
|---------|---------|
| Page title | `text-3xl font-bold text-gray-900` |
| Page subtitle | `mt-2 text-base text-gray-600` |
| Section heading | `text-lg font-semibold text-gray-900` |
| Card title | `text-base font-semibold text-gray-900` |
| Body text | `text-sm text-gray-600` |
| Muted text | `text-sm text-gray-500` |
| Timestamp | `text-xs text-gray-400` |
| Stat value | `text-2xl font-bold text-{color}-600` |
| Stat label | `mt-1 text-sm text-gray-600` |

### Forms

| Element | Classes |
|---------|---------|
| Input | `w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500` |
| Textarea | `w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none` |
| Select | `border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500` |
| Label | `block text-sm font-medium text-gray-700 mb-2` |
| Checkbox | `w-4 h-4 rounded accent-indigo-600` |

### Tables

| Element | Classes |
|---------|---------|
| Table wrapper | `bg-white border border-gray-100 rounded-xl overflow-hidden` |
| thead | `bg-gray-50 border-b border-gray-200` |
| th | `px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider` |
| tbody | `divide-y divide-gray-100` |
| td | `px-4 py-3 text-sm` |
| Row hover | `hover:bg-gray-50 transition-colors` |

### Navigation

| Element | Classes |
|---------|---------|
| Navbar link active | `px-3 py-2 rounded-md text-sm font-medium bg-indigo-50 text-indigo-700` |
| Navbar link inactive | `text-gray-600 hover:text-gray-900 hover:bg-gray-50` |
| Tab active | `px-4 py-3 text-sm font-medium border-b-2 border-indigo-600 text-indigo-600` |
| Tab inactive | `border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300` |

### Avatars

| Element | Classes |
|---------|---------|
| Avatar | `w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600` |
| Logo (nav) | `w-8 h-8 bg-indigo-600 rounded-lg` |
| Logo (hero) | `w-20 h-20 bg-indigo-600 rounded-2xl` |

### Banners

| Element | Classes |
|---------|---------|
| Success | `bg-green-50 border border-green-200 rounded-lg p-4` |
| Error | `bg-red-50 border border-red-200 rounded-lg p-4` |

### Spacing

| Context | Convention |
|---------|------------|
| Page padding | `px-4 py-12` |
| Section gap | `mt-6` or `mt-8` |
| Card padding | `p-6` (standard), `p-4` (compact), `p-8` (empty state) |
| List gap | `space-y-4` or `space-y-3` |
| Inline gap | `gap-2` or `gap-3` or `gap-4` |
| Stat grid | `grid grid-cols-2 md:grid-cols-4 gap-4` |

### Colors

| Role | Classes |
|------|---------|
| Primary | `indigo-600` |
| Success | `green-600` / `green-100` / `green-700` |
| Warning | `yellow-600` / `yellow-100` / `yellow-700` |
| Danger | `red-600` / `red-100` / `red-700` |
| Info | `blue-100` / `blue-700` |
| Reviewed | `purple-100` / `purple-700` |
| Pivot | `orange-100` / `orange-700` |
| Text primary | `gray-900` |
| Text secondary | `gray-700` |
| Text body | `gray-600` |
| Text muted | `gray-500` |
| Text timestamp | `gray-400` |
| Surface | `white` (cards) |
| Surface hover | `gray-50` |
| Border | `gray-100` (subtle), `gray-200` (standard), `gray-300` (inputs) |

---

## Key UI Views

### Student: Sprint Timeline

```
Portfolio Website — Sprint Timeline
├── Sprint 0 (Sep 15) ✓
│   Repo: github.com/ananya/portfolio
│   Abstract: sp0-abstract.pdf
│   Commit: abc123
│
├── Sprint 1 (Sep 29) ✓
│   Commit: def456
│   Summary: "Implemented responsive layout"
│   Documentation: sp1-docs.pdf
│   Files changed: 8 (+220, -45)
│   [View Diff] [View Repo]
│
├── Sprint 2 (Oct 13) ✓
│   Commit: ghi789
│   Summary: "Added contact form"
│   Documentation: sp2-docs.pdf
│   Diff from Sprint 1: 5 files (+180, -30)
│   [View Diff] [View Repo]
│
└── Sprint 3 — Not submitted yet
    [Submit Sprint 3]
```

### Faculty: Assignment Detail

```
Portfolio Website — Web Development
Deadline: Sep 30 | Assigned to: MCA-A-2025-26

Students (12):
┌─────────────────────────────────────────────────────┐
│ Ananya Sharma (MCA22001)              [Accept]      │
│ Sprint 0 ✓  Sprint 1 ✓  Sprint 2 ✓  Sprint 3 —   │
│ Current repo: github.com/ananya/portfolio           │
│ Latest commit: def456 (Oct 12)                      │
├─────────────────────────────────────────────────────┤
│ Rohit Krishnan (MCA22002)              [Accept]     │
│ Sprint 0 ✓  Sprint 1 ✓  Sprint 2 PIVOT  Sprint 3 ✓│
│ Current repo: github.com/rohit/task-manager         │
│ Note: Pivoted at Sprint 2                           │
├─────────────────────────────────────────────────────┤
│ Divya Nair (MCA22003)                  [Accept]     │
│ Sprint 0 ✓  Sprint 1 —   Sprint 2 —   Sprint 3 —  │
│ No submissions after Sprint 0                       │
└─────────────────────────────────────────────────────┘
```

### Faculty: Sprint Metrics View

```
Ananya Sharma — Sprint 2 (Sprint 1 → Sprint 2)

Summary: "Added contact form and validation"

Metrics:
├── Commits: 7 since last sprint
├── Files changed: 12
├── +450 lines added, -120 lines removed
├── New files: src/components/Contact.tsx, src/utils/validate.ts
├── Modified: src/App.tsx, src/styles/main.css
└── Documentation: [Google Doc link]

[View repo at this commit]
```

---

## Files to Delete

| File | Reason |
|------|--------|
| `src/app/api/fork/route.ts` | Fork flow removed |
| `src/app/api/pr/route.ts` | PR flow removed |
| `src/backend/lib/data.ts` | Replaced by `store/*` + `types/*` |
| `src/backend/lib/github.ts` | Replaced by `github/*` |
| `src/design/` | Purged — UI patterns extracted above |

---

## Implementation Order

### Week 1: Foundation
- Phase 1: Types + Store + GitHub Client
- Phase 2: Services
- Deliverable: All backend logic works, testable via curl

### Week 2: API
- Phase 3: All API routes
- Deliverable: All endpoints functional, testable via browser

### Week 3: Student UI
- Phase 4: Hooks
- Phase 5.1–5.2: Shared components + Student pages
- Deliverable: Students can submit sprints, view timeline

### Week 4: Faculty UI
- Phase 5.3–5.4: Faculty pages
- Deliverable: Faculty can review, see diffs, add notes

### Week 5: Cleanup + Polish
- Phase 6: Delete old files, fix bugs, refine UX
- Deliverable: Production-ready

---

## File Count

| Category | New | Modified | Deleted |
|----------|-----|----------|---------|
| Types | 4 | 0 | 0 |
| Store | 4 | 0 | 0 |
| GitHub client | 4 | 0 | 0 |
| Services | 4 | 0 | 0 |
| API routes | 8 | 2 | 2 |
| Hooks | 3 | 0 | 0 |
| Components | 7 | 9 | 0 |
| Pages | 1 | 0 | 0 |
| Config | 0 | 0 | 1 dir |
| **Total** | **35** | **11** | **3** |

---

## Design Tasks (Before Implementation)

Before coding begins, the following design artifacts need to be finalized:

1. **Student sprint submission flow** — wireframes for sprint 0, sprint N, and pivot UX
2. **Faculty assignment detail view** — wireframe for per-student sprint breakdown with diff metrics
3. **Sprint summary form** — exact fields and layout
4. **Commit hash update flow** — faculty-initiated update UX

---

## Decisions Made

| Question | Decision |
|----------|----------|
| Documentation storage | Google Doc/Sheet link (no file upload, no server storage) |
| Sprint 0 abstract | URL to Google Doc/Sheet (any format accepted) |
| Diff granularity | Metrics only — commits, files changed, +/- lines. No inline code diffs (teacher can't read all frameworks) |
| Faculty review | Lab only (in-person). Portal is for tracking progress + adding review notes digitally |
| Sprint re-submission | With faculty permission, student can update commit hash. No duplicate hashes allowed |
