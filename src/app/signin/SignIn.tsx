"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession, signIn } from "next-auth/react"

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Your sign-in was denied. Try again with your college GitHub account.",
  OAuthAccountNotLinked:
    "This GitHub account is already linked to a different sign-in. Sign in with the account you used before.",
  Callback: "GitHub returned us to an invalid address. Please try again.",
  Configuration: "Sign-in is temporarily misconfigured. Contact your administrator.",
  Default: "Sign-in failed. Please try again.",
}

const FEATURES = [
  {
    title: "Student-owned repos",
    body: "Projects live in your GitHub account. Pin them, show them to employers.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    ),
  },
  {
    title: "Sprint-driven learning",
    body: "Sprint 0 to Sprint 3 — commit, document, pivot on feedback.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    ),
  },
  {
    title: "Continuous faculty review",
    body: "Faculty review code, docs, and diff metrics at every sprint.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    ),
  },
]

export default function SignIn({
  callbackUrl,
  error,
}: {
  callbackUrl: string
  error: string | null
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) router.replace(callbackUrl)
  }, [session, callbackUrl, router])

  const errorMessage = error
    ? ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default
    : null

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
      {/* Brand panel */}
      <div className="lg:w-1/2 bg-[var(--color-accent)] text-white flex flex-col justify-center px-8 py-14 lg:px-16">
        <div className="max-w-md mx-auto lg:mx-0 w-full">
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mb-7">
            <span className="font-semibold text-2xl tracking-tight">K</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            KJIT Classroom
          </h1>
          <p className="text-lg text-white/80 mb-10 leading-relaxed">
            GitHub-native project submission &amp; portfolio management for
            4-sprint PBL.
          </p>

          <ul className="space-y-6">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4">
                <div className="w-9 h-9 shrink-0 bg-white/15 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {f.icon}
                  </svg>
                </div>
                <div>
                  <div className="font-medium">{f.title}</div>
                  <div className="text-sm text-white/70 leading-relaxed">
                    {f.body}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sign-in panel */}
      <div className="lg:w-1/2 flex items-center justify-center px-6 py-14 bg-[var(--color-canvas)]">
        <div className="w-full max-w-sm text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)] mb-2">
            Sign in to continue
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)] mb-8">
            Use the GitHub account you&apos;ll use for your class repositories.
          </p>

          {errorMessage && (
            <div className="mb-6 rounded-md border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-3 text-left">
              <p className="text-sm text-[var(--color-danger)]">
                {errorMessage}
              </p>
            </div>
          )}

          {status === "loading" ? (
            <div className="h-14 animate-pulse bg-[var(--color-border)] rounded-xl w-full" />
          ) : (
            <button
              onClick={() => signIn("github", { callbackUrl })}
              className="w-full inline-flex items-center justify-center gap-3 bg-[var(--color-ink)] text-white px-6 py-4 rounded-xl text-lg font-medium hover:opacity-90 transition-opacity shadow-lg"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Sign in with GitHub
            </button>
          )}

          <p className="mt-6 text-xs text-[var(--color-ink-faint)] leading-relaxed">
            We request <code className="bg-[var(--color-border)] px-1 rounded font-mono" style={{ fontFamily: "var(--font-mono)" }}>repo</code>,{" "}
            <code className="bg-[var(--color-border)] px-1 rounded font-mono" style={{ fontFamily: "var(--font-mono)" }}>read:org</code>,{" "}
            <code className="bg-[var(--color-border)] px-1 rounded font-mono" style={{ fontFamily: "var(--font-mono)" }}>read:user</code>{" "}
            and <code className="bg-[var(--color-border)] px-1 rounded font-mono" style={{ fontFamily: "var(--font-mono)" }}>user:email</code> so
            faculty can review your work. Your access token stays on our
            servers.
          </p>

          <Link
            href="/"
            className="mt-6 inline-block text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] font-medium"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
