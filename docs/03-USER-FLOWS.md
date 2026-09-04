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
Click "Start" → opens GitHub repo URL
  → Fork the repo to your account
  → Clone locally → work → commit → push
       │
       ▼
Open PR from fork to template repo
  → Platform records submission
  → Dashboard shows "Submitted" status
       │
       ▼
Faculty reviews code on GitHub
  → Reviews PR, leaves comments
  → Marks "Accepted" in KJIT Classroom
       │
       ▼
Dashboard updates to "Accepted"
  → Project lives permanently on student's profile
  → Pin to GitHub profile → portfolio piece
```

---

## Faculty journey

### Step 1: Request animator role

```
Sign in → Faculty (/faculty)
       │
       ▼
Click "Request Animator Role" → /faculty/request
       │
       ▼
Fill form:
  - College email (25mcab24@kristujayanti.com)
  - Class sections you teach
  - Reason for request
       │
       ▼
Submit → status: "pending"
       │
       ▼
Org owner sees request in /faculty/requests
  → Click "Approve" or "Deny"
       │
       ▼
If approved:
  → Teacher added as team maintainer on GitHub
  → Role changes to "animator"
  → Navbar shows full faculty access
```

### Step 2: Create assignment

```
/faculty/assignments/new
       │
       ▼
Fill form:
  - Title (e.g. "Portfolio Website")
  - Problem statement
  - Objectives (list)
  - Requirements (list)
  - Evaluation criteria (list)
  - Submission guidelines
  - Deadline
  - Subject
       │
       ▼
Submit → POST /api/assignments
  → System creates private GitHub repo in org
  → README auto-generated with all details
  → Assignment appears in student browser
```

### Step 3: Onboard students

```
/faculty/onboard
       │
       ▼
Step 1: Select class team (MCA-A, MCA-B, etc.)
       │
       ▼
Step 2: Upload CSV
  Columns: roll_no, college_email
  Example:
    25MCA001,25mca001@kristujayanti.com
    25MCA002,25mca002@kristujayanti.com
       │
       ▼
Step 3: Verify
  → System matches emails to GitHub accounts
  → Green checkmarks for matched accounts
  → Red X for unmatched (no GitHub account)
       │
       ▼
Step 4: Confirm
  → Click "Send Invites"
  → Matched students: invited to org + added to team
  → Unmatched: download CSV for manual outreach
       │
       ▼
Step 5: Summary
  → Invited: 25
  → Already members: 3
  → No GitHub account: 2
```

### Step 4: Review submissions

```
/faculty/review
       │
       ▼
See all submissions across your classes
  → Filter by assignment
  → See student name, status, PR link
       │
       ▼
Click "View on GitHub" → opens PR
  → Review code, leave comments
       │
       ▼
Click "Accept" in KJIT Classroom
  → Status changes to "Accepted"
  → Dashboard shows completion
```

---

## Pages

| Route | Who | What |
|-------|-----|------|
| `/` | Anyone | Landing page, sign-in CTA |
| `/assignments` | Students | Browse assignments, fork |
| `/dashboard` | Students | Track own submissions |
| `/announcements` | Anyone | News and updates |
| `/faculty` | Faculty | Dashboard with links to all features |
| `/faculty/request` | Teachers | Request animator role |
| `/faculty/requests` | Admins | Approve/deny teacher requests |
| `/faculty/onboard` | Faculty | 5-step student onboarding wizard |
| `/faculty/roster` | Faculty | View filtered student roster |
| `/faculty/review` | Faculty | Code review with accept workflow |
| `/faculty/assignments` | Faculty | View all assignments |
| `/faculty/assignments/new` | Faculty | Create new assignment |

---

## Navigation

```
KJIT Classroom (logo)
  ├── Assignments      (when signed in)
  ├── My Dashboard      (when signed in)
  ├── Announcements     (when signed in)
  ├── Faculty           (when signed in + org owner or approved animator)
  └── Sign in/out       (top right)
```

The "Faculty" link only appears for org owners and approved animators.
