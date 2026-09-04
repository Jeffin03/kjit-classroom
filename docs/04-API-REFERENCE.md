# KJIT Classroom — API Reference

**Version:** 2.0 — **Date:** September 2026

All routes except `/api/auth/*` require an authenticated session (cookie).

---

## Auth

### GET /api/auth/session

Returns current user session.

```json
{
  "user": { "name": "...", "email": "...", "image": "..." },
  "accessToken": "gho_...",
  "expires": "2026-10-01T00:00:00.000Z"
}
```

---

## Org Management

### GET /api/org/owners

Returns list of org owner usernames. Used to determine if user is admin.

```json
["murushr26", "rkumarh2008", "velmurugan4"]
```

### GET /api/org/teams

Returns list of org teams with member counts.

```json
[
  { "id": 123, "name": "MCA-A", "slug": "mca-a", "members_count": 45 }
]
```

---

## Teachers

### GET /api/teachers

Returns the current user's teacher profile.

```json
{
  "id": "t_abc123",
  "githubUsername": "murushr26",
  "email": "murushr26@kristujayanti.com",
  "role": "animator",
  "classes": ["MCA-A", "MCA-B"],
  "requestedAt": "2026-09-01T10:00:00Z"
}
```

### POST /api/teachers

Create or update teacher profile.

**Body:**
```json
{
  "email": "murushr26@kristujayanti.com",
  "role": "pending",
  "classes": ["MCA-A"]
}
```

---

## Teacher Requests

### GET /api/requests

Returns all pending teacher requests. Only accessible by org owners.

```json
[
  {
    "id": "t_abc123",
    "githubUsername": "newteacher",
    "email": "newteacher@kristujayanti.com",
    "role": "pending",
    "classes": ["MCA-C"],
    "requestedAt": "2026-09-02T10:00:00Z"
  }
]
```

### PUT /api/requests

Approve or deny a teacher request.

**Body:**
```json
{
  "githubUsername": "newteacher",
  "action": "approve"
}
```

Response:
```json
{ "success": true, "teacher": { "...approved teacher profile..." } }
```

---

## Assignments

### GET /api/assignments

Returns all assignments.

```json
[
  {
    "id": "pbl-01",
    "title": "Portfolio Website",
    "description": "Build a personal portfolio...",
    "templateOwner": "kristu-jayanti-institute-of-technology",
    "templateRepo": "portfolio-website",
    "deadline": "2026-09-30",
    "subject": "Web Development",
    "problemStatement": "Build a personal portfolio...",
    "objectives": ["Create responsive website", "Implement UI/UX"],
    "requirements": ["HTML5, CSS3, JavaScript", "Responsive design"],
    "evaluationCriteria": ["Design (25%)", "Responsiveness (25%)"],
    "submissionGuidelines": "Fork the template, build, submit PR",
    "createdBy": "murushr26",
    "createdAt": "2026-09-01T10:00:00Z",
    "updatedAt": "2026-09-01T10:00:00Z"
  }
]
```

### POST /api/assignments

Create a new assignment. Creates a private GitHub repo with auto-generated README.

**Body:**
```json
{
  "title": "Portfolio Website",
  "description": "Build a personal portfolio...",
  "deadline": "2026-09-30",
  "subject": "Web Development",
  "problemStatement": "Build a personal portfolio...",
  "objectives": ["Create responsive website", "Implement UI/UX"],
  "requirements": ["HTML5, CSS3, JavaScript", "Responsive design"],
  "evaluationCriteria": ["Design (25%)", "Responsiveness (25%)"],
  "submissionGuidelines": "Fork the template, build, submit PR"
}
```

**Response:**
```json
{
  "assignment": { "...created assignment..." },
  "repo": {
    "html_url": "https://github.com/org/portfolio-website",
    "clone_url": "https://github.com/org/portfolio-website.git",
    "name": "portfolio-website"
  }
}
```

---

## Onboarding

### POST /api/onboard/match

Match CSV emails to GitHub accounts.

**Body:**
```json
{
  "emails": ["25mca001@kristujayanti.com", "25mca002@kristujayanti.com"]
}
```

**Response:**
```json
{
  "matched": [
    { "email": "25mca001@kristujayanti.com", "githubUsername": "student1", "githubAvatar": "..." }
  ],
  "unmatched": ["25mca002@kristujayanti.com"]
}
```

### POST /api/onboard/invite

Send org invites and add to team.

**Body:**
```json
{
  "classTeam": "MCA-A",
  "matched": [
    { "email": "25mca001@kristujayanti.com", "githubUsername": "student1" }
  ]
}
```

**Response:**
```json
{
  "invited": 25,
  "alreadyMember": 3,
  "errors": []
}
```

---

## Roster

### GET /api/roster

Returns roster and teams.

```json
{
  "roster": [
    {
      "rollNo": "25MCA001",
      "collegeEmail": "25mca001@kristujayanti.com",
      "githubUsername": "student1",
      "classTeam": "MCA-A",
      "status": "active",
      "onboardedBy": "murushr26",
      "onboardedAt": "2026-09-01T10:00:00Z"
    }
  ],
  "teams": ["MCA-A", "MCA-B"]
}
```

### POST /api/roster

Upload CSV and optionally invite students.

**Body:**
```json
{
  "csvContent": "roll_no,college_email\n25MCA001,25mca001@kristujayanti.com",
  "classTeam": "MCA-A",
  "autoInvite": true
}
```

---

## Submissions

### GET /api/submissions

Returns all submissions.

```json
[
  {
    "id": "sub_abc123",
    "studentUsername": "student1",
    "assignmentId": "pbl-01",
    "forkUrl": "https://github.com/student1/portfolio-website",
    "prUrl": "https://github.com/org/portfolio-website/pull/42",
    "prNumber": 42,
    "status": "accepted",
    "submittedAt": "2026-09-15T12:00:00Z",
    "reviewedBy": "murushr26",
    "reviewedAt": "2026-09-16T10:00:00Z"
  }
]
```

### PUT /api/submissions/[id]

Update submission status (accept workflow).

**Body:**
```json
{
  "status": "accepted"
}
```

**Response:**
```json
{ "success": true }
```

**Status values:** `forked` → `submitted` → `reviewed` → `accepted` → `merged`

---

## Fork & PR

### POST /api/fork

Fork a template repo to the authenticated user's account.

**Body:**
```json
{ "owner": "org-name", "repo": "template-repo" }
```

**Response:**
```json
{
  "fork": { "...GitHub repo object..." },
  "alreadyExisted": false
}
```

### POST /api/pr

Create a PR from a fork back to the template.

**Body:**
```json
{
  "templateOwner": "org-name",
  "templateRepo": "template-repo",
  "forkOwner": "student-username",
  "title": "My submission",
  "body": "Description of changes"
}
```

### GET /api/pr?owner={owner}&repo={repo}

List pull requests for a repository. Query params: `owner` (required), `repo` (required), `state` (optional: `open`/`closed`/`all`)

---

## Errors

All errors return:
```json
{ "error": "message" }
```

| Code | Common cause |
|------|-------------|
| 400 | Missing required fields |
| 401 | No valid session |
| 403 | Not an org owner (for admin routes) |
| 500 | GitHub API error |
