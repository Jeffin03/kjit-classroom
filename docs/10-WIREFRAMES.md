# KJIT Classroom — Wireframes for Figma Make

> Copy-paste ready component specs. Each wireframe includes exact Tailwind classes, layout hierarchy, and interactive states.

---

## Wireframe 1: Student Sprint Submission Flow

### 1A. Assignment Card (Student View)

```
┌──────────────────────────────────────────────────────────────────┐
│  bg-white border border-gray-100 rounded-xl p-6                  │
│                                                                  │
│  ┌────────────────────────────────────┐  ┌──────────────────┐    │
│  │  flex items-center gap-3 mb-2      │  │ flex-shrink-0    │    │
│  │                                    │  │                  │    │
│  │  ┌──────────────────────────┐      │  │ ┌──────────────┐ │    │
│  │  │ px-2.5 py-0.5 text-xs   │      │  │ │bg-indigo-600 │ │    │
│  │  │ font-medium              │      │  │ │text-white    │ │    │
│  │  │ bg-indigo-100            │      │  │ │text-sm       │ │    │
│  │  │ text-indigo-700          │      │  │ │font-medium   │ │    │
│  │  │ rounded-full             │      │  │ │px-4 py-2     │ │    │
│  │  │                          │      │  │ │rounded-lg    │ │    │
│  │  │ {subject}                │      │  │ │              │ │    │
│  │  └──────────────────────────┘      │  │ │ Start Sprint │ │    │
│  │                                    │  │ │    0         │ │    │
│  │  ┌──────────────────────────┐      │  │ └──────────────┘ │    │
│  │  │ text-xl font-semibold    │      │  │                  │    │
│  │  │ text-gray-900 mb-2       │      │  └──────────────────┘    │
│  │  │                          │      │                          │
│  │  │ {title}                  │      │                          │
│  │  └──────────────────────────┘      │                          │
│  │                                    │                          │
│  │  ┌──────────────────────────┐      │                          │
│  │  │ text-gray-600 text-sm   │      │                          │
│  │  │ mb-3                    │      │                          │
│  │  │                          │      │                          │
│  │  │ {description}            │      │                          │
│  │  └──────────────────────────┘      │                          │
│  │                                    │                          │
│  │  ┌──────────────────────────┐      │                          │
│  │  │ flex items-center gap-4  │      │                          │
│  │  │ text-sm text-gray-500   │      │                          │
│  │  │                          │      │                          │
│  │  │  Due {deadlineDate}      │      │                          │
│  │  │  Sprint 0 · Sprint 1 ·  │      │                          │
│  │  │  Sprint 2 · Sprint 3    │      │                          │
│  │  └──────────────────────────┘      │                          │
│  └────────────────────────────────────┘                          │
└──────────────────────────────────────────────────────────────────┘
```

### 1B. Sprint 0 Form (Initial Submission)

```
Page wrapper: max-w-3xl mx-auto px-4 py-12

┌──────────────────────────────────────────────────────────────────┐
│  text-3xl font-bold text-gray-900                                │
│  Submit Project — Sprint 0                                       │
│                                                                  │
│  mt-2 text-base text-gray-600                                    │
│  Set up your project repository and submit your abstract         │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  bg-white border border-gray-100 rounded-xl p-6 space-y-6       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  text-lg font-semibold text-gray-900 mb-4                 │  │
│  │  Project Repository                                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  block text-sm font-medium text-gray-700 mb-2             │  │
│  │  GitHub Repository URL *                                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  w-full border border-gray-300 rounded-lg px-3 py-2       │  │
│  │  text-sm text-gray-900 placeholder-gray-400               │  │
│  │  focus:outline-none focus:ring-2 focus:ring-indigo-500    │  │
│  │  focus:border-indigo-500                                   │  │
│  │                                                            │  │
│  │  placeholder: "https://github.com/username/repo-name"     │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  mt-1 text-xs text-gray-400                               │  │
│  │  Create a new repository on GitHub and paste the URL here  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  block text-sm font-medium text-gray-700 mb-2             │  │
│  │  Abstract / Project Synopsis *                             │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  w-full border border-gray-300 rounded-lg px-3 py-2       │  │
│  │  text-sm text-gray-900 placeholder-gray-400               │  │
│  │  focus:outline-none focus:ring-2 focus:ring-indigo-500    │  │
│  │  focus:border-indigo-500                                   │  │
│  │                                                            │  │
│  │  placeholder: "https://docs.google.com/document/d/..."    │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  mt-1 text-xs text-gray-400                               │  │
│  │  Paste a link to your Google Doc with the project abstract │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  flex justify-between mt-6                                       │
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────────────┐    │
│  │ text-sm text-gray-600│    │ bg-indigo-600 text-white     │    │
│  │ hover:text-gray-900  │    │ text-sm font-medium          │    │
│  │                      │    │ px-6 py-2 rounded-lg         │    │
│  │  ← Back to           │    │ hover:bg-indigo-700          │    │
│  │     Assignments      │    │ transition-colors            │    │
│  └──────────────────────┘    │                              │    │
│                              │  Submit Sprint 0             │    │
│                              └──────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### 1C. Sprint Timeline (Student View)

```
Page wrapper: max-w-4xl mx-auto px-4 py-12

┌──────────────────────────────────────────────────────────────────┐
│  text-3xl font-bold text-gray-900                                │
│  Portfolio Website                                               │
│                                                                  │
│  mt-2 text-base text-gray-600                                    │
│  Web Development · Due Sep 30, 2026                              │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  mt-8                                                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  flex items-center gap-4 mb-6                            │    │
│  │                                                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │    │
│  │  │ text-sm      │  │ text-sm      │  │ text-sm      │   │    │
│  │  │ font-medium  │  │ text-gray-500│  │ text-gray-500│   │    │
│  │  │ text-gray-900│  │              │  │              │   │    │
│  │  │              │  │ 3 sprints    │  │ github.com/  │   │    │
│  │  │ Sprint       │  │  submitted   │  │ ananya/      │   │    │
│  │  │ Timeline     │  │              │  │ portfolio    │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──── Sprint 0 ────────────────────────────────────────────┐    │
│  │  flex gap-4                                               │    │
│  │                                                          │    │
│  │  ┌────────┐  ┌───────────────────────────────────────┐   │    │
│  │  │w-10 h-10│  │ flex-1                                │   │    │
│  │  │rounded- │  │                                       │   │    │
│  │  │full     │  │ ┌─────────────────────────────────┐   │   │    │
│  │  │bg-green │  │ │ flex items-center gap-2 mb-1    │   │   │    │
│  │  │-500     │  │ │                                 │   │   │    │
│  │  │text-white│ │ │ text-base font-semibold         │   │   │    │
│  │  │         │  │ │ text-gray-900                   │   │   │    │
│  │  │  ✓      │  │ │                                 │   │   │    │
│  │  └────────┘  │ │ Sprint 0 — Abstract              │   │   │    │
│  │              │ │ ┌─────────────────────────────┐   │   │   │    │
│  │              │ │ │ inline-flex items-center     │   │   │   │    │
│  │              │ │ │ px-2.5 py-0.5 rounded-full  │   │   │   │    │
│  │              │ │ │ text-xs font-medium          │   │   │   │    │
│  │              │ │ │ bg-green-100 text-green-700  │   │   │   │    │
│  │              │ │ │                             │   │   │   │    │
│  │              │ │ │ Submitted                   │   │   │   │    │
│  │              │ │ └─────────────────────────────┘   │   │   │    │
│  │              │ │ └─────────────────────────────────┘   │   │    │
│  │              │ │                                       │   │    │
│  │              │ │ text-sm text-gray-600 mt-2            │   │    │
│  │              │ │ Repo: github.com/ananya/portfolio     │   │    │
│  │              │ │ Abstract: [Google Doc link]           │   │    │
│  │              │ │ Commit: abc123 · Sep 15, 2026         │   │    │
│  │              │ │                                       │   │    │
│  │              │ │ ┌─────────────────────────────────┐   │   │    │
│  │              │ │ │ text-sm text-indigo-600         │   │   │    │
│  │              │ │ │ hover:text-indigo-700           │   │   │    │
│  │              │ │ │                                 │   │   │    │
│  │              │ │ │ View Repository →               │   │   │    │
│  │              │ │ └─────────────────────────────────┘   │   │    │
│  │              │ └───────────────────────────────────────┘   │    │
│  └──────────────┴───────────────────────────────────────────┘    │
│                                                                  │
│  ┌──── Sprint 1 ────────────────────────────────────────────┐    │
│  │  (same layout as Sprint 0, but with different content)    │    │
│  │  Status: Submitted · Commit: def456 · Sep 29, 2026       │    │
│  │  Summary: "Implemented responsive layout and project     │    │
│  │           cards"                                         │    │
│  │  Documentation: [Google Doc link]                        │    │
│  │  Files changed: 8 (+220, -45)                            │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──── Sprint 2 ────────────────────────────────────────────┐    │
│  │  Status: Submitted · Commit: ghi789 · Oct 13, 2026       │    │
│  │  (same layout)                                            │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──── Sprint 3 ────────────────────────────────────────────┐    │
│  │  flex gap-4                                               │    │
│  │                                                          │    │
│  │  ┌────────┐  ┌───────────────────────────────────────┐   │    │
│  │  │w-10 h-10│  │ flex-1                                │   │    │
│  │  │rounded- │  │                                       │   │    │
│  │  │full     │  │ ┌─────────────────────────────────┐   │   │    │
│  │  │bg-gray  │  │ │ text-base font-semibold         │   │   │    │
│  │  │-200     │  │ │ text-gray-900                   │   │   │    │
│  │  │text-gray│  │ │                                 │   │   │    │
│  │  │-500     │  │ │ Sprint 3                        │   │   │    │
│  │  │         │  │ └─────────────────────────────────┘   │   │    │
│  │  │  3      │  │                                       │   │    │
│  │  └────────┘  │ text-sm text-gray-500 mt-2              │   │    │
│  │              │ Not submitted yet                        │   │    │
│  │              │                                           │   │    │
│  │              │ ┌─────────────────────────────────────┐   │   │    │
│  │              │ │ bg-indigo-600 text-white            │   │   │    │
│  │              │ │ text-sm font-medium px-4 py-2       │   │   │    │
│  │              │ │ rounded-lg hover:bg-indigo-700      │   │   │    │
│  │              │ │ transition-colors mt-3              │   │   │    │
│  │              │ │                                     │   │   │    │
│  │              │ │ Submit Sprint 3                     │   │   │    │
│  │              │ └─────────────────────────────────────┘   │   │    │
│  │              └───────────────────────────────────────┘   │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### 1D. Sprint N Submit Form (Sprints 1–3)

```
Page wrapper: max-w-3xl mx-auto px-4 py-12

┌──────────────────────────────────────────────────────────────────┐
│  text-3xl font-bold text-gray-900                                │
│  Submit Sprint 3                                                 │
│                                                                  │
│  mt-2 text-base text-gray-600                                    │
│  Portfolio Website · Web Development                             │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  bg-white border border-gray-100 rounded-xl p-6 space-y-6       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  text-lg font-semibold text-gray-900 mb-4                 │  │
│  │  Repository                                                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  block text-sm font-medium text-gray-700 mb-2             │  │
│  │  GitHub Repository URL *                                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  w-full border border-gray-300 rounded-lg px-3 py-2       │  │
│  │  text-sm text-gray-900                                    │  │
│  │  focus:outline-none focus:ring-2 focus:ring-indigo-500    │  │
│  │                                                            │  │
│  │  value: "https://github.com/ananya/portfolio" (pre-filled)│  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  flex items-center gap-3 p-4 bg-orange-50                 │  │
│  │  border border-orange-200 rounded-lg                      │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ w-4 h-4 rounded accent-orange-600                   │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ text-sm text-gray-700                               │  │  │
│  │  │                                                      │  │  │
│  │  │ I'm starting fresh with a new repository / approach  │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  (When checkbox is checked, show additional field:)        │  │
│  │                                                            │  │
│  │  block text-sm font-medium text-gray-700 mb-2             │  │
│  │  New Repository URL *                                      │  │
│  │                                                            │  │
│  │  w-full border border-gray-300 rounded-lg px-3 py-2       │  │
│  │  text-sm text-gray-900 placeholder-gray-400               │  │
│  │                                                            │  │
│  │  placeholder: "https://github.com/username/new-repo"      │  │
│  │                                                            │  │
│  │  mt-1 text-xs text-red-600                                │  │
│  │  This will reset your baseline. Previous sprints will be   │  │
│  │  marked as superseded.                                     │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  bg-white border border-gray-100 rounded-xl p-6 space-y-6       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  text-lg font-semibold text-gray-900 mb-4                 │  │
│  │  Documentation                                             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  block text-sm font-medium text-gray-700 mb-2             │  │
│  │  Documentation Link *                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  w-full border border-gray-300 rounded-lg px-3 py-2       │  │
│  │  text-sm text-gray-900 placeholder-gray-400               │  │
│  │                                                            │  │
│  │  placeholder: "https://docs.google.com/document/d/..."    │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  mt-1 text-xs text-gray-400                               │  │
│  │  Link to your updated project documentation                │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  bg-white border border-gray-100 rounded-xl p-6 space-y-6       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  text-lg font-semibold text-gray-900 mb-4                 │  │
│  │  Sprint Summary                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  block text-sm font-medium text-gray-700 mb-2             │  │
│  │  What was completed in this sprint? *                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  (Dynamic list — same pattern as NewAssignment)            │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐      │  │
│  │  │ flex gap-2                                        │      │  │
│  │  │                                                  │      │  │
│  │  │ ┌────────────────────────────────────────────┐   │      │  │
│  │  │ │ flex-1 border border-gray-300 rounded-lg  │   │      │  │
│  │  │ │ px-3 py-2 text-sm                          │   │      │  │
│  │  │ │ text-gray-900 placeholder-gray-400         │   │      │  │
│  │  │ │ focus:outline-none focus:ring-2            │   │      │  │
│  │  │ │ focus:ring-indigo-500                      │   │      │  │
│  │  │ │                                             │   │      │  │
│  │  │ │ placeholder: "e.g. Implemented user auth"  │   │      │  │
│  │  │ └────────────────────────────────────────────┘   │      │  │
│  │  │ ┌──────────────────────────┐                     │      │  │
│  │  │ │ text-gray-400           │                     │      │  │
│  │  │ │ hover:text-red-500      │                     │      │  │
│  │  │ │ transition-colors px-2  │                     │      │  │
│  │  │ │                          │                     │      │  │
│  │  │ │ ×                        │                     │      │  │
│  │  │ └──────────────────────────┘                     │      │  │
│  │  └──────────────────────────────────────────────────┘      │  │
│  │                                                            │  │
│  │  (repeat for each item)                                    │  │
│  │                                                            │  │
│  │  mt-2 text-sm text-indigo-600 hover:text-indigo-700       │  │
│  │  + Add more                                                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  block text-sm font-medium text-gray-700 mb-2             │  │
│  │  What changed since the last sprint? *                     │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  w-full border border-gray-300 rounded-lg px-3 py-2       │  │
│  │  text-sm text-gray-900 placeholder-gray-400               │  │
│  │  focus:outline-none focus:ring-2 focus:ring-indigo-500    │  │
│  │  resize-none                                               │  │
│  │  rows={3}                                                  │  │
│  │                                                            │  │
│  │  placeholder: "Brief description of changes..."           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  block text-sm font-medium text-gray-700 mb-2             │  │
│  │  Blockers                                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  w-full border border-gray-300 rounded-lg px-3 py-2       │  │
│  │  text-sm text-gray-900 placeholder-gray-400               │  │
│  │  focus:outline-none focus:ring-2 focus:ring-indigo-500    │  │
│  │  resize-none                                               │  │
│  │  rows={2}                                                  │  │
│  │                                                            │  │
│  │  placeholder: "Any blockers or issues faced..."           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  block text-sm font-medium text-gray-700 mb-2             │  │
│  │  Demo Link (optional)                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  w-full border border-gray-300 rounded-lg px-3 py-2       │  │
│  │  text-sm text-gray-900 placeholder-gray-400               │  │
│  │                                                            │  │
│  │  placeholder: "https://..."                               │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  flex justify-between mt-6                                       │
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────────────┐    │
│  │ text-sm text-gray-600│    │ bg-indigo-600 text-white     │    │
│  │ hover:text-gray-900  │    │ text-sm font-medium          │    │
│  │                      │    │ px-6 py-2 rounded-lg         │    │
│  │  Cancel              │    │ hover:bg-indigo-700          │    │
│  └──────────────────────┘    │ transition-colors            │    │
│                              │                              │    │
│                              │  Submit Sprint 3             │    │
│                              └──────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Wireframe 2: Faculty Assignment Detail View

### 2A. Assignment Header

```
Page wrapper: max-w-6xl mx-auto px-4 py-12

┌──────────────────────────────────────────────────────────────────┐
│  flex items-start justify-between gap-4 mb-8                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐    │    │
│  │  │ flex items-center gap-3 mb-2                     │    │    │
│  │  │                                                  │    │    │
│  │  │ ┌────────────────────────────────────────────┐   │    │    │
│  │  │ │ inline-flex items-center px-2.5 py-0.5     │   │    │    │
│  │  │ │ rounded-full text-xs font-medium           │   │    │    │
│  │  │ │ bg-indigo-100 text-indigo-700              │   │    │    │
│  │  │ │                                             │   │    │    │
│  │  │ │ {subject}                                   │   │    │    │
│  │  │ └────────────────────────────────────────────┘   │    │    │
│  │  │                                                  │    │    │
│  │  │ ┌────────────────────────────────────────────┐   │    │    │
│  │  │ │ inline-flex items-center px-2.5 py-0.5     │   │    │    │
│  │  │ │ rounded-full text-xs font-medium           │   │    │    │
│  │  │ │ bg-blue-100 text-blue-700                  │   │    │    │
│  │  │ │                                             │   │    │    │
│  │  │ │ {assignedTeams.join(", ")}                  │   │    │    │
│  │  │ └────────────────────────────────────────────┘   │    │    │
│  │  └──────────────────────────────────────────────────┘    │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐    │    │
│  │  │ text-3xl font-bold text-gray-900 mb-2           │    │    │
│  │  │                                                  │    │    │
│  │  │ {title}                                          │    │    │
│  │  └──────────────────────────────────────────────────┘    │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐    │    │
│  │  │ text-gray-600 text-sm mb-3                       │    │    │
│  │  │                                                  │    │    │
│  │  │ {description}                                    │    │    │
│  │  └──────────────────────────────────────────────────┘    │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐    │    │
│  │  │ flex items-center gap-4 text-sm text-gray-500   │    │    │
│  │  │                                                  │    │    │
│  │  │  Due {deadline}                                  │    │    │
│  │  │  4 sprints                                      │    │    │
│  │  │  Created by @{createdBy}                         │    │    │
│  │  └──────────────────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ flex-shrink-0                                            │    │
│  │                                                          │    │
│  │ ┌────────────────────────────────────────────────────┐   │    │
│  │ │ bg-white border border-gray-300 text-gray-700     │   │    │
│  │ │ text-sm font-medium px-4 py-2 rounded-lg          │   │    │
│  │ │ hover:bg-gray-50 transition-colors                │   │    │
│  │ │                                                    │   │    │
│  │ │ View Problem Statement                             │   │    │
│  │ └────────────────────────────────────────────────────┘   │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### 2B. Stats Bar

```
┌──────────────────────────────────────────────────────────────────┐
│  grid grid-cols-2 md:grid-cols-4 gap-4 mb-8                      │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐              │
│  │ bg-white border      │  │ bg-white border      │              │
│  │ border-gray-100      │  │ border-gray-100      │              │
│  │ rounded-xl p-4       │  │ rounded-xl p-4       │              │
│  │                      │  │                      │              │
│  │ text-2xl font-bold   │  │ text-2xl font-bold   │              │
│  │ text-gray-900        │  │ text-green-600       │              │
│  │                      │  │                      │              │
│  │ {totalStudents}      │  │ {acceptedCount}      │              │
│  │                      │  │                      │              │
│  │ mt-1 text-sm         │  │ mt-1 text-sm         │              │
│  │ text-gray-600        │  │ text-gray-600        │              │
│  │                      │  │                      │              │
│  │ Total Students       │  │ Accepted             │              │
│  └──────────────────────┘  └──────────────────────┘              │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐              │
│  │ bg-white border      │  │ bg-white border      │              │
│  │ border-gray-100      │  │ border-gray-100      │              │
│  │ rounded-xl p-4       │  │ rounded-xl p-4       │              │
│  │                      │  │                      │              │
│  │ text-2xl font-bold   │  │ text-2xl font-bold   │              │
│  │ text-blue-600        │  │ text-yellow-600      │              │
│  │                      │  │                      │              │
│  │ {submittedCount}     │  │ {noSubmissionCount}  │              │
│  │                      │  │                      │              │
│  │ mt-1 text-sm         │  │ mt-1 text-sm         │              │
│  │ text-gray-600        │  │ text-gray-600        │              │
│  │                      │  │                      │              │
│  │ Active Submissions   │  │ No Submissions       │              │
│  └──────────────────────┘  └──────────────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

### 2C. Student List

```
┌──────────────────────────────────────────────────────────────────┐
│  bg-white border border-gray-100 rounded-xl overflow-hidden      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ px-6 py-4 border-b border-gray-100                       │    │
│  │                                                          │    │
│  │ text-base font-semibold text-gray-900                    │    │
│  │ Student Submissions ({count})                             │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─── Student Row ──────────────────────────────────────────┐    │
│  │ px-6 py-4 border-b border-gray-100 last:border-0         │    │
│  │ hover:bg-gray-50 transition-colors                       │    │
│  │                                                          │    │
│  │ flex items-start justify-between gap-4                    │    │
│  │                                                          │    │
│  │ ┌──────────────────────────────────────────────────────┐  │    │
│  │ │ flex items-center gap-4                               │  │    │
│  │ │                                                       │  │    │
│  │ │ ┌────────┐  ┌────────────────────────────────────┐   │  │    │
│  │ │ │w-11 h-11│  │ flex-1                             │   │  │    │
│  │ │ │rounded- │  │                                    │   │  │    │
│  │ │ │full     │  │ ┌──────────────────────────────┐   │   │  │    │
│  │ │ │bg-gray  │  │ │ font-medium text-gray-900    │   │   │  │    │
│  │ │ │-200     │  │ │                              │   │   │  │    │
│  │ │ │flex     │  │ │ {studentName}                │   │   │  │    │
│  │ │ │items-   │  │ └──────────────────────────────┘   │   │  │    │
│  │ │ │center   │  │                                    │   │  │    │
│  │ │ │justify- │  │ ┌──────────────────────────────┐   │   │  │    │
│  │ │ │center   │  │ │ text-sm text-gray-500        │   │   │  │    │
│  │ │ │text-sm  │  │ │                              │   │   │  │    │
│  │ │ │font-    │  │ │ {rollNo} · @{githubUsername} │   │   │  │    │
│  │ │ │medium   │  │ └──────────────────────────────┘   │   │  │    │
│  │ │ │text-gray│  │                                    │   │  │    │
│  │ │ │-600     │  │ ┌──────────────────────────────┐   │   │  │    │
│  │ │ │         │  │ │ flex items-center gap-2 mt-2  │   │   │  │    │
│  │ │ │  {A}    │  │ │                              │   │   │  │    │
│  │ │ └────────┘  │ │ ┌────────────────────────┐   │   │   │  │    │
│  │ │              │ │ │ text-xs text-gray-400  │   │   │   │  │    │
│  │ │              │ │ │                        │   │   │   │  │    │
│  │ │              │ │ │ Sprint 0 ✓ Sprint 1 ✓  │   │   │   │  │    │
│  │ │              │ │ │ Sprint 2 ✓ Sprint 3 —  │   │   │   │  │    │
│  │ │              │ │ └────────────────────────┘   │   │   │  │    │
│  │ │              │ │                              │   │   │  │    │
│  │ │              │ │ ┌────────────────────────┐   │   │   │  │    │
│  │ │              │ │ │ (if pivot)             │   │   │   │  │    │
│  │ │              │ │ │ inline-flex items-center│   │   │   │  │    │
│  │ │              │ │ │ px-2 py-0.5 rounded-full│  │   │   │  │    │
│  │ │              │ │ │ text-xs font-medium     │   │   │   │  │    │
│  │ │              │ │ │ bg-orange-100           │   │   │   │  │    │
│  │ │              │ │ │ text-orange-700         │   │   │   │  │    │
│  │ │              │ │ │                         │   │   │   │  │    │
│  │ │              │ │ │ Pivoted at Sprint 2     │   │   │   │  │    │
│  │ │              │ │ └────────────────────────┘   │   │   │  │    │
│  │ │              │ └──────────────────────────────┘   │  │    │
│  │ └──────────────────────────────────────────────────┘  │    │
│  │                                                       │    │
│  │ ┌──────────────────────────────────────────────────┐  │    │
│  │ │ flex-shrink-0 flex items-center gap-3             │  │    │
│  │ │                                                   │  │    │
│  │ │ ┌────────────────────────────────────────────┐    │  │    │
│  │ │ │ text-sm text-indigo-600                    │    │  │    │
│  │ │ │ hover:text-indigo-700                      │    │  │    │
│  │ │ │ flex items-center gap-1                     │    │  │    │
│  │ │ │                                             │    │  │    │
│  │ │ │ View Details →                              │    │  │    │
│  │ │ └────────────────────────────────────────────┘    │  │    │
│  │ │                                                   │  │    │
│  │ │ ┌────────────────────────────────────────────┐    │  │    │
│  │ │ │ bg-green-600 text-white                    │    │  │    │
│  │ │ │ text-sm font-medium px-4 py-2 rounded-lg  │    │  │    │
│  │ │ │ hover:bg-green-700 transition-colors       │    │  │    │
│  │ │ │                                             │    │  │    │
│  │ │ │ Accept                                      │    │  │    │
│  │ │ └────────────────────────────────────────────┘    │  │    │
│  │ └──────────────────────────────────────────────────┘  │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                               │
│  (repeat for each student)                                    │
└───────────────────────────────────────────────────────────────┘
```

### 2D. Student Sprint Detail (Expanded View)

```
┌──────────────────────────────────────────────────────────────────┐
│  bg-white border border-gray-100 rounded-xl p-6                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ flex items-center justify-between mb-6                    │    │
│  │                                                          │    │
│  │ ┌──────────────────────────────────────────────────────┐  │    │
│  │ │ flex items-center gap-4                               │  │    │
│  │ │                                                       │  │    │
│  │ │ ┌────────┐  ┌────────────────────────────────────┐   │  │    │
│  │ │ │w-11 h-11│  │                                    │   │  │    │
│  │ │ │rounded- │  │ text-xl font-semibold              │   │  │    │
│  │ │ │full     │  │ text-gray-900                      │   │  │    │
│  │ │ │bg-gray  │  │                                    │   │  │    │
│  │ │ │-200     │  │ {studentName}                      │   │  │    │
│  │ │ │flex     │  │                                    │   │  │    │
│  │ │ │items-   │  │ text-sm text-gray-500 mt-1         │   │  │    │
│  │ │ │center   │  │ {rollNo} · @{githubUsername}       │   │  │    │
│  │ │ │justify- │  └────────────────────────────────────┘   │  │    │
│  │ │ │center   │                                           │  │    │
│  │ │ │text-sm  │                                           │  │    │
│  │ │ │font-    │                                           │  │    │
│  │ │ │medium   │                                           │  │    │
│  │ │ │text-gray│                                           │  │    │
│  │ │ │-600     │                                           │  │    │
│  │ │ │         │                                           │  │    │
│  │ │ │  {A}    │                                           │  │    │
│  │ │ └────────┘                                            │  │    │
│  │ └──────────────────────────────────────────────────────┘  │    │
│  │                                                          │    │
│  │ ┌──────────────────────────────────────────────────────┐  │    │
│  │ │ bg-white border border-gray-300 text-gray-700       │  │    │
│  │ │ text-sm font-medium px-4 py-2 rounded-lg            │  │    │
│  │ │ hover:bg-gray-50 transition-colors                  │  │    │
│  │ │                                                      │  │    │
│  │ │ ← Back to List                                       │  │    │
│  │ └──────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─── Sprint 0 ─────────────────────────────────────────────┐    │
│  │ flex gap-4                                                │    │
│  │                                                           │    │
│  │ ┌────────┐  ┌─────────────────────────────────────────┐   │    │
│  │ │w-10 h-10│  │ flex-1                                  │   │    │
│  │ │rounded- │  │                                         │   │    │
│  │ │full     │  │ ┌───────────────────────────────────┐   │   │    │
│  │ │bg-green │  │ │ flex items-center gap-2 mb-2      │   │   │    │
│  │ │-500     │  │ │                                   │   │   │    │
│  │ │text-white│ │ │ text-base font-semibold           │   │   │    │
│  │ │         │  │ │ text-gray-900                     │   │   │    │
│  │ │  ✓      │  │ │                                   │   │   │    │
│  │ └────────┘  │ │ Sprint 0 — Abstract                │   │   │    │
│  │              │ │ ┌─────────────────────────────┐   │   │   │    │
│  │              │ │ │ inline-flex items-center     │   │   │   │    │
│  │              │ │ │ px-2.5 py-0.5 rounded-full  │   │   │   │    │
│  │              │ │ │ text-xs font-medium          │   │   │   │    │
│  │              │ │ │ bg-green-100 text-green-700  │   │   │   │    │
│  │              │ │ │                             │   │   │   │    │
│  │              │ │ │ Submitted                   │   │   │   │    │
│  │              │ │ └─────────────────────────────┘   │   │   │    │
│  │              │ └───────────────────────────────────┘   │   │    │
│  │              │                                          │   │    │
│  │              │ text-sm text-gray-600 mt-2               │   │    │
│  │              │ Repo: github.com/ananya/portfolio        │   │    │
│  │              │ Abstract: [Google Doc link]              │   │    │
│  │              │ Commit: abc123 · Sep 15, 2026            │   │    │
│  │              │                                          │   │    │
│  │              │ ┌────────────────────────────────────┐   │   │    │
│  │              │ │ flex gap-3 mt-3                    │   │   │    │
│  │              │ │                                    │   │   │    │
│  │              │ │ ┌──────────────────────────────┐   │   │   │    │
│  │              │ │ │ text-sm text-indigo-600      │   │   │   │    │
│  │              │ │ │ hover:text-indigo-700        │   │   │   │    │
│  │              │ │ │ flex items-center gap-1      │   │   │   │    │
│  │              │ │ │                              │   │   │   │    │
│  │              │ │ │ View Repository →            │   │   │   │    │
│  │              │ │ └──────────────────────────────┘   │   │   │    │
│  │              │ │                                    │   │   │    │
│  │              │ │ ┌──────────────────────────────┐   │   │   │    │
│  │              │ │ │ text-sm text-indigo-600      │   │   │   │    │
│  │              │ │ │ hover:text-indigo-700        │   │   │   │    │
│  │              │ │ │ flex items-center gap-1      │   │   │   │    │
│  │              │ │ │                              │   │   │   │    │
│  │              │ │ │ View Documentation →         │   │   │   │    │
│  │              │ │ └──────────────────────────────┘   │   │   │    │
│  │              │ └────────────────────────────────────┘   │   │    │
│  │              └──────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─── Sprint 1 ──────────────────────────────────────────────┐      │
│  │ (same layout, with diff metrics)                           │      │
│  │                                                             │      │
│  │ text-sm text-gray-600 mt-2                                  │      │
│  │ Summary: "Implemented responsive layout and project cards"  │      │
│  │ Documentation: [Google Doc link]                            │      │
│  │ Commit: def456 · Sep 29, 2026                               │      │
│  │                                                             │      │
│  │ ┌──────────────────────────────────────────────────────┐    │      │
│  │ │ bg-gray-50 rounded-lg p-4 mt-3                       │    │      │
│  │ │                                                       │    │      │
│  │ │ text-sm font-medium text-gray-900 mb-2                │    │      │
│  │ │ Changes since Sprint 0                                 │    │      │
│  │ │                                                       │    │      │
│  │ │ grid grid-cols-2 md:grid-cols-4 gap-4                  │    │      │
│  │ │                                                       │    │      │
│  │ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │    │      │
│  │ │ │ text-sm     │ │ text-sm     │ │ text-sm     │      │    │      │
│  │ │ │ text-gray-500│ │ text-gray-500│ │ text-gray-500│     │    │      │
│  │ │ │             │ │             │ │             │      │    │      │
│  │ │ │ 7 commits   │ │ 8 files     │ │ +220 -45   │      │    │      │
│  │ │ └─────────────┘ └─────────────┘ └─────────────┘      │    │      │
│  │ │                                                       │    │      │
│  │ │ text-xs text-gray-500 mt-2                             │    │      │
│  │ │ New: Contact.tsx, validate.ts                          │    │      │
│  │ │ Modified: App.tsx, main.css                            │    │      │
│  │ └──────────────────────────────────────────────────────┘    │      │
│  └─────────────────────────────────────────────────────────────┘      │
│                                                                       │
│  ┌─── Review Notes ──────────────────────────────────────────┐        │
│  │ bg-white border border-gray-100 rounded-xl p-6 mt-6       │        │
│  │                                                           │        │
│  │ text-lg font-semibold text-gray-900 mb-4                  │        │
│  │ Review Notes                                               │        │
│  │                                                           │        │
│  │ (if no notes yet)                                          │        │
│  │ ┌─────────────────────────────────────────────────────┐    │        │
│  │ │ w-full border border-gray-300 rounded-lg px-3 py-2 │    │        │
│  │ │ text-sm text-gray-900 placeholder-gray-400          │    │        │
│  │ │ focus:outline-none focus:ring-2 focus:ring-indigo-500│   │        │
│  │ │ resize-none rows={4}                                 │    │        │
│  │ │                                                       │    │        │
│  │ │ placeholder: "Add notes from lab review..."          │    │        │
│  │ └─────────────────────────────────────────────────────┘    │        │
│  │                                                           │        │
│  │ ┌─────────────────────────────────────────────────────┐    │        │
│  │ │ bg-indigo-600 text-white text-sm font-medium       │    │        │
│  │ │ px-4 py-2 rounded-lg hover:bg-indigo-700           │    │        │
│  │ │ transition-colors mt-3                              │    │        │
│  │ │                                                       │    │        │
│  │ │ Save Notes                                            │    │        │
│  │ └─────────────────────────────────────────────────────┘    │        │
│  └───────────────────────────────────────────────────────────┘        │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Wireframe 3: Faculty Assignment List

```
Page wrapper: max-w-6xl mx-auto px-4 py-12

┌──────────────────────────────────────────────────────────────────┐
│  flex items-center justify-between mb-8                          │
│                                                                  │
│  ┌──────────────────────────────────────┐  ┌──────────────────┐  │
│  │ text-3xl font-bold text-gray-900     │  │ bg-indigo-600    │  │
│  │                                      │  │ text-white       │  │
│  │ Assignments                          │  │ text-sm          │  │
│  │                                      │  │ font-medium      │  │
│  │ mt-2 text-base text-gray-600        │  │ px-4 py-2        │  │
│  │ Create and manage assignments        │  │ rounded-lg       │  │
│  │                                      │  │ hover:bg-indigo-700│ │
│  └──────────────────────────────────────┘  │ transition-colors │  │
│                                            │                  │  │
│                                            │ + New Assignment  │  │
│                                            └──────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  space-y-4                                                       │
│                                                                  │
│  ┌─── Assignment Card ──────────────────────────────────────┐    │
│  │ bg-white border border-gray-100 rounded-xl p-6           │    │
│  │ hover:shadow-md transition-shadow                        │    │
│  │                                                          │    │
│  │ flex items-start justify-between gap-4                    │    │
│  │                                                          │    │
│  │ ┌──────────────────────────────────────────────────────┐  │    │
│  │ │ flex-1                                                │  │    │
│  │ │                                                       │  │    │
│  │ │ ┌─────────────────────────────────────────────────┐   │  │    │
│  │ │ │ flex items-center gap-3 mb-2                    │   │  │    │
│  │ │ │                                                 │   │  │    │
│  │ │ │ ┌───────────────────────────────────────────┐   │   │  │    │
│  │ │ │ │ inline-flex items-center px-2.5 py-0.5    │   │   │  │    │
│  │ │ │ │ rounded-full text-xs font-medium          │   │   │  │    │
│  │ │ │ │ bg-indigo-100 text-indigo-700             │   │   │  │    │
│  │ │ │ │                                            │   │   │  │    │
│  │ │ │ │ {subject}                                  │   │   │  │    │
│  │ │ │ └───────────────────────────────────────────┘   │   │  │    │
│  │ │ │                                                 │   │  │    │
│  │ │ │ ┌───────────────────────────────────────────┐   │   │  │    │
│  │ │ │ │ inline-flex items-center px-2.5 py-0.5    │   │   │  │    │
│  │ │ │ │ rounded-full text-xs font-medium          │   │   │  │    │
│  │ │ │ │ bg-blue-100 text-blue-700                 │   │   │  │    │
│  │ │ │ │                                            │   │   │  │    │
│  │ │ │ │ {assignedTeams.length} teams               │   │   │  │    │
│  │ │ │ └───────────────────────────────────────────┘   │   │  │    │
│  │ │ │                                                 │   │  │    │
│  │ │ │ (if past deadline)                               │   │  │    │
│  │ │ │ ┌───────────────────────────────────────────┐   │   │  │    │
│  │ │ │ │ inline-flex items-center px-2.5 py-0.5    │   │   │  │    │
│  │ │ │ │ rounded-full text-xs font-medium          │   │   │  │    │
│  │ │ │ │ bg-red-100 text-red-700                   │   │   │  │    │
│  │ │ │ │                                            │   │   │  │    │
│  │ │ │ │ Deadline passed                            │   │   │  │    │
│  │ │ │ └───────────────────────────────────────────┘   │   │  │    │
│  │ │ └─────────────────────────────────────────────────┘   │  │    │
│  │ │                                                       │  │    │
│  │ │ ┌─────────────────────────────────────────────────┐   │  │    │
│  │ │ │ text-xl font-semibold text-gray-900 mb-2       │   │  │    │
│  │ │ │                                                 │   │  │    │
│  │ │ │ {title}                                         │   │  │    │
│  │ │ └─────────────────────────────────────────────────┘   │  │    │
│  │ │                                                       │  │    │
│  │ │ ┌─────────────────────────────────────────────────┐   │  │    │
│  │ │ │ text-gray-600 text-sm mb-3                      │   │  │    │
│  │ │ │                                                 │   │  │    │
│  │ │ │ {description}                                   │   │  │    │
│  │ │ └─────────────────────────────────────────────────┘   │  │    │
│  │ │                                                       │  │    │
│  │ │ ┌─────────────────────────────────────────────────┐   │  │    │
│  │ │ │ flex items-center gap-4 text-sm text-gray-500  │   │  │    │
│  │ │ │                                                 │   │  │    │
│  │ │ │  Due {deadline}                                 │   │  │    │
│  │ │ │  {submissionCount}/{totalStudents} submitted    │   │  │    │
│  │ │ │  Created by @{createdBy}                        │   │  │    │
│  │ │ └─────────────────────────────────────────────────┘   │  │    │
│  │ └──────────────────────────────────────────────────────┘  │    │
│  │                                                          │    │
│  │ ┌──────────────────────────────────────────────────────┐  │    │
│  │ │ flex-shrink-0                                         │  │    │
│  │ │                                                       │  │    │
│  │ │ ┌─────────────────────────────────────────────────┐   │  │    │
│  │ │ │ bg-indigo-600 text-white text-sm font-medium   │   │  │    │
│  │ │ │ px-4 py-2 rounded-lg hover:bg-indigo-700       │   │  │    │
│  │ │ │ transition-colors flex items-center gap-2       │   │  │    │
│  │ │ │                                                  │   │  │    │
│  │ │ │ View Details →                                   │   │  │    │
│  │ │ └─────────────────────────────────────────────────┘   │  │    │
│  │ └──────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  (repeat for each assignment)                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Wireframe 4: Commit Hash Update (Faculty Action)

```
┌──────────────────────────────────────────────────────────────────┐
│  Modal overlay: fixed inset-0 bg-black/50 z-50                   │
│  flex items-center justify-center p-4                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ bg-white rounded-xl shadow-xl max-w-md w-full            │    │
│  │                                                           │    │
│  │ p-6                                                       │    │
│  │                                                           │    │
│  │ ┌──────────────────────────────────────────────────────┐  │    │
│  │ │ text-lg font-semibold text-gray-900 mb-2            │  │    │
│  │ │                                                      │  │    │
│  │ │ Update Commit Hash                                    │  │    │
│  │ └──────────────────────────────────────────────────────┘  │    │
│  │                                                           │    │
│  │ ┌──────────────────────────────────────────────────────┐  │    │
│  │ │ text-sm text-gray-600 mb-4                           │  │    │
│  │ │                                                      │  │    │
│  │ │ Update the commit reference for Sprint {N} for       │  │    │
│  │ │ {studentName}.                                        │  │    │
│  │ └──────────────────────────────────────────────────────┘  │    │
│  │                                                           │    │
│  │ ┌──────────────────────────────────────────────────────┐  │    │
│  │ │ block text-sm font-medium text-gray-700 mb-2        │  │    │
│  │ │ Current Commit Hash                                   │  │    │
│  │ └──────────────────────────────────────────────────────┘  │    │
│  │ ┌──────────────────────────────────────────────────────┐  │    │
│  │ │ bg-gray-100 rounded-lg px-3 py-2 text-sm             │  │    │
│  │ │ font-mono text-gray-600                              │  │    │
│  │ │                                                       │  │    │
│  │ │ {currentSha}                                          │  │    │
│  │ └──────────────────────────────────────────────────────┘  │    │
│  │                                                           │    │
│  │ ┌──────────────────────────────────────────────────────┐  │    │
│  │ │ block text-sm font-medium text-gray-700 mb-2        │  │    │
│  │ │ New Commit Hash *                                     │  │    │
│  │ └──────────────────────────────────────────────────────┘  │    │
│  │ ┌──────────────────────────────────────────────────────┐  │    │
│  │ │ w-full border border-gray-300 rounded-lg px-3 py-2  │  │    │
│  │ │ text-sm text-gray-900 font-mono placeholder-gray-400│  │    │
│  │ │ focus:outline-none focus:ring-2 focus:ring-indigo-500│  │    │
│  │ │                                                       │  │    │
│  │ │ placeholder: "abc123def456..."                        │  │    │
│  │ └──────────────────────────────────────────────────────┘  │    │
│  │                                                           │    │
│  │ (if error)                                                 │    │
│  │ ┌──────────────────────────────────────────────────────┐  │    │
│  │ │ bg-red-50 border border-red-200 rounded-lg p-3      │  │    │
│  │ │ text-sm text-red-700                                 │  │    │
│  │ │                                                       │  │    │
│  │ │ {errorMessage}                                        │  │    │
│  │ └──────────────────────────────────────────────────────┘  │    │
│  │                                                           │    │
│  │ ┌──────────────────────────────────────────────────────┐  │    │
│  │ │ flex justify-end gap-3 mt-6                          │  │    │
│  │ │                                                       │  │    │
│  │ │ ┌─────────────────┐  ┌────────────────────────────┐  │  │    │
│  │ │ │ text-sm          │  │ bg-indigo-600 text-white  │  │  │    │
│  │ │ │ text-gray-600    │  │ text-sm font-medium       │  │  │    │
│  │ │ │ hover:text-gray- │  │ px-4 py-2 rounded-lg     │  │  │    │
│  │ │ │ 900              │  │ hover:bg-indigo-700      │  │  │    │
│  │ │ │                  │  │ transition-colors        │  │  │    │
│  │ │ │ Cancel           │  │                           │  │  │    │
│  │ │ └─────────────────┘  │ Update Hash                │  │  │    │
│  │ │                       └────────────────────────────┘  │  │    │
│  │ └──────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Reference

### Reusable Components

| Component | Props | Purpose |
|-----------|-------|---------|
| `SprintTimeline` | `sprints[], onSelectSprint` | Vertical timeline with sprint status |
| `SprintCard` | `sprint, isLast, isPivot` | Single sprint entry in timeline |
| `DiffMetrics` | `metrics: DiffMetrics` | Compact display of commit/file/line stats |
| `StatusBadge` | `status: string` | Colored badge for any status |
| `Avatar` | `initials: string` | Initial circle |
| `ProgressBar` | `current, total` | Sprint completion bar |
| `RepoLink` | `url: string` | Styled external link to GitHub |
| `DocLink` | `url: string` | Styled external link to Google Doc |
| `EmptyState` | `message, action?` | Empty state with optional CTA |
| `ConfirmModal` | `title, message, onConfirm, onCancel` | Confirmation dialog |
| `DynamicList` | `items, onChange, placeholder` | Add/remove list inputs |

### Color Reference

| Status | Badge Classes |
|--------|---------------|
| Submitted | `bg-green-100 text-green-700` |
| Not submitted | `bg-gray-100 text-gray-500` |
| Pivoted | `bg-orange-100 text-orange-700` |
| Accepted | `bg-green-100 text-green-700` |
| Reviewed | `bg-purple-100 text-purple-700` |
| Past deadline | `bg-red-100 text-red-700` |
| Subject | `bg-indigo-100 text-indigo-700` |
| Team | `bg-blue-100 text-blue-700` |
