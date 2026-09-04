# KJIT Classroom — Figma Design Brief

**Purpose:** This document describes every screen, component, and interaction in KJIT Classroom. Use it to generate UI designs in Figma.

---

## Design System

### Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| **Primary** | `#4F46E5` (indigo-600) | Buttons, links, active states, logo |
| **Primary Hover** | `#4338CA` (indigo-700) | Button hover states |
| **Primary Light** | `#EEF2FF` (indigo-50) | Active nav background, selected states |
| **Primary Badge** | `#E0E7FF` (indigo-100) | Subject badges |
| **Success** | `#16A34A` (green-600) | Approved, merged, success states |
| **Success Light** | `#DCFCE7` (green-100) | Merged badges, success banners |
| **Success Dark** | `#15803D` (green-700) | Merged badge text |
| **Warning** | `#CA8A04` (yellow-600) | Forked status |
| **Warning Light** | `#FEF9C3` (yellow-100) | Forked badges |
| **Warning Dark** | `#A16207` (yellow-700) | Forked badge text |
| **Info** | `#2563EB` (blue-600) | Submitted status |
| **Info Light** | `#DBEAFE` (blue-100) | Submitted badges |
| **Info Dark** | `#1D4ED8` (blue-700) | Submitted badge text |
| **Reviewed** | `#9333EA` (purple-600) | Reviewed status |
| **Reviewed Light** | `#F3E8FF` (purple-100) | Reviewed badges |
| **Reviewed Dark** | `#7E22CE` (purple-700) | Reviewed badge text |
| **Error** | `#DC2626` (red-600) | Errors, past deadlines |
| **Error Light** | `#FEE2E2` (red-100) | Error badges, error banners |
| **Error Dark** | `#B91C1C` (red-700) | Error badge text |
| **Background** | `#F9FAFB` (gray-50) | Page background |
| **Surface** | `#FFFFFF` (white) | Cards, modals, inputs |
| **Border Light** | `#F3F4F6` (gray-100) | Card borders, dividers |
| **Border** | `#E5E7EB` (gray-200) | Input borders, nav border |
| **Border Medium** | `#D1D5DB` (gray-300) | Input focus border |
| **Text Primary** | `#111827` (gray-900) | Headings, primary text |
| **Text Secondary** | `#4B5563` (gray-600) | Body text, descriptions |
| **Text Tertiary** | `#6B7280` (gray-500) | Labels, metadata, timestamps |
| **Dark CTA** | `#111827` (gray-900) | Sign-in button |

### Typography

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Hero Title | Geist Sans | 48px (text-5xl) | Bold (700) | gray-900 |
| Page Title | Geist Sans | 30px (text-3xl) | Bold (700) | gray-900 |
| Section Heading | Geist Sans | 18px (text-lg) | Semibold (600) | gray-900 |
| Card Title | Geist Sans | 20px (text-xl) | Semibold (600) | gray-900 |
| Stat Number (Large) | Geist Sans | 30px (text-3xl) | Bold (700) | varies |
| Stat Number (Small) | Geist Sans | 24px (text-2xl) | Bold (700) | varies |
| Body Text | Geist Sans | 16px (text-base) | Regular (400) | gray-600 |
| Small Text | Geist Sans | 14px (text-sm) | Regular (400) | gray-500 |
| Badge Text | Geist Sans | 12px (text-xs) | Medium (500) | varies |
| Label | Geist Sans | 14px (text-sm) | Medium (500) | gray-700 |
| Nav Link | Geist Sans | 14px (text-sm) | Medium (500) | gray-600 |
| Button Text | Geist Sans | 14px (text-sm) | Medium (500) | white or gray-700 |
| Input Text | Geist Sans | 14px (text-sm) | Regular (400) | gray-900 |

### Component Library

#### Card
- Background: white
- Border: 1px solid gray-100
- Border radius: 12px (rounded-xl)
- Shadow: shadow-sm (0 1px 2px rgba(0,0,0,0.05))
- Padding: 24px (p-6)
- Hover: shadow-md transition

#### Primary Button
- Background: indigo-600
- Text: white, 14px, medium
- Padding: 8px 24px (px-6 py-2)
- Border radius: 8px (rounded-lg)
- Hover: indigo-700
- Transition: colors

#### Secondary Button
- Background: white
- Border: 1px solid gray-300
- Text: gray-700, 14px, medium
- Padding: 8px 16px (px-4 py-2)
- Border radius: 8px (rounded-lg)
- Hover: gray-50 background

#### Danger/Success Button
- Same as primary but green-600 / green-700
- Used for: "Confirm & Send Invites", "Accept" submission

#### Dark CTA Button (Sign In)
- Background: gray-900
- Text: white, 18px, medium
- Padding: 16px 32px (px-8 py-4)
- Border radius: 12px (rounded-xl)
- Hover: gray-800
- Shadow: shadow-lg

#### Text Input
- Border: 1px solid gray-300
- Border radius: 8px (rounded-lg)
- Padding: 8px 12px (px-3 py-2)
- Text: 14px, gray-900
- Placeholder: gray-400
- Focus: 2px ring indigo-500, border indigo-500

#### Textarea
- Same as text input
- Rows: 2-4 depending on context

#### Select Dropdown
- Same as text input
- Custom arrow icon

#### Badge (Pill)
- Padding: 2px 10px (px-2.5 py-0.5)
- Border radius: 9999px (rounded-full)
- Text: 12px, medium
- Color variants:
  - Subject: indigo-100 bg, indigo-700 text
  - Forked: yellow-100 bg, yellow-700 text
  - Submitted: blue-100 bg, blue-700 text
  - Reviewed: purple-100 bg, purple-700 text
  - Merged/Accepted: green-100 bg, green-700 text
  - Past deadline: red-100 bg, red-700 text

#### Avatar
- Small: 32x32px (w-8 h-8), rounded-full
- Medium: 40x40px (w-10 h-10), rounded-full
- Fallback: bg-gray-200 with first letter initial, or bg-red-100 with "?" for unmatched

#### Icon Container
- Size: 40x40px (w-10 h-10)
- Border radius: 8px (rounded-lg)
- Variants:
  - Green: bg-green-100, icon green-600
  - Blue: bg-blue-100, icon blue-600
  - Purple: bg-purple-100, icon purple-600
  - Indigo: bg-indigo-100, icon indigo-600

#### Skeleton Loader
- Background: animate-pulse, bg-gray-200
- Variants: h-8 rounded, h-16 rounded, h-32 rounded-xl

#### Empty State
- Centered layout
- Icon: 48x48px (w-12 h-12), gray-400
- Text: gray-600, 16px
- Optional CTA: indigo-600 text link

---

## Page 1: Landing Page

### Layout
- Full viewport height minus navbar (min-h-[calc(100vh-4rem)])
- Vertically centered content
- Max width: 672px (max-w-3xl), centered

### Section 1: Hero
| Element | Spec |
|---------|------|
| Logo | 80x80px square, bg-indigo-600, rounded-2xl, white bold "K" letter centered |
| Title | "KJIT Classroom", 48px bold gray-900, margin-top 24px |
| Subtitle | "GitHub-native project submission & portfolio management platform", 20px gray-600, margin-top 16px |
| Body | "Fork project templates to your own GitHub account. Build real projects. Create a portfolio that follows you beyond graduation.", 16px gray-500, max-width 640px centered, margin-top 16px |
| CTA Button (logged out) | "Sign in with GitHub", dark bg-gray-900 button with GitHub icon (24x24px white), 32px vertical margin |
| CTA Button (logged in) | "View Assignments", indigo-600 button, 32px vertical margin |

### Section 2: Feature Cards (3 columns on desktop, 1 on mobile)
| Card | Icon Color | Title | Description |
|------|-----------|-------|-------------|
| 1 | Green (bg-green-100, text-green-600) | "Student-Owned Repos" | "Projects live in your GitHub account. Pin them to your profile. Show them to employers." |
| 2 | Blue (bg-blue-100, text-blue-600) | "Real-World Workflow" | "Fork, branch, commit, PR. Learn the workflow used by professional development teams." |
| 3 | Purple (bg-purple-100, text-purple-600) | "Permanent Portfolio" | "Unlike GitHub Classroom, your work stays with you forever. Build your developer profile." |

- Grid: 3 columns on md+, 1 column on mobile
- Gap: 32px (gap-8)
- Card: white bg, 24px padding, rounded-xl, border gray-100, shadow-sm
- Icon container: 40x40px rounded-lg
- Title: 14px semibold gray-900, margin-top 12px
- Description: 14px gray-600

---

## Page 2: Sign In

### Layout
- Centered card on gray-50 background
- Max width: 400px

### Components
| Element | Spec |
|---------|------|
| Logo | Same as landing (80x80px indigo square with "K") |
| Title | "Sign in to KJIT Classroom", 24px bold gray-900 |
| Subtitle | "Use your GitHub account to continue", 14px gray-500 |
| Divider | "or" text centered with horizontal lines |
| GitHub Button | Full width, bg-gray-900, white text, GitHub icon + "Continue with GitHub", 48px height, rounded-xl |
| Footer text | "By signing in, you agree to our Terms of Service", 12px gray-400, centered |

---

## Page 3: Navbar (Global Component)

### Layout
- Sticky top, full width, height 64px (h-16)
- Background: white
- Border: 1px bottom gray-200
- Z-index: 50
- Inner container: max-width 1280px (max-w-7xl), centered, padding 0 16px

### Left Side
| Element | Spec |
|---------|------|
| Logo | 32x32px bg-indigo-600 rounded-lg, white "K" |
| Brand Text | "KJIT Classroom", 20px bold gray-900, margin-left 12px |
| Nav Links (when signed in) | Horizontal row, margin-left 32px |
| Link: "Assignments" | 14px medium, gray-600, hover gray-900, padding 8px 12px, rounded-md |
| Link: "My Dashboard" | Same style |
| Link: "Announcements" | Same style |
| Link: "Faculty" | Same style, only shown for org owners and approved animators |
| Active Link | bg-indigo-50, text-indigo-700 |

### Right Side
| Element | Spec |
|---------|------|
| User Avatar | 32x32px rounded-full |
| User Name | 14px gray-700, hidden on mobile |
| Sign Out | 14px gray-500, hover gray-700, padding 4px 12px, rounded-md |
| Sign In (logged out) | "Sign in with GitHub", bg-indigo-600, white, 14px medium, padding 8px 16px, rounded-md |

---

## Page 4: Assignments (Student View)

### Layout
- Container: max-width 896px (max-w-4xl), centered, padding 48px 16px

### Header
| Element | Spec |
|---------|------|
| Title | "Assignments", 30px bold gray-900 |
| Subtitle | "Read the problem statement, fork the repo, and start building", 16px gray-600, margin-top 8px |

### Assignment Card (repeated for each assignment)
- Background: white
- Border: 1px gray-100
- Border radius: 12px (rounded-xl)
- Padding: 24px
- Shadow: shadow-sm
- Hover: shadow-md transition
- Margin-bottom: 16px

| Element | Spec |
|---------|------|
| Top Row | Flex: subject badge (left) + deadline badge (right) |
| Subject Badge | "Web Development", indigo-100 bg, indigo-700 text, 12px medium, rounded-full |
| Deadline Badge (if past) | "Past deadline", red-100 bg, red-700 text, rounded-full |
| Title | "Portfolio Website", 20px semibold gray-900, margin-top 12px |
| Description | "Build a personal portfolio website using HTML, CSS, and JavaScript...", 14px gray-600, margin-top 8px |
| Meta Row | Flex row, gap 16px, margin-top 12px |
| Meta: Due | Calendar icon (16x16 gray-400) + "Due Sep 30, 2026", 14px gray-500 |
| Meta: Repo | Folder icon (16x16 gray-400) + "portfolio-template", 14px gray-500 |
| Action | "Start" button, indigo-600 bg, white text, 14px medium, rounded-lg, with external-link icon (16x16), margin-top 16px |

### Empty State
- Centered, padding 48px
- Folder icon: 48x48px gray-400
- Text: "No assignments available yet", 16px gray-600

---

## Page 5: Student Dashboard

### Layout
- Container: max-width 896px (max-w-4xl), centered, padding 48px 16px

### Header
| Element | Spec |
|---------|------|
| Title | "My Dashboard", 30px bold gray-900 |
| Subtitle | "Track your project submissions", 16px gray-600, margin-top 8px |

### Stats Row (3 cards)
- Grid: 3 columns on desktop, 1 on mobile
- Gap: 16px
- Card: white bg, 24px padding, rounded-xl, border gray-100

| Stat | Number Color | Label |
|------|-------------|-------|
| Total | indigo-600 | "Total Submissions" |
| Merged | green-600 | "Completed" |
| In Progress | yellow-600 | "In Progress" |

- Number: 30px bold
- Label: 14px gray-600, margin-top 4px

### Submissions List
- Section title: "Submissions", 18px semibold gray-900, margin-top 32px, margin-bottom 16px

#### Submission Card (repeated)
- Background: white
- Border: 1px gray-100
- Border radius: 12px
- Padding: 24px
- Layout: flex row, items center, justify between

| Element | Spec |
|---------|------|
| Left Side | Flex row, gap 16px, items center |
| Avatar | 40x40px rounded-full, bg-gray-200 with first letter |
| Info | Title: "Portfolio Website", 16px semibold gray-900 |
| | Subject: "Web Development", 14px gray-500, margin-top 4px |
| Right Side | Flex row, gap 16px, items center |
| Links | "View Fork" + "View PR", 14px indigo-600, with arrow icon (16x16) |
| Status Badge | Pill badge with status color (see Badge spec above) |

### Empty State
- White card, centered, padding 32px
- Box icon: 48x48px gray-400
- Text: "No submissions yet", 16px gray-600
- CTA: "Browse assignments →", indigo-600 text link

---

## Page 6: Faculty Dashboard

### Layout
- Container: max-width 1152px (max-w-6xl), centered, padding 48px 16px

### Header
| Element | Spec |
|---------|------|
| Title | "Faculty Dashboard", 30px bold gray-900 |
| Subtitle | "Monitor student submissions across all assignments", 16px gray-600, margin-top 8px |
| Action Buttons (right side) | Flex row, gap 12px |
| Button: "Assignments" | Secondary (white bg, gray-300 border), clipboard icon |
| Button: "Review Submissions" | Success (green-600 bg), check-circle icon |
| Button: "Onboard Students" | Primary (indigo-600 bg), person-add icon |
| Button: "View Roster" | Secondary |

### Filter Bar
- Flex row, gap 16px, margin-bottom 24px
- Label: "Filter by assignment:", 14px gray-700
- Select: border gray-300, rounded-lg, padding 8px 12px, 14px

### Stats Row (4 cards)
- Grid: 4 columns on desktop, 2 on mobile
- Gap: 16px, margin-bottom 32px
- Card: white bg, 16px padding, rounded-xl, border gray-100

| Stat | Number Color | Label |
|------|-------------|-------|
| Total | gray-900 | "Total Students" |
| Forked | yellow-600 | "Forked Only" |
| Submitted | blue-600 | "PR Submitted" |
| Merged | green-600 | "Merged" |

- Number: 24px bold
- Label: 14px gray-600, margin-top 4px

### Submissions Table
- Card: white bg, rounded-xl, border gray-100, overflow hidden

#### Table Header
- Background: white
- Padding: 16px 24px
- Border-bottom: 1px gray-100
- Title: "All Submissions", 16px semibold gray-900

#### Table Row (repeated)
- Padding: 16px 24px
- Border-bottom: 1px gray-100
- Hover: gray-50 background
- Layout: flex row, items center, justify between

| Element | Spec |
|---------|------|
| Left Side | Flex row, gap 16px, items center |
| Avatar | 40x40px rounded-full, bg-gray-200 with first letter |
| Student Name | 16px medium gray-900 |
| Assignment | 14px gray-500 |
| Right Side | Flex row, gap 16px, items center |
| Links | "Fork" + "PR", 14px indigo-600 |
| Status Badge | Pill badge |

#### Empty State
- Padding 32px, centered
- Text: "No submissions found", 16px gray-500

---

## Page 7: Create Assignment

### Layout
- Container: max-width 672px (max-w-3xl), centered, padding 48px 16px

### Header
| Element | Spec |
|---------|------|
| Title | "Create Assignment", 30px bold gray-900 |
| Subtitle | "Fill in the details and a GitHub repo will be created with a README", 16px gray-600, margin-top 8px |

### Form Section 1: Basic Info (Card)
- White card, 24px padding, rounded-xl, border gray-100
- Layout: vertical stack, gap 24px

| Field | Type | Placeholder |
|-------|------|-------------|
| Title | Text input, full width | "Portfolio Website" |
| Subject | Text input, full width | "Web Development" |
| Deadline | Date input | — |
| Description | Textarea, 2 rows | "Brief description of the assignment" |

### Form Section 2: Details (Card)
- Same card style
- Layout: vertical stack, gap 24px

| Field | Type | Placeholder |
|-------|------|-------------|
| Problem Statement | Textarea, 4 rows | "Detailed problem statement for students" |
| Objectives | Dynamic list | "What students will learn" |
| Requirements | Dynamic list | "Tech stack or tools required" |
| Evaluation Criteria | Dynamic list | "How students will be graded" |
| Submission Guidelines | Textarea, 2 rows | "How students should submit their work" |

#### Dynamic List Component
- Label: 14px medium gray-700, margin-bottom 8px
- List items: vertical stack, gap 8px
- Each row: text input (flex-1) + remove button (gray-400 hover red-500, "x" text)
- Add button: "Add more", 14px indigo-600 text, below list

### Form Footer
- Flex row, justify between
- Left: "Cancel" link, 14px gray-600
- Right: "Create Assignment" button, indigo-600 bg, white text, rounded-lg
- Loading state: "Creating...", disabled opacity

### Success Banner
- Background: green-50
- Border: 1px green-200
- Border radius: 8px
- Padding: 16px
- Text: green-700
- Content: "Assignment created! View repo →" with link

### Error Banner
- Same as success but red-50 bg, red-200 border, red-700 text

---

## Page 8: Onboarding Wizard (5 Steps)

### Layout
- Container: max-width 896px (max-w-4xl), centered, padding 48px 16px

### Header
| Element | Spec |
|---------|------|
| Title | "Onboard Students", 30px bold gray-900 |
| Subtitle | "Add students to your GitHub org and class teams", 16px gray-600 |

### Step Indicator (Global)
- Horizontal row, centered, margin-top 32px, margin-bottom 32px
- 5 steps connected by lines

| Step | Label |
|------|-------|
| 1 | "Select Class" |
| 2 | "Upload CSV" |
| 3 | "Verify Students" |
| 4 | "Confirm & Invite" |
| 5 | "Complete" |

#### Step Circle
- Size: 40x40px (w-10 h-10)
- Border radius: 9999px (full circle)
- States:
  - Complete: bg-green-500, white checkmark icon, 16px
  - Active: bg-indigo-600, white step number, 14px medium
  - Inactive: bg-gray-200, gray-500 step number, 14px medium
- Label below: 12px, active = indigo-600 medium, inactive = gray-500

#### Connecting Line
- Height: 2px (h-0.5)
- Width: flexible (flex-1)
- Margin: 0 8px, margin-top -20px (overlaps with circle)
- Color: green-500 if complete, gray-200 if not

### Step 1: Select Class
#### Card Content
- Title: "Select a class team", 18px semibold gray-900, margin-bottom 16px
- Grid: 2 columns on desktop, 1 on mobile, gap 12px

#### Team Button (repeated)
- Width: full
- Text align: left
- Padding: 16px
- Border: 1px gray-200
- Border radius: 8px
- States:
  - Selected: bg-indigo-50, border-indigo-300
  - Default: white bg, hover gray-50
- Content:
  - Team name: "MCA-A", 16px medium gray-900
  - Member count: "45 members", 14px gray-500

#### Navigation
- "Continue" button: indigo-600, right-aligned, rounded-lg

### Step 2: Upload CSV
#### Card Content
- Title: "Upload student list", 18px semibold gray-900
- Format hint: "CSV format: roll_no, college_email", 14px gray-500, with inline code styling (bg-gray-100, rounded)

#### Upload Zone
- Full width
- Border: 2px dashed gray-300
- Border radius: 12px
- Padding: 32px
- Centered content
- States:
  - Default: gray-300 border, white bg
  - Hover: indigo-400 border, indigo-50 bg
  - Has file: green border, green bg
- Content:
  - Upload cloud icon: 32x32px gray-400
  - Text: "Drop your CSV here or click to browse", 14px gray-600

#### Preview Table (after upload)
- Background: gray-50
- Border radius: 8px
- Padding: 16px
- Table: 12px text
- Header: gray-500 text
- Rows: gray-800 text

#### Navigation
- Back: "Back" text link, gray-600
- Next: "Match with GitHub" button, indigo-600

### Step 3: Verify Students
#### Card Content
- Title: "Verify matched accounts", 18px semibold gray-900
- Legend: green dot "Matched" + red dot "Unmatched", 12px

#### Matched List
- Border: 1px gray-200
- Border radius: 8px
- Max height: 256px, scrollable
- Dividers: 1px gray-100 between rows

#### Matched Row
- Padding: 12px
- Hover: gray-50
- Layout: flex row, gap 12px, items center
- Checkbox: 16x16, indigo-600
- Avatar: 32x32 rounded-full
- Name: 14px medium gray-900
- Email: 12px gray-500

#### Unmatched List
- Same border/divide pattern
- Max height: 192px
- Placeholder avatar: 32x32 bg-red-100 rounded-full with "?" in red-600

#### Download Link
- "Download unmatched list (CSV)", 14px indigo-600

#### Navigation
- Back + "Confirm & Send Invites" button

### Step 4: Confirm & Invite
#### Card Content
- Title: "Review and confirm", 18px semibold gray-900

#### Summary Rows (repeated)
- Background: gray-50
- Border radius: 8px
- Padding: 12px
- Layout: flex row, justify between
- Label: 14px gray-600
- Count: 14px medium, gray-900 or blue-600 or red-600

| Row | Label | Count Color |
|-----|-------|-------------|
| 1 | "Students to invite" | blue-600 |
| 2 | "Already org members" | gray-900 |
| 3 | "No GitHub account" | red-600 |

#### Confirm Button
- "Confirm & Send Invites", green-600 bg, white text, rounded-lg

### Step 5: Complete
#### Card Content
- Success icon: 64x64px bg-green-100 rounded-full, with 32x32px green-600 checkmark
- Title: "Onboarding complete!", 20px semibold gray-900, centered

#### Stats Grid
- 4 columns on desktop, 2 on mobile, gap 16px, max-width 512px centered
- Each stat: bg-gray-50, rounded-lg, padding 12px, centered
- Number: 24px bold, status color
- Label: 12px gray-500

| Stat | Color |
|------|-------|
| Invited | blue-600 |
| Already members | gray-900 |
| Errors | red-600 |
| Total | indigo-600 |

#### Links
- "View Roster" + "Onboard Another Class", indigo-600 text links, centered

---

## Page 9: Request Animator Role

### Layout
- Container: max-width 672px (max-w-3xl), centered, padding 48px 16px

### Header
| Element | Spec |
|---------|------|
| Title | "Request Animator Role", 30px bold gray-900 |
| Subtitle | "Request to become a class animator (class teacher). An admin will review your request.", 16px gray-600 |

### Form Card
- White card, 24px padding, rounded-xl, border gray-100
- Vertical stack, gap 24px

| Field | Type | Placeholder |
|-------|------|-------------|
| College Email | Text input | "yourname@kristujayanti.com" |
| Class Sections | Text input (comma-separated) | "MCA-A, MCA-B" |
| Reason | Textarea, 4 rows | "Why you need animator access" |

### Submit
- "Submit Request" button, indigo-600, rounded-lg
- Loading: "Submitting..."

### Success State
- Green-50 banner with green-700 text
- "Request submitted! An admin will review it shortly."

---

## Page 10: Approve Requests (Admin Only)

### Layout
- Container: max-width 896px (max-w-4xl), centered, padding 48px 16px

### Header
| Element | Spec |
|---------|------|
| Title | "Teacher Requests", 30px bold gray-900 |
| Subtitle | "Review and approve teacher role requests", 16px gray-600 |

### Request Card (repeated)
- White card, 24px padding, rounded-xl, border gray-100
- Layout: flex row, justify between, items center

| Element | Spec |
|---------|------|
| Left Side | Flex row, gap 16px, items center |
| Avatar | 40x40px rounded-full |
| Name | "newteacher", 16px semibold gray-900 |
| Email | "newteacher@kristujayanti.com", 14px gray-500 |
| Classes | "MCA-C", badge, indigo-100 bg |
| Requested | "Sep 2, 2026", 12px gray-400 |
| Right Side | Flex row, gap 8px |
| Approve Button | "Approve", green-600 bg, white text, rounded-lg, padding 8px 16px |
| Deny Button | "Deny", red-600 bg, white text, rounded-lg, padding 8px 16px |

### Empty State
- "No pending requests", 16px gray-500, centered

---

## Page 11: Roster View

### Layout
- Container: max-width 896px (max-w-4xl), centered, padding 48px 16px

### Header
| Element | Spec |
|---------|------|
| Title | "Student Roster", 30px bold gray-900 |
| Subtitle | "View all onboarded students across classes", 16px gray-600 |
| Action Buttons | "Onboard New Class" (indigo-600) + "Export CSV" (secondary) |

### Filter Bar
- Flex row, gap 16px, margin-bottom 24px
- Select: "All Classes", border gray-300, rounded-lg
- Search input: "Search by name or roll number...", border gray-300, rounded-lg

### Roster Table
- White card, rounded-xl, border gray-100, overflow hidden

#### Table Header
- Background: gray-50
- Border-bottom: 1px gray-200
- Columns: Roll No, Email, GitHub, Team, Status, Onboarded By
- Text: 12px medium gray-500, uppercase, letter-spacing 0.05em

#### Table Row
- Border-bottom: 1px gray-100
- Hover: gray-50
- Padding: 12px 16px
- Text: 14px gray-900

#### Status Badge in Table
- "Active": green-100 bg, green-700 text
- "Invited": yellow-100 bg, yellow-700 text
- "No Account": red-100 bg, red-700 text

### Empty State
- "No students found", centered, 16px gray-500

---

## Page 12: Code Review

### Layout
- Container: max-width 896px (max-w-4xl), centered, padding 48px 16px

### Header
| Element | Spec |
|---------|------|
| Title | "Review Submissions", 30px bold gray-900 |
| Subtitle | "Review student work and accept submissions", 16px gray-600 |

### Filter Bar
- Select: "All Assignments", border gray-300, rounded-lg

### Submission Card (repeated)
- White card, 24px padding, rounded-xl, border gray-100
- Layout: flex row, justify between

| Element | Spec |
|---------|------|
| Left Side | Flex column, gap 8px |
| Student | Avatar (40x40) + Name (16px semibold) + Roll No (14px gray-500) |
| Assignment | "Portfolio Website", 14px gray-600 |
| Links | "View Fork" + "View PR", 14px indigo-600 with external link icon |
| Status | Badge showing current status |
| Right Side | Action button |
| Accept Button | "Accept", green-600 bg, white text, rounded-lg (only if status is "submitted") |
| Already Accepted | Badge showing "Accepted" |

### Empty State
- "No submissions to review", centered, 16px gray-500

---

## User Flows

### Flow 1: Student Assignment Submission
```
Landing Page
  → Click "Sign in with GitHub"
  → GitHub OAuth redirect
  → Assignments Page
  → Click "Start" on assignment
  → Opens GitHub repo URL (new tab)
  → Fork repo on GitHub
  → Clone, build, push
  → Create PR on GitHub
  → My Dashboard shows "Submitted" status
  → Faculty reviews → marks "Accepted"
  → Dashboard shows "Accepted"
```

### Flow 2: Faculty Creates Assignment
```
Faculty Dashboard
  → Click "Assignments" button
  → /faculty/assignments
  → Click "Create Assignment"
  → /faculty/assignments/new
  → Fill form (title, problem statement, objectives, etc.)
  → Click "Create Assignment"
  → System creates GitHub repo with README
  → Success banner shows repo link
  → Assignment appears in student browser
```

### Flow 3: Faculty Onboards Students
```
Faculty Dashboard
  → Click "Onboard Students"
  → /faculty/onboard
  → Step 1: Select class team (MCA-A)
  → Step 2: Upload CSV (roll_no, college_email)
  → Step 3: Verify matched/unmatched accounts
  → Step 4: Confirm → Click "Send Invites"
  → Step 5: Summary (invited: 25, errors: 0)
```

### Flow 4: Teacher Requests Animator Role
```
Faculty Page (limited view)
  → Click "Request Animator Role"
  → /faculty/request
  → Fill form (email, classes, reason)
  → Submit
  → Admin sees request in /faculty/requests
  → Admin clicks "Approve"
  → Teacher gets full faculty access
  → Teacher added as team maintainer on GitHub
```

### Flow 5: Faculty Reviews Submission
```
Faculty Dashboard
  → Click "Review Submissions"
  → /faculty/review
  → Filter by assignment
  → Click "View PR" → opens GitHub
  → Review code on GitHub
  → Back to KJIT Classroom
  → Click "Accept"
  → Status changes to "Accepted"
```
