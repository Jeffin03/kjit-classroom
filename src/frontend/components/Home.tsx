"use client"

import { useSession } from "next-auth/react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import type { ReactNode } from "react"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import Button from "./Button"
import logo from "@/frontend/assets/KJU_Logo.webp"
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CheckIcon,
  ClipboardIcon,
  GitHubIcon,
  UsersIcon,
} from "./Icons"

const STEPS: [string, string][] = [
  ["Create your repo", "Start a new repository in your GitHub account."],
  ["Submit Sprint 0", "Paste its URL and link your abstract."],
  ["Build each sprint", "We snapshot your latest commit as you progress."],
  ["Get reviewed", "Receive notes and diff metrics at every sprint."],
]

const FEATURES: [string, string][] = [
  [
    "Student-owned repos",
    "Your code lives in your GitHub account. Keep it after graduation and show it in interviews.",
  ],
  [
    "Sprint 0 to Sprint 3",
    "Four checkpoints: abstract, build, iterate and ship. Pivot on feedback like a real product team.",
  ],
  [
    "Reviewed at every sprint",
    "Faculty leave notes on commits and diff metrics while the feedback still counts.",
  ],
]

const AUDIENCE: [string, string, ReactNode][] = [
  [
    "Student",
    "Track every sprint, get reviewed early, graduate with a pinned portfolio.",
    <ClipboardIcon key="student" className="size-5" />,
  ],
  [
    "Faculty",
    "Teach multiple classes in one place — class cards, per-assignment views, per-student sprint cards.",
    <UsersIcon key="faculty" className="size-5" />,
  ],
  [
    "Admin",
    "Onboard rosters by CSV, approve teacher access, watch org-wide progress.",
    <CheckCircleIcon key="admin" className="size-5" />,
  ],
]

const SPRINT_MOCK: [string, string][] = [
  ["Abstract", "Reviewed"],
  ["Build", "Reviewed"],
  ["Iterate", "In review"],
  ["Ship", "Not started"],
]

export default function Home() {
  const { data: session, status } = useSession()
  const { isFaculty, loading: accessLoading } = useSessionUser()
  const router = useRouter()
  const appLoading = status === "loading" || accessLoading
  const scrollRef = useRef<HTMLDivElement>(null)

  // Signed-in visitors came back to the marketing page by accident — their
  // post-login landing is their dashboard.
  useEffect(() => {
    if (session && !accessLoading) {
      router.replace(isFaculty ? "/faculty" : "/dashboard")
    }
  }, [session, accessLoading, isFaculty, router])

  const openApp = () => {
    if (appLoading) return
    router.push(session ? (isFaculty ? "/faculty" : "/dashboard") : "/signin")
  }

  return (
    // The landing page is its own scroll container so sections snap into
    // place on scroll; `scroll-mt-16` on each section offsets the sticky nav.
    <div
      ref={scrollRef}
      className="h-dvh snap-y snap-mandatory overflow-y-auto scroll-smooth bg-canvas"
    >
      <nav className="sticky top-0 z-30 border-b border-border bg-surface/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <button
            type="button"
            onClick={() =>
              scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="flex items-center gap-2"
          >
            <Image
              src={logo}
              alt=""
              sizes="32px"
              priority
              className="size-8 object-contain"
            />
            <strong>KJIT Classroom</strong>
          </button>
          <div className="hidden items-center gap-6 text-sm text-ink-muted sm:flex">
            <a href="#how-it-works" className="hover:text-ink">
              How it works
            </a>
            <a href="#features" className="hover:text-ink">
              Features
            </a>
          </div>
          <Button variant="ink" onClick={openApp} loading={appLoading}>
            {session ? "Open dashboard" : "Sign in with GitHub"}
          </Button>
        </div>
      </nav>

      <main>
        <section className="mx-auto grid max-w-7xl snap-start scroll-mt-16 items-center gap-16 px-5 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-accent">
              Project-based learning, on GitHub
            </span>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl">
              Your repo. Real work. A portfolio that outlives the course.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink-muted">
              KJIT Classroom runs project-based learning the way real teams work.
              Build in your own GitHub repository, submit at every sprint, and get
              feedback while you can still act on it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button large variant="ink" onClick={openApp} loading={appLoading}>
                <GitHubIcon className="size-5" />
                {session ? "Open dashboard" : "Sign in with GitHub"}
              </Button>
              <Button
                large
                variant="ghost"
                onClick={() => document.querySelector("#how-it-works")?.scrollIntoView()}
              >
                See how it works <ArrowRightIcon className="size-4" />
              </Button>
            </div>
            <p className="mt-6 text-xs leading-5 text-ink-subtle">
              Built for Kristu Jayanti Institute of Technology · Sprint 0 to Sprint 3 ·
              Your code stays in your GitHub account
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg transition-transform hover:-translate-y-px">
            <div className="flex items-start justify-between">
              <div>
                <strong className="text-lg">Portfolio Website</strong>
                <p className="text-sm text-ink-subtle">Web Development</p>
              </div>
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent">
                In review
              </span>
            </div>
            <div className="mt-8 space-y-5">
              {SPRINT_MOCK.map(([name, state], index) => (
                <div key={name} className="flex items-center gap-4">
                  <span
                    className={`flex size-8 items-center justify-center rounded-full ${
                      index < 2
                        ? "bg-success text-white"
                        : index === 2
                          ? "bg-caution text-white"
                          : "border border-border text-ink-subtle"
                    }`}
                  >
                    {index < 2 ? <CheckIcon className="size-4" /> : index}
                  </span>
                  <span className="flex-1">
                    <strong className="block text-sm">Sprint {index} · {name}</strong>
                    <span className="text-xs text-ink-subtle">{state}</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-8 border-t border-border pt-4 font-mono text-xs text-ink-subtle">
              commit a1b2c3d · +412 -87 · 12 files
            </p>
          </div>
        </section>

        <section
          id="how-it-works"
          className="snap-start scroll-mt-16 border-y border-border bg-surface py-20"
        >
          <div className="mx-auto max-w-7xl px-5">
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              From idea to reviewed project
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-4">
              {STEPS.map(([title, body], index) => (
                <div key={title}>
                  <span className="font-mono text-sm text-accent">0{index + 1}</span>
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 rounded-xl border-l-4 border-accent bg-accent-soft p-5 text-sm leading-6 text-ink-muted">
              <strong className="text-ink">No forks, no pull requests.</strong> You
              create your own GitHub repository, paste the URL, and KJIT Classroom
              snapshots your latest commit for faculty review. Your code stays in
              your account.
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto max-w-7xl snap-start scroll-mt-16 px-5 py-20"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            Built for learning by doing
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {FEATURES.map(([title, body]) => (
              <article
                key={title}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-muted">{body}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          id="audience"
          className="snap-start scroll-mt-16 border-t border-border bg-surface py-20"
        >
          <div className="mx-auto max-w-7xl px-5">
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              Who it&apos;s for
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Three seats, one workflow
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {AUDIENCE.map(([title, body, icon]) => (
                <article
                  key={title}
                  className="rounded-2xl border border-border bg-canvas p-6"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    {icon}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink-muted">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="snap-start scroll-mt-16 border-t border-border bg-accent-soft">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-5 py-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-ink">
              Ready to submit your first sprint?
            </h2>
            <Button large variant="ink" onClick={openApp} loading={appLoading}>
              <GitHubIcon className="size-5" />
              {session ? "Open dashboard" : "Sign in with GitHub"}
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-xs text-ink-subtle">
          <strong className="text-ink">KJIT Classroom</strong>
          <span>
            © 2026 Kristu Jayanti Institute of Technology · Not affiliated with
            GitHub, Inc.
          </span>
        </div>
      </footer>
    </div>
  )
}
