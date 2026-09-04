# KJIT Classroom — User Flows

**Version:** 2.0 — **Date:** September 2026

---

## Student journey

```
Receive invite (email from GitHub)
       │
       ▼
Accept GitHub org invite
       │
       ▼
Go to KJIT Classroom → Sign in with GitHub
       │
       ▼
Browse assignments (/assignments)
       │
       ▼
Click "Fork & Start"
  → Platform forks template to student's account
  → Fork appears in student's GitHub repos
       │
       ▼
Clone fork locally → work → commit → push
       │
       ▼
Open PR from fork to template repo
  → Platform records submission
  → Dashboard shows "PR Open" status
       │
       ▼
Faculty reviews on GitHub
  → Requests changes or approves
  → Merges PR
       │
       ▼
Dashboard updates to "Merged"
  → Project lives permanently on student's profile
  → Pin to GitHub profile → portfolio piece
```

---

## Faculty journey

### Setup (once)

```
Sign in → Faculty Dashboard (/faculty)
       │
       ▼
Click "Onboard Students" → /faculty/onboarding
       │
       ▼
Upload CSV (roll_no, github_username, email, class)
  → Preview first 5 rows
  → Toggle "Auto-invite to GitHub org"
  → Click "Import Roster"
       │
       ▼
Platform:
  → Imports all entries
  → Invites non-members to org via GitHub
  → Creates teams from "class" column
  → Adds students to their teams
       │
       ▼
View roster table with status:
  pending → invited → active
```

### Per assignment

```
Create template repo in org (starter code + README)
       │
       ▼
Add assignment to data.ts (id, title, deadline, template repo)
       │
       ▼
Students see it in /assignments → fork and work
       │
       ▼
Faculty monitors via Faculty Dashboard
  → Filter by assignment
  → See stats: total / forked / PR submitted / merged
  → Click PR links to review on GitHub
       │
       ▼
Review code → comment → merge or request changes
```

---

## Pages

| Route | Who | What |
|-------|-----|------|
| `/` | Anyone | Landing page, sign-in CTA |
| `/assignments` | Students | Browse templates, fork |
| `/dashboard` | Students | Track own submissions |
| `/announcements` | Anyone | News and updates |
| `/faculty` | Faculty | All submissions overview |
| `/faculty/onboarding` | Faculty | CSV upload + org invite |

---

## Navigation

```
KJIT Classroom (logo)
  ├── Assignments      (when signed in)
  ├── My Dashboard      (when signed in)
  ├── Announcements     (when signed in)
  ├── Faculty View      (when signed in)
  └── Sign in/out       (top right)
```
