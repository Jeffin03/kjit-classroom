"use client"

import { useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import Button from "@/frontend/components/Button"
import { CheckIcon, GitHubIcon } from "@/frontend/components/Icons"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import logo from "@/frontend/assets/KJU_Logo.webp"

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "Your sign-in was denied. Try again with your college GitHub account.",
  OAuthAccountNotLinked:
    "This GitHub account is already linked to a different sign-in. Sign in with the account you used before.",
  Callback: "GitHub returned us to an invalid address. Please try again.",
  Configuration: "Sign-in is temporarily misconfigured. Contact your administrator.",
  Default: "Sign-in failed. Please try again.",
}

const SPRINTS: [string, boolean][] = [
  ["Abstract", true],
  ["Build", true],
  ["Iterate", false],
  ["Ship", false],
]

export default function SignIn({
  callbackUrl,
  error,
}: {
  callbackUrl: string
  error: string | null
}) {
  const { data: session, status } = useSession()
  const { isFaculty, loading: accessLoading } = useSessionUser()
  const router = useRouter()

  useEffect(() => {
    if (!session || accessLoading) return
    // Everyone post-login lands on their dashboard: faculty get the faculty
    // shell, students the student one. An explicit callbackUrl still wins.
    const target =
      isFaculty && callbackUrl === "/dashboard" ? "/faculty" : callbackUrl
    router.replace(target)
  }, [session, accessLoading, isFaculty, callbackUrl, router])

  const errorMessage = error
    ? ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default
    : null

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.2fr_1fr]">
      <section className="flex min-h-52 flex-col justify-between bg-ink p-8 text-white lg:min-h-screen lg:p-12">
        <div>
          {/* The seal is navy/blue on transparent: it needs a light tile on
              this dark panel or it reads as a smudge. */}
          <span className="flex size-10 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
            <Image
              src={logo}
              alt=""
              sizes="40px"
              priority
              className="size-full object-contain"
            />
          </span>
          <h1 className="mt-5 text-3xl font-semibold">KJIT Classroom</h1>
          <p className="mt-2 text-white/60">Project-based learning, on GitHub.</p>
        </div>
        <div className="my-12 hidden space-y-5 lg:block">
          {SPRINTS.map(([name, done], index) => (
            <div key={name} className="flex items-center gap-3">
              <span
                className={`flex size-8 items-center justify-center rounded-full ${
                  done ? "bg-accent" : "border border-white/30 text-white/50"
                }`}
              >
                {done ? <CheckIcon className="size-4" /> : index}
              </span>
              <span>Sprint {index} · {name}</span>
            </div>
          ))}
        </div>
        <p className="hidden text-xs text-white/40 lg:block">
          Read-only access. Your token stays on our servers.
        </p>
      </section>

      <section className="flex items-center justify-center bg-canvas p-5">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <GitHubIcon className="size-10" />
          <h2 className="mt-5 text-xl font-semibold">Sign in to KJIT Classroom</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Use the GitHub account you will use for your class repositories.
          </p>

          {errorMessage && (
            <div role="alert" className="mt-5 rounded-lg bg-danger-soft p-3 text-sm text-danger-text">
              {errorMessage}
            </div>
          )}

          {status === "loading" ? (
            <div className="mt-6 h-11 animate-pulse rounded-lg bg-border" />
          ) : (
            <Button
              large
              variant="ink"
              className="mt-6 w-full"
              onClick={() => signIn("github", { callbackUrl })}
            >
              <GitHubIcon className="size-5" />
              Sign in with GitHub
            </Button>
          )}

          <p className="mt-4 text-xs leading-5 text-ink-subtle">
            We use your account identity and repository links only for class
            submissions. Read-only access to your repositories so faculty can
            review your work.
          </p>

          <Button
            variant="ghost"
            className="mt-3 w-full"
            onClick={() => router.push("/")}
          >
            Back to home
          </Button>
        </div>
      </section>
    </main>
  )
}
