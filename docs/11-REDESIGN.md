# KJIT Classroom — UI/UX Redesign · Design Doc for Figma Make

> **Purpose.** Single source of truth for the full visual + flow revamp. Build the Figma Make frames from this doc.
> **Companion to** `10-WIREFRAMES.md` (component-level Tailwind specs still apply where not contradicted here).
> **Scope of this pass:** design + IA + copy only. No code has been changed yet — §9 lists the backend gaps the design depends on.

---

## 0. Product truths (read before designing anything)

### 0.1 This is a SUBMISSION flow — NOT a fork / PR flow ⚠️

**State this explicitly on every surface where it could be misunderstood — landing page explainer, sign-in panel, sprint submit screen, and this doc for the Figma build.**

| It IS | It is NOT |
|---|---|
| Student creates **their own repo** and pastes the URL | ❌ Fork of a template/org repo |
| Student **submits** a sprint; the app snapshots the latest commit SHA | ❌ Opening a pull request |
| Faculty **review + notes + accept** on the snapshot | ❌ Merge / code review on a PR |
| Pivot = student starts a **new own repo** and re-submits | ❌ Branch switch / rebase |

**Copy guardrails — banned words in UI copy:** `fork`, `pull request`, `PR`, `merge`, `branch`, `upstream`, `clone template`.
**Approved vocabulary:** `submit`, `submission`, `sprint submission`, `your repo`, `repo URL`, `commit snapshot`, `review notes`, `accept`, `pivot`.

Canonical explainer string (use verbatim in the landing "How it works" section and as helper text on Sprint 0):

> **No forks, no pull requests.** You create your own GitHub repository, paste the URL, and KJIT Classroom snapshots your latest commit for faculty review. Your code stays in your account.

### 0.2 Post-login: everyone lands on a dashboard, customized to their role

There is **one entry point after auth — the dashboard** — rendered per role. No more landing on `/assignments`.

| Role | Lands on | Sees |
|---|---|---|
| Student (on roster) | `/dashboard` | Subject-grouped KPI dashboard |
| Unrostered signed-in user | `/dashboard` | "Not on roster" state (no Request access anywhere) |
| Subject / Elective / Animator teacher | `/faculty` → **Dashboard** | Class cards → assignments → students |
| Org owner (admin) | `/faculty` → **Dashboard (admin variant)** | Admin KPI strip + Requests + all class cards |

Changes: `/` when signed in redirects to `/dashboard` (was `/assignments`); sign-in `callbackUrl` default becomes `/dashboard` (was `/assignments`).

### 0.3 Announcements are dashboard modules — there is no Announcements page

- **Delete** the `/announcements` route, the nav link, and the standalone page.
- Announcements render as a **module/card on every role's dashboard** (student, faculty, admin), alongside the KPI cards.
- Keep the "Watch the announcements repo on GitHub for email" note *inside* the card footer.
- Data today is a hardcoded client array (`Student/Announcements.tsx`) — the design assumes a future `/api/announcements` (§9), but the frame only needs 3 items + states.

### 0.4 Removed entirely from the product

| Item | Reason |
|---|---|
| **"Request access" nav link** (currently shown to every non-faculty user, `Navbar.tsx:89`) | Decision: remove the whole teacher self-request surface. Owners onboard teachers directly via GitHub org teams. |
| `/faculty/request` page + form | Same |
| `/faculty/requests` **stays, owner-only** (approver queue) | This is the admin surface — keep, restyle |
| `/announcements` page + nav link | Folded into dashboards (§0.3) |
| Student navbar "Faculty" link duplication | Faculty never use the student navbar — see §1.3 |

---

## 1. Information architecture

### 1.1 The two shells

**Shell A — Student shell** (top navbar, no sidebar)
`Dashboard · Assignments · [Class badge] · Avatar menu`

**Shell B — Faculty/Admin shell** (left sidebar, existing `FacultyShell`)
`Dashboard · Review · Roster · Onboard · Requests(owner only)` + footer `Switch to student view`

```
┌──────────────────────────────────────────────────────────────────────┐
│ Shell A — Student                          (h-16 sticky top navbar) │
│ ┌──────┬─────────────┬──────────────┬─────────────┬──────┬────────┐ │
│ │ K KJIT│ Dashboard  │ Assignments  │ MCA-A-2025… │  😎 ▾│Sign out│ │
│ └──────┴─────────────┴──────────────┴─────────────┴──────┴────────┘ │
│                                                                    │
│  REMOVED from navbar: "Announcements", "Request access",           │
│  "Faculty" (faculty never see this shell)                          │
└──────────────────────────────────────────────────────────────────────┘

┌────────────┬─────────────────────────────────────────────────────────┐
│ Shell B — Faculty / Admin                (fixed w-64 sidebar)       │
│ ┌────────┐ │  topbar: hamburger(mobile) · page title · role label   │
│ │ K Fac. │ │                                                        │
│ │Dashboard│ │  content: max-w-6xl                                    │
│ │Review   │ │                                                        │
│ │Roster   │ │                                                        │
│ │Onboard  │ │                                                        │
│ │Requests*│ │  *owner only                                           │
│ │─────────│ │                                                        │
│ │Student  │ │                                                        │
│ │ view ▸  │ │                                                        │
│ └────────┘ │                                                        │
└────────────┴─────────────────────────────────────────────────────────┘
```

### 1.2 Route map (old → new)

| Old route | New route | Note |
|---|---|---|
| `/` (signed-in) → `/assignments` | `/` (signed-in) → `/dashboard` | §0.2 |
| `/signin` default callback | `/dashboard` | §0.2 |
| `/dashboard` | `/dashboard` | **Student dashboard rebuilt** (§5) |
| `/assignments` | `/assignments` | Rebuilt with subject grouping (§5.2) |
| `/assignments/submit`, `/assignments/timeline` | unchanged URLs | Restyled + copy guardrails (§5.3) |
| `/announcements` | ❌ → redirect `/dashboard#announcements` | §0.3 |
| `/faculty` | `/faculty` | **Rebuilt as class-card dashboard** (§6.1) |
| ❌ new | `/faculty/class/[team]` | Class detail: assignment cards (§6.2) |
| `/faculty/assignments/[id]` | unchanged URL | Rebuilt: student **cards** (§6.3) |
| `/faculty/assignments` | ❌ → redirect `/faculty` | Assignments reached via class drill-down |
| `/faculty/assignments/new` | `/faculty/assignments/new` | Keep; add breadcrumb |
| `/faculty/review` | unchanged | Restyled (§6.4) |
| `/faculty/roster` | unchanged | + Remove-student action (§6.5) |
| `/faculty/onboard` | unchanged | Keep wizard |
| `/faculty/requests` | unchanged (owner-only) | Restyled (§6.7) |
| `/faculty/request` | ❌ → redirect `/` | Removed (§0.4) |

### 1.3 The drill-downs (core of the redesign)

```
FACULTY / ADMIN                      STUDENT
─────────────────                    ──────────────────────
Dashboard                            Dashboard
 └ KPI strip + Announcements          └ KPI strip + Announcements
 └ Class cards (one per class)        └ Subject sections
     └ Class detail                       └ Assignment cards
         └ Assignment cards (per subject)     └ Sprint timeline / submit
             └ Student cards
                 └ Sprint detail / review
```

- **Teachers are never flat.** A teacher handling 3 classes × N subjects sees 3 class cards, not one merged list.
- **Students are subject-first.** A student sees `Web Development → [Portfolio Website, …]`, not one flat feed.

---

## 2. Design system

### 2.1 Tokens (unchanged — already in `globals.css`)

```
canvas   #FAFAF9     ink        #18181B     ink-muted #52525B
ink-faint #A1A1AA    border     #E4E4E7
accent   #4338CA     accent-soft #EEF2FF    accent-hover #372FA8
success  #059669 (+soft #ECFDF5)   caution #B45309 (+soft #FFFBEB)
danger   #DC2626 (+soft #FEF2F2)   reviewed #6D28D9 (+soft #F5F3FF)
font-sans  Inter            font-mono  JetBrains Mono (commit SHAs, diffs)
radius     cards 2xl (16px) · buttons/inputs lg (8px) · pills full
motion     .card-interactive — 150ms shadow + −1px lift. Nothing else moves.
```

Light-only. No dark mode. One accent hue; status color only encodes status.

### 2.2 Component library (build these as Figma components first)

**A. KPI Card** — used on every dashboard, class detail, assignment detail.

```
┌──────────────────────────────────────────────┐
│  bg-white border border-[var(--color-border)]│
│  rounded-2xl p-5 min-h-[7rem]                │
│  card-interactive (if clickable)             │
│                                              │
│  ┌──────────────────────────┐  ┌───────────┐ │
│  │ flex items-center gap-2  │  │ icon 16px │ │
│  │ text-xs font-medium      │  │ accent-soft│ │
│  │ uppercase tracking-wide  │  │  rounded-lg│ │
│  │ text-[var(--color-ink-faint)]            │ │
│  └──────────────────────────┘  └───────────┘ │
│  mt-3 text-3xl font-semibold tracking-tight  │
│  value — tone color (neutral|accent|success|  │
│         caution|danger)                      │
│  mt-1 text-xs text-[var(--color-ink-muted)]   │
│  hint line (max 1 line)                      │
│  optional mt-3 text-xs accent link →  ›      │
└──────────────────────────────────────────────┘
Props: label, value, hint, tone, icon, to
```

**B. Announcement Card / module**

```
┌──────────────────────────────────────────────┐
│ bg-white border rounded-2xl overflow-hidden  │
│ header: bg-[var(--color-accent-soft)] px-5   │
│   py-3 flex justify-between                  │
│   🔔 "Announcements" text-sm font-semibold    │
│   text-xs accent "3 new" badge               │
│ ─────────────────────────────────────────    │
│ list, divide-y:                              │
│  ┌─ px-5 py-4 ────────────────────────────┐  │
│  │ flex gap-3                              │  │
│  │ ● status-dot--review (unread)          │  │
│  │ col:                                    │  │
│  │  text-sm font-medium title             │  │
│  │  text-xs ink-muted content (2-line      │  │
│  │     clamp)                              │  │
│  │  text-xs ink-faint · date · author      │  │
│  └────────────────────────────────────────┘  │
│ footer: px-5 py-3 bg-canvas text-xs muted     │
│   "Watch the Announcements repo on GitHub     │
│    to get email notifications."               │
└──────────────────────────────────────────────┘
States: empty ("No announcements yet"), loading (3 pulse rows)
```

**C. Class Card** (faculty/admin dashboard)

```
┌────────────────────────────────────────────────────────┐
│ bg-white border rounded-2xl p-6 card-interactive       │
│                                                        │
│ row:                                                   │
│  ┌──────────────┐  ┌───────────────────────────────┐   │
│  │ 40×40 tile   │  │ flex-1 min-w-0                │   │
│  │ accent-soft  │  │ text-base font-semibold title │   │
│  │ rounded-xl   │  │ text-xs ink-muted subject list│   │
│  │ 🏫 / initial │  └───────────────────────────────┘   │
│  └──────────────┘  chevron (ink-faint)                 │
│                                                        │
│ mt-5 grid grid-cols-4 gap-2 — mini stats:              │
│   [Students] [Assignments] [In progress] [To review]   │
│   each: text-lg font-semibold + text-[10px] uppercase  │
│          label ink-faint                                │
│ mt-4 pt-4 border-t flex justify-between text-xs:        │
│   "3 subjects · 2 live assignments"      "Open ›"      │
└────────────────────────────────────────────────────────┘
```

**D. Assignment Card v2** (student + faculty)

```
┌──────────────────────────────────────────────────────────┐
│ bg-white border rounded-2xl p-6 card-interactive         │
│ row 1: [subject pill accent-soft] [deadline pill]        │
│        ……                                    status pill │
│ row 2: text-lg font-semibold title                       │
│ row 3: text-sm ink-muted description (2-line clamp)      │
│ row 4: flex items-center gap-4 text-xs ink-faint         │
│        📅 Due 12 Oct    ·    Sprint 0–3                  │
│ row 5 (student): ChecklistProgress + "2/4 sprints"       │
│ row 5 (faculty):  "18/24 submitted" + ChecklistProgress  │
│ footer right: primary btn (Start Sprint 1 / View /       │
│        Open review)                                      │
└──────────────────────────────────────────────────────────┘
```

**E. Student Card** (assignment detail — replaces the flat table)

```
┌──────────────────────────────────────────────────────┐
│ bg-white border rounded-2xl p-5 card-interactive     │
│                                                      │
│ row:                                                 │
│  avatar 40px circle · col:                           │
│    text-sm font-medium rollNo / @username            │
│    text-xs ink-muted github link                     │
│  ……right: StatusPill (In progress / Awaiting /       │
│                Accepted)                             │
│                                                      │
│ mt-4 flex gap-1.5 — SprintPill ×4:  0 1 2 3          │
│ mt-3 ChecklistProgress current/total                 │
│ mt-2 text-xs ink-faint: "Last commit a1b2c3d · 2d"   │
│        + "Pivoted" pill if applicable                │
│                                                      │
│ mt-4 pt-4 border-t flex gap-2 justify-end:           │
│   [ghost: Open]   [outline: Notes]  [accent: Accept] │
└──────────────────────────────────────────────────────┘
Grid: sm:grid-cols-2 xl:grid-cols-3 · gap-4
States: skeleton, no-submission variant (dashed border,
        "Not started · Nudge" muted), accepted (success tint ring)
```

**F. Confirm Modal** (first modal in the product — required for Remove student)

```
overlay: fixed inset-0 bg-black/40 z-50 grid place-items-center p-4
┌────────────────────────────────────────┐
│ bg-white rounded-2xl p-6 w-full        │
│ max-w-md shadow-xl                     │
│                                        │
│ icon tile 40px danger-soft  🗑          │
│ mt-4 text-lg font-semibold             │
│   Remove {rollNo} from {class}?        │
│ mt-2 text-sm ink-muted                 │
│   They lose access to this class's     │
│   assignments and submissions stay     │
│   on record. This can't be undone      │
│   from here.                           │
│                                        │
│ mt-6 flex gap-3 justify-end            │
│  [ghost: Cancel]  [danger: Remove]     │
└────────────────────────────────────────┘
Esc closes · focus trap · destructive btn = danger fill
```

**G. Breadcrumb** (new — every drill-down level)

```
text-sm flex items-center gap-2
Dashboard › MCA-A-2025-26 › Portfolio Website
ink-muted      ink-muted          ink (font-medium)
hover:accent   hover:accent       none
```

**H. Empty state** — centered icon (ink-faint, 48px) + `text-sm ink-muted` line + accent text-link CTA. One pattern everywhere.

**I. Skeleton** — `animate-pulse rounded-2xl bg-[var(--color-border)]`; standardize heights: KPI `h-28`, card `h-24`, list row `h-16`.

---

## 3. Landing page (`/`)

### 3.1 Section order

1. Sticky top nav
2. Hero (2-column: copy left, product visual right)
3. How it works — 4-step sprint strip + **submission-flow callout**
4. Feature grid (3 cards, refactored copy)
5. Who it's for — 3 role cards (Student / Faculty / Admin)
6. Closing CTA band
7. Footer (new — the app has no footer today)

### 3.2 Exact copy

**Nav:** `K KJIT Classroom` · right: `How it works` `Features` `Sign in with GitHub` (dark pill). When signed in → `Open dashboard`.

**Hero**
```
Eyebrow (pill, accent-soft/accent, text-xs, uppercase):
  GITHUB-NATIVE PBL

H1 (text-5xl/6xl font-semibold tracking-tight, ink):
  Your repo. Real work.
  A portfolio that outlives the course.

Sub (text-lg ink-muted, max-w-xl):
  KJIT Classroom runs project-based learning the way real teams
  work — you build in your own GitHub repository, submit at every
  sprint, and faculty review your actual commits and documentation
  while you can still act on the feedback.

CTAs:
  [Sign in with GitHub]  (ink fill, GitHub mark, px-8 py-4 rounded-xl)
  [See how it works →]   (ghost, scrolls to #how-it-works)

Trust line (text-xs ink-faint):
  Built for KJIT University · Sprint 0 → Sprint 3 · Your code stays in
  your GitHub account
```

**Hero visual (right):** a stylized **sprint timeline card** — not a screenshot dump:

```
┌──────────────────────────────────────────┐
│ bg-white border rounded-2xl shadow-lg    │
│ header: Portfolio Website · Web Dev      │
│ ────────────────────────────────────     │
│ ●─●─○─○   Sprint progress               │
│ Sprint 0  Abstract        ✓ Reviewed     │
│ Sprint 1  Core build      ✓ Reviewed     │
│ Sprint 2  Iteration       ● In review    │
│ Sprint 3  Ship            ○ Not started  │
│ ────────────────────────────────────     │
│ commit a1b2c3d · +412 −87 · 12 files     │   ← mono
└──────────────────────────────────────────┘
```

**How it works (`id="how-it-works"`)** — 4 steps, horizontal on desktop:

```
[1 Create your repo]  [2 Submit Sprint 0]  [3 Commit & submit
 Your own GitHub        repo URL + abstract   each sprint, or pivot
 repo, no templates.    doc link.             to a new repo.]
                                        [4 Faculty review
                                         notes + diff metrics
                                         at every sprint.]
```

Beneath the steps, full-width callout (accent-soft bg, accent left border, rounded-xl p-5):

> **No forks. No pull requests.** You never merge anything. You create your own repository, paste the URL, and we snapshot your latest commit for faculty review — then do it again next sprint.

**Feature grid (refactored from current copy):**

| Card | Title | Body |
|---|---|---|
| 1 | **Student-owned repos** | Your code lives in your GitHub account — not ours. Pin the repos, keep them after graduation, show them in interviews. |
| 2 | **Sprint 0 → Sprint 3** | Four checkpoints per project: abstract, build, iterate, ship. Commit, document, and pivot on feedback like a real product team. |
| 3 | **Reviewed at every sprint** | Faculty leave notes on your commits and diff metrics as you go — feedback while it still counts, not a grade at the end. |

**Who it's for:**

| Students | Teachers | Admins |
|---|---|---|
| Track every sprint, get reviewed early, graduate with a pinned portfolio. | Teach multiple classes in one place — class cards, per-assignment views, per-student sprint cards. | Onboard rosters by CSV, approve teacher access, watch org-wide progress. |

**Closing CTA:** `Ready to submit your first sprint?` + `[Sign in with GitHub]`

**Footer:** `KJIT Classroom` · `How it works` · `Sign in` · `© 2026 KJIT University` · note: `Not affiliated with GitHub, Inc.`

### 3.3 Behaviour

- Signed in → hero CTA becomes `[Open dashboard]` → `/dashboard`; nav shows `Open dashboard`.
- Loading session → skeleton pill (`h-12 w-64`).
- Mobile: hero stacks (copy first, visual below), 4-step strip becomes vertical stepper, features 1-col.

---

## 4. Sign-in (`/signin`)

Full-screen, **no top navbar** (today the student navbar still renders above it — remove).

### 4.1 Layout — left brand hero, right sign-in card

```
┌─────────────────────────┬───────────────────────────────┐
│ LEFT  lg:w-[55%]        │ RIGHT lg:w-[45%]              │
│ bg-[var(--color-ink)]   │ bg-[var(--color-canvas)]      │
│ text-white p-12         │ grid place-items-center       │
│ min-h-screen            │ p-8                           │
│ flex flex-col justify-  │                               │
│   between               │   ┌─────────────────────────┐ │
│                         │   │ max-w-sm w-full          │ │
│ top:                    │   │ bg-white border rounded- │ │
│  K tile (accent)        │   │ 2xl p-8 shadow-sm        │ │
│  mt-6 text-3xl font-    │   │                         │ │
│  semibold "KJIT         │   │ 🐙 40px GitHub mark      │ │
│  Classroom"             │   │ mt-5 text-xl font-       │ │
│  mt-3 text-white/60     │   │ semibold "Sign in to     │ │
│  "Project-based         │   │  KJIT Classroom"         │ │
│  learning, on GitHub."  │   │ mt-2 text-sm ink-muted   │ │
│                         │   │ "Use the GitHub account   │ │
│ middle: sprint stepper  │   │  you'll use for your     │ │
│  vertical, white/20     │   │  class repositories."    │ │
│  connector line:        │   │                         │ │
│   ● Sprint 0  Abstract  │   │ mt-6 w-full min-h-11     │ │
│   ● Sprint 1  Build     │   │ bg-[var(--color-ink)]    │ │
│   ○ Sprint 2  Iterate   │   │ text-white rounded-lg    │ │
│   ○ Sprint 3  Ship      │   │ flex items-center        │ │
│  active = accent fill,  │   │ justify-center gap-3     │ │
│  future = white/30 ring │   │ "Sign in with GitHub"    │ │
│                         │   │                         │ │
│ bottom:                 │   │ mt-4 text-xs ink-faint   │ │
│  text-white/40 text-xs  │   │ centered, 2 lines:       │ │
│  "Read-only access. Your│   │ "Read-only access so      │ │
│   token stays on our    │   │  faculty can review your  │ │
│   servers."             │   │  work. Your access token  │ │
│                         │   │  stays on our servers."  │ │
│                         │   │ ────────────────────────  │ │
│                         │   │ mt-4 text-center text-xs │ │
│                         │   │ "← Back to home" (muted)  │ │
│                         │   └─────────────────────────┘ │
└─────────────────────────┴───────────────────────────────┘
```

### 4.2 States

- **Error banner** inside card, above button: `danger-soft` bg, `danger-text` copy — map `AccessDenied`, `OAuthAccountNotLinked`, `Callback`, `Configuration`, `Default` (keep existing `ERROR_MESSAGES`).
- **Mobile:** left panel becomes a compact 200px brand header (logo + headline only, stepper hidden), card below.
- Copy on left panel value list (3 short lines, white/70): `Your repos, your account` · `Reviewed at every sprint` · `Portfolio built by doing`.

---

## 5. Student experience (`/dashboard`, `/assignments`)

### 5.1 Student dashboard — subject-wise, KPI + announcements

```
┌─ Shell A ──────────────────────────────────────────────────────┐
│                                                                │
│  text-2xl font-semibold  Good evening, {firstName}             │
│  text-sm ink-muted  MCA-A-2025-26 · Spring semester            │
│                                                                │
│  ── KPI row (4-up) ────────────────────────────────────────    │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────┐     │
│  │ ACTIVE    │ │ DUE SOON  │ │ REVIEWED  │ │ ACCEPTED    │     │
│  │ PROJECTS  │ │ SPRINTS   │ │ FEEDBACK  │ │ PROJECTS    │     │
│  │ 2         │ │ 1         │ │ 3         │ │ 1           │     │
│  │ in 2      │ │ Portfolio │ │ notes from│ │ done &      │     │
│  │ subjects  │ │ Website   │ │ faculty   │ │ signed off  │     │
│  │     ›     │ │ see all › │ │           │ │             │     │
│  └───────────┘ └───────────┘ └───────────┘ └─────────────┘     │
│                                                                │
│  ── two-column region (lg:grid-cols-3, content 2 / rail 1) ──  │
│  ┌─ main col ──────────────────────────┐ ┌─ rail (sticky) ──┐  │
│  │                                     │ │ ANNOUNCEMENTS    │  │
│  │ SUBJECT SECTION: Web Development    │ │ (module B)       │  │
│  │  text-xs uppercase ink-faint + rule │ │                  │  │
│  │  ┌ Assignment Card ┐ ┌ Card ┐       │ │ ● New: Portfolio │  │
│  │  │ Portfolio Website│ │ Task…│       │ │   Website is     │  │
│  │  └─────────────────┘ └──────┘       │ │   live · 2 Sep   │  │
│  │                                     │ │ ● GitHub setup   │  │
│  │ SUBJECT SECTION: Backend Development│ │   guide · 1 Sep  │  │
│  │  ┌ Assignment Card ┐                │ │ [Watch repo →]   │  │
│  │  └─────────────────┘                │ ├──────────────────┤ │
│  │                                     │ │ UP NEXT          │  │
│  │ SUBJECT SECTION: Data Science       │ │ Sprint 2 due     │  │
│  │  ┌ Assignment Card ┐                │ │ 12 Oct · Portfolio│ │
│  │  └─────────────────┘                │ │ Website          │  │
│  │                                     │ │ [Submit sprint →]│ │
│  └─────────────────────────────────────┘ └──────────────────┘  │
│                                                                │
│  ── Your submissions (full-width, below) ──────────────────    │
│  SubmissionCard list (existing component, restyled 2xl radius) │
└────────────────────────────────────────────────────────────────┘
```

**Rules**
- Group assignments by `assignment.subject`, alphabetically; subject header = `text-xs uppercase tracking-wide` + hairline rule + count pill (`3 assignments`).
- Every subject section shows its assignment cards even if no submission exists yet.
- Announcements module lives in the right rail on desktop, **above KPIs? No — below KPIs, above subject sections** on mobile (`order` swap).
- "Up Next" card = nearest deadline sprint (mono date), CTA straight into the submit screen.

### 5.2 Assignments (`/assignments`)

- Add a sticky **subject filter chip row** (`All · Web Development · Backend Development · Data Science`) under the page header; cards grouped by subject below (same section header pattern as §5.1).
- Header: `Assignments` / `Every project is submitted sprint by sprint from your own repo.`
- Card CTA: has submission → `View timeline →`; none → `Start Sprint 0 →`.
- Empty/unrostered states keep current copy, restyled to §2.2-H.

### 5.3 Sprint submission flow — copy guardrails

**Sprint 0 screen** — add a persistent helper panel above the form (accent-soft, rounded-xl):

> **How this works** — Create a *new repository in your own GitHub account*, paste its URL below, and attach your abstract doc. No fork, no pull request: faculty review a snapshot of your commit.

Form field labels (keep, tighten):
- `Your repository URL *` + placeholder `https://github.com/your-username/your-project`
- helper: `Must be a repo you own — not a fork, not an org template.`
- `Abstract / synopsis link *`

**Sprint 1–3 screen** — banner:
> Submitting Sprint {N}. We'll snapshot your repo's latest commit — you don't copy any hash by hand.

**Pivot toggle** — copy: `I'm starting over in a new repository` → reveals `New repository URL` + helper `Your previous repo link stays attached to earlier sprints for the record.`

**Timeline screen** — keep vertical `SprintRow`s; label Sprint 0 as `Abstract`; every row shows commit SHA in mono + diff metrics; footer note: `Submissions, not pull requests — review happens here, on your snapshot.`

### 5.4 Unrostered state

Keep existing copy ("You're not on the class roster yet…" + Check again). **Do not** add any request-access CTA — the only actions are `Check again` and `Sign out`. Footer line: `Think you should be on the list? Ask your class teacher to onboard you.`

---

## 6. Faculty experience (drill-down)

### 6.1 Faculty dashboard — class cards first

```
┌─ Shell B ─────────────────────────────────────────────────────┐
│ topbar: Dashboard        [role: Subject teacher]  😎 Sign out │
│                                                                │
│  Faculty Dashboard (admin variant: "Admin Dashboard")          │
│  text-sm ink-muted: Your classes at a glance                  │
│  right: [+ New Assignment]  [Open review queue]               │
│                                                                │
│  ── ADMIN STRIP (owner only) ──────────────────────────────    │
│  ┌ PENDING TEACHER REQUESTS ┐ ┌ ORG STUDENTS ┐ ┌ CLASSES ┐     │
│  │ 2 · review ›             │ │ 96 · 3 teams │ │ 3       │     │
│  └──────────────────────────┘ └──────────────┘ └─────────┘     │
│                                                                │
│  ── KPI row (4-up) ────────────────────────────────────────    │
│  [STUDENTS 74] [LIVE ASSIGNMENTS 4] [TO REVIEW 12]             │
│  [ACCEPTED THIS WEEK 9]   ← all clickable →                   │
│                                                                │
│  ── Announcements module (same component as student,          │
│     with a "New announcement" composer row for owners) ──      │
│                                                                │
│  Your classes                                                    │
│  ┌ ClassCard MCA-A ┐ ┌ ClassCard MCA-B┐ ┌ ClassCard MCA-C ┐     │
│  └─────────────────┘ └────────────────┘ └─────────────────┘     │
│                                                                │
│  ── Recent submissions (last 7 days, compact table) ───────    │
│  student · class · assignment · sprint · time · [Review]       │
└────────────────────────────────────────────────────────────────┘
```

- Class cards are **the** navigation. No flat assignment dropdown table as the primary view (the old `selectedAssignment` `<select>` table is demoted to this compact recent list).
- Scoped teachers see only their `classes`; animators/owners see all org teams.
- Empty scope ("no classes assigned"): empty state — `You haven't been assigned a class yet. An org owner assigns classes from GitHub teams.`

### 6.2 Class detail — `/faculty/class/[team]`

```
BREADCRUMB: Dashboard › MCA-A-2025-26

Header: MCA-A-2025-26        [+ New Assignment]  [Manage roster]
text-sm: 3 subjects · 24 students · 4 assignments

KPI row: [STUDENTS 24] [ASSIGNMENTS 4] [IN PROGRESS 9] [TO REVIEW 6]

SUBJECT SECTION: Web Development
 ┌ AssignmentCard ┐ ┌ AssignmentCard ┐        (faculty variant:
 └────────────────┘ └────────────────┘         submitted/total)
SUBJECT SECTION: Backend Development
 ┌ AssignmentCard ┐
 └────────────────┘

(no assignments → empty state + "Create your first assignment")
```

### 6.3 Assignment detail — `/faculty/assignments/[id]` → **student cards**

```
BREADCRUMB: Dashboard › MCA-A-2025-26 › Portfolio Website

Header: title · description  [Edit] [Open review]
meta pills: subject · Sprint 0–3 · Due 12 Oct · assigned classes

KPI row: [STUDENTS 24] [IN PROGRESS 9] [ACCEPTED 12] [NOT STARTED 3]

toolbar: [search student] [status filter ▾] [grid | table toggle]

StudentCard grid (§2.2-E) — sm:2 / xl:3 up
  ✓ default view is CARDS; table view retained as an opt-in
    toggle for bulk scanning (accessibility/long rosters)
```

### 6.4 Review queue (`/faculty/review`) — keep, tighten

- Header + KPI tiles stay (Total / Awaiting / Partially reviewed / Accepted) → convert the 4 inline tiles to the shared KPI Card (§2.2-A).
- Filters: class ▾ (new) → assignment ▾ → status ▾ (cascading).
- Cards unchanged in behavior: per-sprint notes, commit links, diff metrics, `Save notes`, `Accept`.
- Add `Accept all` at queue header with Confirm Modal (§2.2-F) since it's bulk + irreversible-ish.

### 6.5 Roster (`/faculty/roster`) + **Remove student (new)**

```
Header: Student Roster        [+ Onboard students]
KPI row (shared cards): [TOTAL 74] [ACTIVE 68] [INVITED 4] [NO GITHUB 2]
toolbar: [search] [class ▾]

Table row actions (last column, NEW):
┌────────────────────────────────────────┬──────────┐
│ rollNo · email · @github · class ·     │  ⋯  ▾    │
│ status pill · onboarded by             │          │
└────────────────────────────────────────┴──────────┘
dropdown menu:  Open GitHub profile · Remove from class

Remove → Confirm Modal (§2.2-F):
  "Remove {rollNo} from {class}?"
  "They lose access to this class's assignments. Past submissions
   stay on record. This can't be undone from here."
  [Cancel] [Remove — danger]
→ toast: "{rollNo} removed from MCA-A-2025-26" (first toast in
  the product — spec: fixed bottom-right, ink bg, white text,
  auto-dismiss 4s, with Undo (re-add) for 4s)
```

Gating: `roster.write` capability (owner + animator + subject-teacher; **elective teachers read-only**). Row menu hidden without it.

### 6.6 Onboard (`/faculty/onboard`)

Keep the 5-step wizard. Changes: add breadcrumb `Dashboard › Roster › Onboard`, convert step-5 result tiles to shared KPI Cards, and add a final `Back to roster` button.

### 6.7 Requests (`/faculty/requests`, owner only)

Restyle pending items as cards with: avatar, `@username`, email, requested class chips, role select, `[Approve]` `[Deny]`. Empty state: `No pending requests.` — with helper `Teachers are onboarded by org owners directly; this queue only shows role-change requests.` **The student-facing counterpart (`/faculty/request`) no longer exists (§0.4).**

---

## 7. Admin / org owner dashboard

Owner uses Shell B with the **admin variant** of §6.1:

1. **Admin strip** (top, owner-only): Pending teacher requests · Org students · Classes · Roster health (no GitHub account count).
2. KPI row + Announcements + class cards + recent submissions (shared with faculty).
3. Sidebar gains `Requests` (already `teacher.approve`-gated) with a **count badge** when pending > 0.
4. Owner-only danger zone (new, in sidebar footer → `/faculty/settings`): none required this pass — out of scope, listed for later.

There is no separate `/admin` route — admin = faculty shell + admin strip, so the "land on the dashboard" rule (§0.2) holds for all three roles.

---

## 8. KPI matrix — where every card goes

| Screen | KPI cards |
|---|---|
| Student dashboard | Active projects · Due-soon sprints · Review feedback · Accepted projects |
| Faculty dashboard | Students · Live assignments · To review · Accepted this week |
| Admin strip (owner) | Pending requests · Org students · Classes · Roster health |
| Class detail | Students · Assignments · In progress · To review |
| Assignment detail | Students · In progress · Accepted · Not started |
| Review queue | Total submissions · Awaiting review · Partially reviewed · Accepted |
| Roster | Total students · Active · Invited · No GitHub account |
| Onboard (step 5) | Added to team · Invites sent · Already members · No account |
| Admin announcements composer | — (module, not KPI) |

Rule: **one KPI row per screen max**; every KPI card is either neutral info or clickable to the filtered list it counts.

---

## 9. Backend gaps the design depends on (for the implementation pass)

| # | Gap | Needed by |
|---|---|---|
| 1 | `DELETE /api/roster` (remove entry by rollNo + classTeam) + GitHub team member removal | §6.5 Remove student |
| 2 | Announcements store + `GET /api/announcements` (today: hardcoded array in `Student/Announcements.tsx`) | §0.3 dashboard modules |
| 3 | Delete `/faculty/request` page, `teacher.request` UI, and the navbar link | §0.4 |
| 4 | Delete `/announcements` route + proxy matcher entry; add redirect | §0.3 |
| 5 | Redirect `/faculty/assignments` → `/faculty`, add `/faculty/class/[team]` route | §1.2 |
| 6 | Class-level rollups (students + assignments + pending-review counts per `classTeam`) — currently computed client-side per page | §6.1 ClassCard |
| 7 | Default post-login landing → `/dashboard` (`Home.tsx:14`, `signin/page.tsx` callback) | §0.2 |
| 8 | Optional: `POST /api/announcements` for owner composer (admin variant) | §7 |

---

## 10. Voice & copy deck

**Voice:** plain, encouraging, professional — like a good tech lead, not a brochure.

| Surface | Do | Don't |
|---|---|---|
| Anywhere | "Submit your sprint", "your repository", "review notes" | "fork", "pull request", "PR", "merge" (§0.1) |
| Landing | Outcome-led: portfolio, feedback, real workflow | Buzzwords: "leverage", "synergy", "empower" |
| Empty states | Say why + one action | "No data." |
| Destructive | Name the object: "Remove 21BCS1234 from MCA-A" | "Delete?" |
| Faculty | "class", "subject", "student", "submission" | "section", "learner", "artifact" |

Standard strings:
- `Sign in with GitHub`
- `Open dashboard`
- `Submit Sprint {n}`
- `Review notes` / `Accept submission`
- `No forks, no pull requests.` (§0.1)
- `{n} to review` · `Due {date}` · `Last commit {sha}`

---

## 11. Figma Make — frame checklist

Build in this order. Each item = one frame at 1440×1024 unless noted.

**Foundations**
1. Color styles + text styles from §2.1 (Inter 400/500/600, JetBrains Mono 400)
2. Components: KPI Card · Announcement Module · Class Card · Assignment Card (student/faculty variants) · Student Card · SprintPill · StatusPill · Breadcrumb · Confirm Modal · Empty State · Skeleton · Toast · Primary/Outline/Ghost buttons · Filter chip · Search input · Dropdown menu

**Public**
3. Landing — full page (all 7 sections, §3)
4. Landing — mobile 390×844
5. Sign-in — desktop split (§4)
6. Sign-in — mobile + error state

**Student (Shell A)**
7. Dashboard — KPI + subject sections + announcements rail (§5.1)
8. Dashboard — mobile (rail moves below KPIs)
9. Dashboard — unrostered state
10. Assignments — subject chips + grouped cards
11. Sprint 0 submit — with "How this works" panel
12. Sprint 1–3 submit — with pivot toggle open
13. Sprint timeline
14. Empty states ×2 (no assignments / no submissions)

**Faculty/Admin (Shell B)**
15. Faculty dashboard — class cards (§6.1)
16. Admin dashboard — with admin strip (§7)
17. Class detail (§6.2)
18. Assignment detail — student card grid (§6.3)
19. Assignment detail — table toggle
20. Review queue — card expanded with notes
21. Roster — with row action menu open (§6.5)
22. Remove-student confirm modal + toast
23. Onboard wizard — steps 1–5 (one frame, five states)
24. Requests queue — populated + empty
25. Sidebar — desktop + mobile drawer, owner vs teacher item sets, requests badge

**States to spec on every frame:** loading skeleton, empty, error banner, permission-missing (read-only role), mobile.
