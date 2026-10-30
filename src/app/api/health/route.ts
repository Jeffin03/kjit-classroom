import { NextResponse } from "next/server"
import { checkEnv } from "@/backend/env"

/**
 * Unauthenticated deployment diagnostic. Intentionally reveals only which
 * configuration names are missing — never their values.
 */
export async function GET() {
  const checks = checkEnv()
  const ok = checks.every((check) => check.ok)

  return NextResponse.json(
    {
      ok,
      checks: checks.map((check) => ({
        name: check.name,
        ok: check.ok,
        ...(check.ok ? {} : { hint: check.hint }),
      })),
    },
    { status: ok ? 200 : 503 }
  )
}
