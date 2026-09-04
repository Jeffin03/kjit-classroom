# KJIT Classroom — Data Models

**Version:** 2.0 — **Date:** September 2026

MVP uses in-memory JavaScript arrays. Data is lost on server restart. Production will use Supabase PostgreSQL.

---

## Assignment

```typescript
interface Assignment {
  id: string                          // "pbl-01"
  title: string                       // "Portfolio Website"
  description: string                 // project description
  templateOwner: string               // GitHub org or user
  templateRepo: string                // template repo name
  deadline: string                    // "2026-09-30"
  subject: string                     // "Web Development"
  problemStatement: string            // detailed problem description
  objectives: string[]                // learning objectives
  requirements: string[]              // technical requirements
  evaluationCriteria: string[]        // grading rubric
  submissionGuidelines: string        // how to submit
  createdBy: string                   // teacher who created it
  createdAt: string                   // ISO timestamp
  updatedAt: string                   // ISO timestamp
}
```

Created via `/api/assignments` POST. System auto-generates GitHub repo with README.

---

## TeacherProfile

```typescript
interface TeacherProfile {
  id: string                          // "t_abc123"
  githubUsername: string              // GitHub username (unique key)
  email: string                       // college email
  role: "pending" | "animator" | "subject-teacher" | "elective-teacher"
  classes: string[]                   // ["MCA-A", "MCA-B"]
  approvedBy?: string                 // org owner username
  approvedAt?: string                 // ISO timestamp
  requestedAt: string                 // ISO timestamp
}
```

Created when teacher requests animator role. `role` changes from "pending" to "animator" on approval.

---

## RosterEntry

```typescript
interface RosterEntry {
  rollNo: string                      // student roll number
  collegeEmail: string                // college email (unique key)
  githubUsername?: string             // GitHub username (if matched)
  githubUserId?: number               // GitHub user ID
  classTeam: string                   // "MCA-A"
  status: "invited" | "active" | "no-account"
  onboardedBy: string                 // teacher username
  onboardedAt: string                 // ISO timestamp
}
```

Populated via 5-step onboarding wizard. `status` tracks onboarding progress.

---

## OnboardingSession

```typescript
interface OnboardingSession {
  id: string                          // session ID
  teacherId: string                   // teacher who initiated
  classTeam: string                   // target class team
  csvRows: { rollNo: string; collegeEmail: string }[]
  matched: {
    rollNo: string
    collegeEmail: string
    githubUsername: string
    githubAvatar: string
  }[]
  unmatched: { rollNo: string; collegeEmail: string }[]
  status: "uploading" | "matching" | "confirming" | "completed"
  createdAt: string                   // ISO timestamp
}
```

Tracks the state of an in-progress onboarding wizard.

---

## Submission

```typescript
interface Submission {
  id: string                          // "sub_abc123"
  studentUsername: string              // GitHub username
  assignmentId: string                 // matches assignment.id
  forkUrl: string                     // URL to student's fork
  prUrl?: string                      // URL to pull request
  prNumber?: number                   // PR number
  status: "forked" | "submitted" | "reviewed" | "accepted" | "merged"
  submittedAt?: string                // ISO timestamp
  reviewedBy?: string                 // teacher username
  reviewedAt?: string                 // ISO timestamp
}
```

Created on fork, updated on PR creation and review. `accepted` is set by teacher in review workflow.

---

## Entity relationships

```
Assignment ──1:N──▶ Submission ◀──N:1── RosterEntry
                                           │
TeacherProfile ──1:N──▶ OnboardingSession ─┘

- One assignment has many submissions
- One student has many submissions
- Each submission links one student to one assignment
- One teacher creates many onboarding sessions
- Each onboarding session creates many roster entries
```

---

## Production schema (Supabase)

```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  template_owner VARCHAR(255) NOT NULL,
  template_repo VARCHAR(255) NOT NULL,
  deadline TIMESTAMPTZ,
  subject VARCHAR(255),
  problem_statement TEXT,
  objectives JSONB DEFAULT '[]',
  requirements JSONB DEFAULT '[]',
  evaluation_criteria JSONB DEFAULT '[]',
  submission_guidelines TEXT,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE teacher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(30) DEFAULT 'pending',
  classes JSONB DEFAULT '[]',
  approved_by VARCHAR(255),
  approved_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_no VARCHAR(50) NOT NULL,
  college_email VARCHAR(255) UNIQUE NOT NULL,
  github_username VARCHAR(255),
  github_user_id INTEGER,
  class_team VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'invited',
  onboarded_by VARCHAR(255) NOT NULL,
  onboarded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_username VARCHAR(255) NOT NULL,
  assignment_id VARCHAR(255) NOT NULL,
  fork_url TEXT NOT NULL,
  pr_url TEXT,
  pr_number INTEGER,
  status VARCHAR(20) DEFAULT 'forked',
  submitted_at TIMESTAMPTZ,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(student_username, assignment_id)
);

CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_roster_team ON roster(class_team);
CREATE INDEX idx_roster_email ON roster(college_email);
```
