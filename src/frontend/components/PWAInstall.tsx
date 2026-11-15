"use client"

import { useCallback, useEffect, useState } from "react"

declare global {
  interface Window {
    MSStream?: unknown
    webkitDeleteMessage?: unknown
  }

  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[]
    readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
    prompt(): Promise<void>
  }
}

/**
 * PWAInstall registers the service worker and shows an optional install prompt
 * when the browser supports installing the PWA (Chrome on Android, Edge, etc.).
 *
 * It listens for the `beforeinstallprompt` event and displays a dismissible
 * banner at the bottom of the screen inviting the user to install the app.
 * On iOS, it shows a one-time "Add to Home Screen" hint instead.
 */
export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<
    BeforeInstallPromptEvent | null
  >(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const registerServiceWorker = useCallback(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered:", registration.scope)
        })
        .catch((error) => {
          console.error("[PWA] Service Worker registration failed:", error)
        })
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => {
      const isIOSDevice =
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
      setIsIOS(isIOSDevice)
    })
  }, [])

  useEffect(() => {
    registerServiceWorker()
  }, [registerServiceWorker])

  // Listen for beforeinstallprompt (Chrome, Edge, etc.)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Only show the banner on non-iOS platforms that support installation
      if (!isIOS && !dismissed) {
        setShowInstallBanner(true)
      }
    }

    const handleAppInstalled = () => {
      console.log("[PWA] App installed")
      setShowInstallBanner(false)
      setDismissed(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      )
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [isIOS, dismissed])

  const installApp = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      setShowInstallBanner(false)
      setDismissed(true)
    } catch (err) {
      console.error("[PWA] Install prompt failed:", err)
    }
    setDeferredPrompt(null)
  }

  const dismissBanner = () => {
    setShowInstallBanner(false)
    setDismissed(true)
  }

  // iOS "Add to Home Screen" hint
  if (isIOS && !dismissed) {
    return (
      <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50">
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="size-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-ink">
                Install KJIT Classroom
              </h3>
              <p className="mt-0.5 text-xs text-ink-muted">
                Tap <b>Share</b>, then <b>Add to Home Screen</b> to install the
                app for offline access.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissBanner}
              className="ml-2 inline-flex size-6 items-center justify-center rounded-full text-ink-muted hover:bg-[var(--color-canvas)] hover:text-ink"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="size-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Chrome/Edge install banner
  if (showInstallBanner && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50">
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="size-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-ink">
                Install KJIT Classroom
              </h3>
              <p className="mt-0.5 text-xs text-ink-muted">
                Install the app for offline access and faster reviews in class.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={installApp}
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="size-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={dismissBanner}
                className="ml-2 inline-flex size-6 items-center justify-center rounded-full text-ink-muted hover:bg-[var(--color-canvas)] hover:text-ink"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="size-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
