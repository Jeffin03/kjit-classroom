/**
 * Environment validation shared by startup instrumentation and /api/health.
 *
 * Missing configuration used to fail silently: without `AUTH_SECRET` every
 * request looks signed out, and without an org token nobody resolves as owner
 * or faculty, so the whole app renders as "unrostered" with no explanation.
 * Collect the problems in one place and surface them loudly.
 */

export interface EnvCheck {
  name: string
  ok: boolean
  hint?: string
}

function present(...keys: string[]): boolean {
  return keys.every((key) => !!process.env[key]?.trim())
}

function anyPresent(...keys: string[]): boolean {
  return keys.some((key) => !!process.env[key]?.trim())
}

export function checkEnv(): EnvCheck[] {
  const checks: EnvCheck[] = []

  const required = ["AUTH_SECRET", "AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET", "GITHUB_ORG"]
  for (const name of required) {
    checks.push({
      name,
      ok: present(name),
      hint: "Required for sign-in and role resolution",
    })
  }

  const orgToken = present("GITHUB_ORG_TOKEN")
  const appConfigured =
    present("GITHUB_APP_ID", "GITHUB_APP_INSTALLATION_ID") &&
    anyPresent("GITHUB_APP_PRIVATE_KEY", "GITHUB_APP_PRIVATE_KEY_PATH")

  checks.push({
    name: "GITHUB_ORG_TOKEN or GitHub App credentials",
    ok: orgToken || appConfigured,
    hint:
      "Used for org owners, faculty teams, invites, and team membership. " +
      "Without it nobody resolves as owner or faculty.",
  })

  if (
    process.env.VERCEL &&
    process.env.GITHUB_APP_PRIVATE_KEY_PATH &&
    !process.env.GITHUB_APP_PRIVATE_KEY
  ) {
    checks.push({
      name: "GITHUB_APP_PRIVATE_KEY (inline)",
      ok: false,
      hint:
        "GITHUB_APP_PRIVATE_KEY_PATH points at a file that does not exist on " +
        "Vercel. Set GITHUB_APP_PRIVATE_KEY to the PEM contents instead.",
    })
  }

  const persistence = present("DYNAMODB_TABLE")
  checks.push({
    name: "AWS_REGION",
    ok: !persistence || anyPresent("AWS_REGION", "AWS_DEFAULT_REGION"),
    hint: "Required when DYNAMODB_TABLE is set",
  })
  checks.push({
    name: "AWS credentials",
    ok:
      !persistence ||
      present("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY") ||
      anyPresent("AWS_SESSION_TOKEN", "AWS_PROFILE", "AWS_ROLE_ARN"),
    hint:
      "Required when DYNAMODB_TABLE is set (unless the platform supplies a role)",
  })

  return checks
}

export function envIssues(): string[] {
  return checkEnv()
    .filter((check) => !check.ok)
    .map((check) => check.name)
}
