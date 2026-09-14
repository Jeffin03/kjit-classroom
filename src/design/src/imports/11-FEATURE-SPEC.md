# KJIT Classroom — Feature Specification

> Feature-focused description for AI-generated design. No layout or styling details — just what the app does.

---

## What This App Is

KJIT Classroom is a web portal for managing project-based learning assignments in a college department. Faculty creates assignments with problem statements, students build solutions in their own GitHub repos, and progress is tracked through timed sprints.

---

## User Roles

### Student
- Can view assignments assigned to their class team
- Can submit sprint work (repo links, documentation, summaries)
- Can view their own submission timeline
- Cannot see other students' submissions

### Faculty (Admin/Animator)
- Can create and manage assignments
- Can view all student submissions across assignments
- Can view sprint progress and diff metrics per student
- Can add review notes after lab reviews
- Can update a student's commit hash (with permission)
- Can onboard students, manage roster, approve teacher requests

---

## Pages & Features

### Landing Page
- App name, tagline, and description
- Sign in with GitHub button
- Feature highlights (3 cards)
- Always visible to unauthenticated users

### Student: Assignments Page
- List of all assignments for the student's class team
- Each assignment shows: title, subject, description, deadline, number of sprints
- "Start" button on each assignment to begin sprint 0

### Student: Sprint 0 Submission
- Input for GitHub repository URL
- Input for abstract/documentation Google Doc link
- Submit creates the project baseline

### Student: Sprint Timeline
- Vertical timeline showing all sprints (0 through 3)
- Each sprint shows: status (submitted/not), commit SHA, date, documentation link, summary, diff metrics
- Pending sprints show a "Submit" button
- Pivoted sprints are visually marked

### Student: Sprint N Submission Form
- Pre-filled repository URL (can be changed)
- Checkbox: "I'm starting fresh with a new repository" (pivot option)
- If pivot checked: additional input for new repo URL with warning
- Documentation link input
- Sprint summary form:
  - Dynamic list: "What was completed" (add/remove items)
  - Textarea: "What changed since last sprint"
  - Textarea: "Blockers"
  - Optional input: "Demo link"

### Student: Dashboard
- Stats: total submissions, sprints completed, sprints pending
- List of all submissions with sprint progress
- Each entry shows: assignment title, repo link, sprint completion count

### Faculty: Dashboard
- Stats: total students, total submissions, accepted, pending
- Filter by assignment
- List of all student submissions across assignments
- Each entry shows: student name, roll number, assignment, sprint status, repo link

### Faculty: Assignment List
- All assignments with: title, subject, teams assigned, deadline, submission count
- "New Assignment" button
- "View Details" on each assignment

### Faculty: Create Assignment
- Title, subject, description, deadline inputs
- Problem statement textarea
- Dynamic lists: objectives, requirements, evaluation criteria
- Team selector: multi-select from available class teams
- Sprint count: fixed at 4

### Faculty: Assignment Detail
- Assignment header with title, subject, teams, deadline
- Stats: total students, accepted, active submissions, no submissions
- Student list: each student shows name, roll number, GitHub username, sprint completion status (sprint 0 ✓, sprint 1 ✓, etc.), current repo URL, pivot status
- "Accept" button per student
- "View Details" to drill into a student's sprint timeline

### Faculty: Student Sprint Detail
- Student info: name, roll number, GitHub username
- Sprint-by-sprint breakdown:
  - Status badge (submitted/not)
  - Commit SHA
  - Documentation link
  - Sprint summary (what was completed, what changed, blockers, demo link)
  - Diff metrics: number of commits, files changed, lines added/removed, new files, modified files
- Review notes section: textarea to add notes from lab review, save button
- "Update Commit Hash" button (opens modal)

### Faculty: Commit Hash Update Modal
- Shows current commit hash
- Input for new commit hash
- Validation: must be different, must be from same repo
- Confirm/cancel buttons

### Faculty: Review Page
- Filter by assignment
- List of all submissions with status badges
- Quick accept/reject actions

### Faculty: Roster
- Table of all students: roll number, email, GitHub username, class team, status, onboarded by
- Filter by team
- Search by roll number, email, or GitHub username

### Faculty: Onboard Students
- Multi-step wizard:
  1. Upload CSV with roll numbers and emails, select class team
  2. System matches emails to GitHub accounts, shows matched/unmatched
  3. Confirm and invite — sends org invites, adds to team

### Faculty: Approve Requests
- List of pending teacher/animator requests
- Approve or deny each request

### Faculty: Request Animator Role
- Form to request animator role: GitHub username, email, classes

### Announcements
- List of announcements with title, date, author, content
- Info box about GitHub notifications

### Navbar
- App logo and name
- Navigation links: Assignments, My Dashboard, Announcements, Faculty (if faculty)
- User avatar, name, sign out button

### Faculty Tab Bar
- Secondary navigation under navbar for faculty pages
- Tabs: Dashboard, Create Assignment, Review Submissions, Onboard Students, View Roster, Approve Requests, Request Animator Role

---

## Data Concepts

### Assignment
- A project task with a problem statement, objectives, requirements, evaluation criteria
- Assigned to one or more class teams
- Has a fixed number of sprints (4)
- Created by faculty

### Submission
- A student's project for a specific assignment
- Has a GitHub repository URL
- Has an abstract documentation link (Google Doc)
- Status: active, completed, accepted
- Contains sprint submissions

### Sprint Submission
- A point-in-time snapshot of a student's work
- Records: commit SHA, documentation link, sprint summary
- System fetches diff metrics from GitHub automatically
- Can be pivoted (new repo URL introduced)
- Faculty can update the commit hash with permission

### Sprint Summary
- What was completed (checklist)
- What changed since last sprint
- Blockers
- Demo link (optional)

### Diff Metrics
- Total commits between sprints
- Files changed
- Lines added/removed
- New files, modified files, removed files
- Fetched from GitHub API, not entered by student

### Pivot
- When a student changes their project approach mid-way
- New repository URL becomes the baseline
- Previous sprints are marked as superseded
- Subsequent sprints compare against the new repo

---

## Key Interactions

### Student submits sprint
1. Opens assignment
2. Sees sprint timeline
3. Clicks "Submit" on next pending sprint
4. Fills in: repo URL (pre-filled), documentation link, sprint summary
5. Optionally checks "pivot" and enters new repo URL
6. Submits
7. System records commit SHA and fetches diff metrics from GitHub
8. Timeline updates with new sprint entry

### Faculty reviews in lab
1. Opens assignment detail
2. Sees list of students with sprint completion status
3. Clicks into a student
4. Reviews their sprint-by-sprint progress
5. Reads their summary and documentation
6. Notes diff metrics (commits, files changed)
7. Adds review notes in the portal
8. Optionally updates commit hash if the student's submission was buggy

### Faculty creates assignment
1. Clicks "New Assignment"
2. Fills in title, subject, description, deadline
3. Writes problem statement
4. Adds objectives, requirements, evaluation criteria
5. Selects which class teams to assign to
6. Submits

### Faculty onboard students
1. Clicks "Onboard Students"
2. Uploads CSV with roll numbers and emails
3. Selects class team
4. System matches emails to GitHub accounts
5. Reviews matched/unmatched list
6. Confirms — system sends org invites and adds to team

---

## External Integrations

### GitHub API
- Validate repository exists
- Fetch latest commit SHA for a repo
- Compare two commits (diff metrics)
- Manage org membership and teams
- Fork repos (legacy, being removed)

### Google Docs/Sheets
- Students link their documentation (no upload, just URL)
- Faculty clicks links to view

### GitHub OAuth
- Authentication via GitHub
- Session with access token for API calls

---

## Navigation Structure

```
Landing
├── Sign in with GitHub

Student (authenticated)
├── Assignments
│   └── Assignment Detail / Sprint Timeline
│       └── Submit Sprint (0 or N)
├── My Dashboard
└── Announcements

Faculty (authenticated)
├── Faculty Dashboard
├── Assignments
│   ├── Assignment List
│   │   └── Assignment Detail
│   │       └── Student Sprint Detail
│   └── Create Assignment
├── Review Submissions
├── Onboard Students
├── View Roster
├── Approve Requests
└── Request Animator Role
```

---

## Constraints

- No database — all data is in-memory, resets on server restart
- No file uploads — documentation is linked via Google Docs URLs
- Diff metrics are summary only — no inline code diffs shown to faculty
- Sprint count is fixed at 4
- Students can only see their own submissions
- Faculty sees all students across assigned teams
- Commit hash can be updated by faculty with validation (no duplicates)
- Pivots reset the diff baseline to the new repository
