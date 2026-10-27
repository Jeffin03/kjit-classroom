"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useSessionUser } from "@/frontend/hooks/useSessionUser"
import Avatar from "./Avatar"
import logo from "@/frontend/assets/KJU_Logo.webp"

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { isFaculty, team, loading: accessLoading } = useSessionUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [menuOpen])

  // The landing page and sign-in render their own chrome; faculty uses the
  // sidebar shell.
  if (pathname === "/" || pathname === "/signin" || pathname.startsWith("/faculty")) {
    return null
  }

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`)

  const links: { label: string; href: string }[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Assignments", href: "/assignments" },
  ]

  const displayName = session?.user?.name || "Account"
  const image = session?.user?.image || undefined

  return (
    <nav className="sticky top-0 z-40 h-16 border-b border-border bg-surface">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href={session ? "/dashboard" : "/"}
            className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Image
              src={logo}
              alt=""
              sizes="32px"
              priority
              className="size-8 object-contain"
            />
            <strong className="hidden text-sm sm:block">KJIT Classroom</strong>
          </Link>

          {session && (
            <div className="flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                    isActive(link.href)
                      ? "bg-accent-soft text-accent"
                      : "text-ink-muted hover:bg-canvas hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              {!accessLoading && team && !isFaculty && (
                <span className="hidden rounded-full bg-canvas px-3 py-1 text-xs font-medium text-ink-muted md:block">
                  {team}
                </span>
              )}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                  className="flex items-center rounded-full focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <Avatar name={displayName} size="sm" image={image} />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-border bg-surface p-2 shadow-lg"
                  >
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-medium">{displayName}</p>
                      {team && (
                        <p className="truncate text-xs text-ink-subtle">{team}</p>
                      )}
                    </div>
                    <div className="my-1 h-px bg-border" />
                    {isFaculty && (
                      <Link
                        href="/faculty"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-canvas hover:text-ink"
                      >
                        Faculty dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        void signOut()
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink-muted hover:bg-canvas hover:text-ink"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/signin"
              className="bg-accent text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              Sign in with GitHub
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
