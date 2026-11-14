"use client"

import { useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import Button from "@/frontend/components/Button"
import { CheckIcon, GitHubIcon } from "@/frontend/components/Icons"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import { TEST_ACCOUNTS, isDevTestAuthEnabled } from "@/backend/dev/testAccounts"
import logo from "@/frontend/assets/KJU_Logo.webp"
import signinBg from "@/frontend/assets/signin_bg.jpg"

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
      {/* Left branding panel: only shown on desktop/tablet (lg+).
          On phones the login card takes the full screen instead. */}
      <section className="relative hidden lg:flex min-h-52 flex-col justify-between overflow-hidden bg-ink text-white lg:min-h-screen lg:p-12">
        {/* Background photo with subtle dark gradient overlay */}
        <div className="absolute inset-0">
          <Image
            src={signinBg}
            alt="Kristu Jayanti University Campus"
            fill
            priority
            className="object-cover object-center"
            sizes="(min-width: 1024px) 55vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/85" />
        </div>

        <div className="relative z-10">
          {/* The seal is navy/blue on transparent: it needs a light tile on
              this dark panel or it reads as a smudge. */}
          <span className="flex size-10 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
            <Image
              src={logo}
              alt="Kristu Jayanti University"
              sizes="40px"
              priority
              className="size-full object-contain"
            />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white drop-shadow-xs">
            KJIT Classroom
          </h1>
          <p className="mt-2 text-base text-zinc-200 drop-shadow-xs">
            Project-based learning, on GitHub.
          </p>
        </div>
        <div className="relative z-10 my-12 hidden space-y-5 lg:block">
          {SPRINTS.map(([name, done], index) => (
            <div key={name} className="flex items-center gap-3.5">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  done
                    ? "bg-accent text-white shadow-xs"
                    : "border border-white/30 bg-black/40 text-zinc-200 backdrop-blur-xs"
                }`}
              >
                {done ? <CheckIcon className="size-4 text-white" /> : index}
              </span>
              <span
                className={`text-sm font-medium drop-shadow-xs ${
                  done ? "text-white" : "text-zinc-200"
                }`}
              >
                Sprint {index} · {name}
              </span>
            </div>
          ))}
        </div>
        <p className="relative z-10 hidden text-xs text-zinc-300 drop-shadow-xs lg:block">
          Read-only access. Your token stays on our servers.
        </p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden p-5 lg:min-h-0 lg:bg-canvas">
        {/* Mobile background photo: shown when left panel is hidden */}
        <div className="absolute inset-0 -z-0 lg:hidden">
          <Image
            src={signinBg}
            alt="Kristu Jayanti University Campus"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/65 backdrop-blur-xs" />
        </div>

        <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border/80 bg-surface/95 p-8 shadow-xl backdrop-blur-md lg:border-border lg:bg-surface lg:shadow-sm lg:backdrop-blur-none">
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
            <>
              <Button
                large
                variant="ink"
                className="mt-6 w-full"
                onClick={() => signIn("github", { callbackUrl })}
              >
                <GitHubIcon className="size-5" />
                Sign in with GitHub
              </Button>

              {isDevTestAuthEnabled() && (
                <div className="mt-6 space-y-2">
                  <p className="text-xs font-medium text-ink-subtle">
                    Dev test accounts (password: test)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {TEST_ACCOUNTS.map((account) => (
                      <Button
                        key={account.username}
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() =>
                          signIn("dev-test", {
                            username: account.username,
                            password: account.password,
                            callbackUrl,
                          })
                        }
                      >
                        {account.username}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
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
