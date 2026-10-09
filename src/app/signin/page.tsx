import type { Metadata } from "next"
import { headers } from "next/headers"
import SignIn from "./SignIn"

export const metadata: Metadata = {
  title: "Sign in — KJIT Classroom",
  description:
    "Sign in with GitHub to access KJIT Classroom assignments and reviews",
}

/**
 * Post-login destinations must stay on this origin. Relative paths (`/…`)
 * are accepted as-is; absolute URLs are accepted only when their host
 * matches this request's Host (Auth.js normalizes callbackUrls to absolute
 * URLs when it redirects here). Everything else falls back to the default
 * landing — no open redirects.
 */
async function sanitizeCallbackUrl(
  value: string | string[] | undefined
): Promise<string> {
  if (typeof value !== "string") return "/dashboard"
  if (value.startsWith("/") && !value.startsWith("//")) return value

  try {
    const url = new URL(value)
    const host = (await headers()).get("host")
    if (host && url.host === host) return url.pathname + url.search
  } catch {
    // Not a parseable absolute URL — fall through.
  }
  return "/dashboard"
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const error = typeof params.error === "string" ? params.error : null
  const callbackUrl = await sanitizeCallbackUrl(params.callbackUrl)

  return <SignIn callbackUrl={callbackUrl} error={error} />
}
