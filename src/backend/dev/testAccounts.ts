/**
 * Dev-only test accounts used to exercise every role without real GitHub
 * identities. Enabled only when `DEV_TEST_AUTH=true` (and never in production
 * builds). Each account resolves to a fixed role + scope so the permission
 * matrix can be exercised end-to-end.
 */
export interface TestAccount {
  username: string
  password: string
  role:
    | "owner"
    | "animator"
    | "subject-teacher"
    | "elective-teacher"
    | "student"
    | "unrostered"
  /** Class teams the account teaches (for scoped teachers). */
  classes?: string[]
  /** Class team the account belongs to (for students). */
  team?: string | null
  /** Display name shown in the UI. */
  name: string
}

export const TEST_CLASSES = ["MCA-A-2025-26", "MCA-B-2025-26"]

export const TEST_ACCOUNTS: TestAccount[] = [
  {
    username: "test-owner",
    password: "test",
    role: "owner",
    name: "Test Owner",
  },
  {
    username: "test-animator",
    password: "test",
    role: "animator",
    name: "Test Animator",
  },
  {
    username: "test-subject",
    password: "test",
    role: "subject-teacher",
    classes: ["MCA-A-2025-26"],
    name: "Test Subject Teacher",
  },
  {
    username: "test-elective",
    password: "test",
    role: "elective-teacher",
    classes: ["MCA-B-2025-26"],
    name: "Test Elective Teacher",
  },
  {
    username: "test-student",
    password: "test",
    role: "student",
    team: "MCA-A-2025-26",
    name: "Test Student",
  },
  {
    username: "test-unrostered",
    password: "test",
    role: "unrostered",
    name: "Test Unrostered",
  },
]

export function isDevTestAuthEnabled(): boolean {
  return (
    process.env.DEV_TEST_AUTH === "true" ||
    process.env.NEXT_PUBLIC_DEV_TEST_AUTH === "true"
  )
}

export function getTestAccount(username: string): TestAccount | undefined {
  if (!isDevTestAuthEnabled()) return undefined
  return TEST_ACCOUNTS.find(
    (a) => a.username.toLowerCase() === username.toLowerCase()
  )
}
