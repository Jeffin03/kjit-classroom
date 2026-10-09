# Redesign — remaining work (for the next session)

Source spec: `docs/11-REDESIGN.md`. Everything not implemented or not yet
verified is listed here. Start with the verification commands:

```bash
cd kjit-classroom
npx tsc --noEmit    # clean
npm run lint        # 0 errors, 0 warnings (the 2 <img> warnings are fixed)
npm run build       # succeeds, /api/announcements registered
```

Done this session (kept for reference): §1 review-queue filters + Accept all,
§2 landing sections 5–6, §3 announcements API/store/composer/proxy matcher,
§5 KPI click-through, §7 `<img>` warnings. Deep links added:
`/faculty/review?class=&status=&assignmentId=`, `/faculty/roster?class=`.

## 1. Review queue — §6.4 — DONE

- [x] Class ▾ filter (cascades class → assignment → status; resets the
      assignment filter when the class changes). Class comes from the
      class-scoped roster (`studentUsername → classTeam`), falling back to the
      assignment's `assignedTeams` when it names exactly one class.
- [x] `Accept all` at the queue header with a `ConfirmModal` — accepts every
      **currently filtered** non-accepted submission via
      `PUT /api/submissions/[id]/review`, stops on first failure with an error
      banner, refetches after.
- [x] The 4 KpiCards kept (Total resets all filters; Accepted → status=accepted).
- Left neutral on purpose: *Awaiting review* / *Partially reviewed* — neither
  maps to one status value, and §8 allows neutral-info cards.

## 2. Landing page — §3.1 — DONE

- [x] "Who it's for" — 3 role cards (`#audience`, Student / Faculty / Admin),
      copy verbatim from §3.2.
- [x] Closing CTA band — `Ready to submit your first sprint?` +
      role-aware `Sign in with GitHub` / `Open dashboard`.

## 3. Backend gaps — §9

- [x] #2 — `src/backend/store/announcements.ts` + `GET /api/announcements`
      (`authenticate()` — any signed-in user), model in
      `src/backend/types/announcement.ts`. `AnnouncementModule` now fetches
      (loading skeleton, empty, and error states added); `frontend/data/`
      deleted.
- [x] #8 — `POST /api/announcements`, gated on `teacher.approve` (owner-only),
      validated (title ≤120, body ≤2000). Owner-only "New announcement"
      composer row inside the module (§7).
- [x] #4 — `/announcements/:path*` removed from `src/proxy.ts` matcher;
      verified signed-out `/announcements` now renders the client redirect
      (200) instead of bouncing to `/signin`.
- [ ] #6 — Class-level rollups endpoint. ClassCard rollups still computed
      client-side per page with N+1-ish fetches. Optional — low priority, not
      required for correctness.

## 4. Admin / owner — §7

- [ ] Owner-only **danger zone** in sidebar footer → `/faculty/settings`:
      explicitly deferred ("none required this pass — out of scope, listed
      for later"). Create route + minimal UI only if requested.

## 5. KPI click-through — §8 rule — DONE (with two documented exceptions)

- [x] Student dashboard: Review feedback, Accepted projects → `/assignments`
      (Active projects / Due soon already linked).
- [x] Faculty dashboard: Live assignments → `/faculty#classes` (the class
      cards section gained `id="classes"`), Accepted this week →
      `/faculty/review?status=accepted`, admin-strip **Classes** →
      `/faculty/onboard` (the other three cells were already wired).
- [x] Class detail: Students → `/faculty/roster?class=…`,
      To review → `/faculty/review?class=…` (both pages accept the param and
      pre-select it, even for a class with no rows yet).
- [x] Assignment detail: Students → clears status + search, Accepted →
      `accepted`, Not started → `not-started`.
- Left neutral (no single filter exists, so §8's "neutral info" applies):
  - class detail **Assignments** / **In progress** (in-progress = active +
    completed; the review queue only filters one status at a time),
  - assignment detail **In progress** (spans `in-progress` + `awaiting`),
  - roster KPI row (§6.5 toolbar has no status filter) and onboard step-5
    (wizard summary, no list).
  If a combined "open / not accepted" status filter is ever added to the
  review queue, these become linkable.

## 6. Testing — automated smoke only so far

Ran against `next start` (curl, signed out):

- [x] `/` renders the new §5/§6 landing sections; `/signin` → 200.
- [x] Signed out `/dashboard`, `/faculty/review`, `/assignments` → 307
      `/signin?callbackUrl=…`.
- [x] Signed out `/announcements` → 200 "Opening announcements…" (no gate).
- [x] `GET /api/announcements` signed out → 401.

Still needs a human with a GitHub login (no test runner exists, per AGENTS.md):

- [ ] **Manual smoke — auth & landing**
  - `Sign in with GitHub` → `/signin`; `/signin` error states (access denied,
    CSRF, generic) show mapped copy.
  - Post-login: student → `/dashboard`, faculty → `/faculty` (role-aware
    default in `Home.tsx` / `signin/page.tsx`); explicit `callbackUrl` still
    wins unless it's the default `/dashboard`.
  - Signed-in `/` and `/signin` redirect instead of rendering.
  - Signed in: avatar menu (role line, Sign out, `Faculty dashboard` link for
    faculty) and class chip present.
- [ ] **Manual smoke — student**
  - Dashboard: greeting + name, 4 KPIs (click each), subject-grouped
    AssignmentCards, announcements module fetches (and shows skeleton → list),
    Up next aside.
  - Unrostered state: copy, Check again / Back to home.
  - `/assignments`: subject filter chips, grouped grid, past-deadline state.
  - Sprint submit form: no fork/PR wording (grep already clean — only the
    intentional "No forks, no pull requests" copy remains).
  - Timeline: Sprint 0 labeled "Abstract", footer note "Submissions, not
    pull requests…".
- [ ] **Manual smoke — faculty**
  - Dashboard: KPIs (click each), admin strip (owner only), announcements
    module + composer row posts and prepends, class cards, recent submissions.
  - Drill-down: `/faculty` → `/faculty/class/[team]` →
    `/faculty/assignments/[id]` (breadcrumbs, student cards, table toggle,
    search/status filters, KPI cards now set the status filter, Accept works).
  - `/faculty/assignments` redirects to `/faculty`.
  - Review queue: class → assignment → status cascade, `?class=`/`?status=`
    deep links from KPI cards, per-sprint notes save, Accept, `Accept all` →
    ConfirmModal → all filtered cards accepted.
  - Roster: `?class=` deep link, search/class filter, row `⋯` menu → Remove →
    ConfirmModal → toast with **Undo**; elective teachers read-only.
  - Onboard: breadcrumbs, 5 steps, step-5 KpiCards, Back to roster.
  - Requests (owner): approve/deny, empty-state copy, sidebar count badge.
  - Capability gating: elective teacher cannot roster-write; non-owner sees no
    Requests item **and no "New announcement" composer row**; `teacher.request`
    gone everywhere (grep: clean).
- [ ] **Responsive spot-check**: mobile drawer sidebar (open/Escape/close),
  tables → stacked cards, `sm:`/`lg:` breakpoints on both shells.
- [ ] **A11y spot-check**: keyboard through menus (avatar, roster row menu),
  focus rings, `aria-current` in nav, `ConfirmModal`/`Toast` announcements
  (including the new Accept-all modal), alt text on avatars.
- [ ] **Copy audit vs §10** — greps run and clean: `fork|pull request|merge`
  only hits the intentional "No forks, no pull requests" copy and the GitHub
  API's `fork: boolean` field; no `learner`, `artifact`, `Request access`,
  `Submit your PR`, or buzzwords. Remaining: eyeball the rendered copy deck.

## 7. Optional / low priority

- [x] The 2 `<img>` lint warnings fixed: `Avatar.tsx` and `FacultyOnboard.tsx`
      now use `next/image`; `next.config.ts` allows
      `avatars.githubusercontent.com` + `github.com`. If an avatar ever comes
      from another host, add it to `remotePatterns` or the image will throw.
- [ ] `Home.tsx` still contains a `Faculty dashboard` shortcut in the navbar
      avatar menu (kept for navigation); verify it matches §3 nav spec.
- [ ] If a test suite is ever added: start with pure logic tests
      (permissions matrix, roster store add/remove/rollup, rollout of
      `canAccessClass`) — no runner is configured today.
