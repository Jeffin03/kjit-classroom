# KJIT Classroom — Data Models

**Version:** 2.0 — **Date:** September 2026

MVP uses in-memory JavaScript arrays. Data is lost on server restart. Production will use Supabase PostgreSQL.

---

## Assignment

```typescript
interface Assignment {
  id: string              // "pbl-01"
  title: string           // "Portfolio Website"
  description: string     // project description
  templateOwner: string   // GitHub org or user
  templateRepo: string    // template repo name
  deadline: string        // "2026-09-30"
  subject: string         // "Web Development"
}
```

Hardcoded in `src/lib/data.ts`. Three sample assignments.

---

## RosterEntry

```typescript
interface RosterEntry {
  rollNo: string                    // student roll number
  githubUsername: string            // GitHub username (unique key)
  email?: string                    // optional
  team?: string                     // e.g. "MCA-A-2025-27"
  status: "pending" | "invited" | "active"
}
```

Populated via CSV upload. `status` tracks onboarding progress.

---

## Submission

```typescript
interface Submission {
  studentUsername: string    // GitHub username
  assignmentId: string       // matches template repo name
  forkUrl: string           // URL to student's fork
  prUrl?: string            // URL to pull request
  prNumber?: number         // PR number
  status: "forked" | "submitted" | "reviewed" | "merged"
  submittedAt?: string      // ISO timestamp
}
```

Created on fork, updated on PR creation. `reviewed` and `merged` are set manually (no webhook yet).

---

## Entity relationships

```
Assignment ──1:N──▶ Submission ◀──N:1── RosterEntry

- One assignment has many submissions
- One student has many submissions
- Each submission links one student to one assignment
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_no VARCHAR(50) NOT NULL,
  github_username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  team VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_username VARCHAR(255) NOT NULL REFERENCES roster(github_username),
  assignment_id VARCHAR(255) NOT NULL,
  fork_url TEXT NOT NULL,
  pr_url TEXT,
  pr_number INTEGER,
  status VARCHAR(20) DEFAULT 'forked',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_username, assignment_id)
);

CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_roster_team ON roster(team);
```
