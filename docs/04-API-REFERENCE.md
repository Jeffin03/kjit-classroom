# KJIT Classroom — API Reference

**Version:** 2.0 — **Date:** September 2026

All routes except `/api/auth/*` require an authenticated session (cookie).

---

## GET /api/auth/session

Returns current user session.

```json
{
  "user": { "name": "...", "email": "...", "image": "..." },
  "accessToken": "gho_...",
  "expires": "2026-10-01T00:00:00.000Z"
}
```

---

## GET /api/assignments

Returns hardcoded assignment list.

```json
[
  {
    "id": "pbl-01",
    "title": "Portfolio Website",
    "description": "Build a personal portfolio website...",
    "templateOwner": "kjit-classroom",
    "templateRepo": "portfolio-template",
    "deadline": "2026-09-30",
    "subject": "Web Development"
  }
]
```

---

## POST /api/fork

Fork a template repo to the authenticated user's account.

**Body:**
```json
{ "owner": "kjit-classroom", "repo": "portfolio-template" }
```

**Response:**
```json
{
  "fork": {
    "id": 123456789,
    "name": "portfolio-template",
    "full_name": "student-username/portfolio-template",
    "html_url": "https://github.com/student-username/portfolio-template",
    "fork": true,
    "parent": { "full_name": "kjit-classroom/portfolio-template" },
    "default_branch": "main"
  },
  "alreadyExisted": false
}
```

If fork already exists, returns it with `alreadyExisted: true`.

---

## POST /api/pr

Create a PR from a fork back to the template.

**Body:**
```json
{
  "templateOwner": "kjit-classroom",
  "templateRepo": "portfolio-template",
  "forkOwner": "student-username",
  "title": "My submission",
  "body": "Description of changes"
}
```

**Response:**
```json
{
  "pr": {
    "id": 987654321,
    "number": 42,
    "title": "My submission",
    "html_url": "https://github.com/kjit-classroom/portfolio-template/pull/42",
    "state": "open"
  }
}
```

---

## GET /api/pr?owner={owner}&repo={repo}

List pull requests for a repository.

**Query params:** `owner` (required), `repo` (required), `state` (optional: `open`/`closed`/`all`, default `all`)

---

## GET /api/roster

Returns current roster and teams.

```json
{
  "roster": [
    {
      "rollNo": "001",
      "githubUsername": "octocat",
      "email": "octocat@github.com",
      "team": "MCA-A-2025-27",
      "status": "active"
    }
  ],
  "teams": ["MCA-A-2025-27"]
}
```

---

## POST /api/roster

Upload CSV and optionally invite students to the org.

**Body:**
```json
{
  "csvContent": "roll_no,github_username,email,class\n001,octocat,octocat@github.com,MCA-A-2025-27",
  "autoInvite": true
}
```

**CSV columns detected by name matching:**
| Column | Detected by | Required |
|--------|------------|----------|
| roll_no | contains "roll" or "id" | Yes |
| github_username | contains "username" or "github" | Yes |
| email | contains "email" | No |
| class/team/batch | contains "team", "class", or "batch" | No |

**Response:**
```json
{
  "imported": 2,
  "invited": 1,
  "alreadyMember": 1,
  "total": 2,
  "errors": []
}
```

---

## GET /api/submissions

Returns all submissions.

```json
[
  {
    "studentUsername": "octocat",
    "assignmentId": "portfolio-template",
    "forkUrl": "https://github.com/octocat/portfolio-template",
    "prUrl": "https://github.com/kjit-classroom/portfolio-template/pull/42",
    "prNumber": 42,
    "status": "submitted",
    "submittedAt": "2026-09-02T12:00:00Z"
  }
]
```

**Status values:** `forked` → `submitted` → `reviewed` → `merged`

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
| 500 | GitHub API error |
