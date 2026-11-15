"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import ConfirmModal from "./ConfirmModal"

declare global {
  interface Window {
    NEXT_PUBLIC_INACTIVITY_WARN_MINUTES?: number
    NEXT_PUBLIC_INACTIVITY_SIGN_OUT_MINUTES?: number
  }
}

/**
 * SessionTimeout monitors user inactivity and warns before the server-side
 * session expires, then auto-signs out if the user doesn't respond.
 *
 * Reads NEXT_PUBLIC_INACTIVITY_WARN_MINUTES and NEXT_PUBLIC_INACTIVITY_SIGN_OUT_MINUTES
 * from the build env. Falls back to 30 and 2 minutes respectively.
 */
export default function SessionTimeout() {
  const { data: session, status } = useSession()
  const [showWarning, setShowWarning] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(0)

  const warnMinutesRef = useRef<number>(30)
  const signOutMinutesRef = useRef<number>(2)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastActivityRef = useRef<number>(0)

  const authenticated = status === "authenticated" && !!session

  // Read env-based config once on mount
  useEffect(() => {
    const warnEnv = window.NEXT_PUBLIC_INACTIVITY_WARN_MINUTES
    const signOutEnv = window.NEXT_PUBLIC_INACTIVITY_SIGN_OUT_MINUTES
    if (typeof warnEnv === "number") warnMinutesRef.current = warnEnv
    if (typeof signOutEnv === "number") signOutMinutesRef.current = signOutEnv
  }, [])

  const startCountdown = useCallback(() => {
    countdownRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!)
          countdownRef.current = null
          void signOut({ callbackUrl: "/signin" })
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const startTimer = useCallback(() => {
    const now = Date.now()
    const inactiveFor = now - lastActivityRef.current
    const warnAtMs = warnMinutesRef.current * 60 * 1000
    const signOutAtMs = signOutMinutesRef.current * 60 * 1000

    if (inactiveFor >= signOutAtMs) {
      void signOut({ callbackUrl: "/signin" })
      return
    }

    const timeUntilWarn = Math.max(0, warnAtMs - inactiveFor)
    timerRef.current = setTimeout(() => {
      setShowWarning(true)
      setSecondsRemaining(signOutMinutesRef.current * 60)
      startCountdown()
    }, timeUntilWarn)
  }, [startCountdown])

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    if (showWarning) setShowWarning(false)
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    startTimer()
  }, [showWarning, startTimer])

  const extendSession = useCallback(() => {
    setShowWarning(false)
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    lastActivityRef.current = Date.now()
    startTimer()
  }, [startTimer])

  // Track activity events
  useEffect(() => {
    if (!authenticated) return

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ]
    const handler = () => resetTimer()
    events.forEach((event) => {
      window.addEventListener(event, handler, { passive: true })
    })

    lastActivityRef.current = Date.now()
    startTimer()

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handler)
      })
      if (timerRef.current) clearTimeout(timerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [authenticated, resetTimer, startTimer])

  // Recalculate timer when session status changes
  useEffect(() => {
    if (!authenticated) return
    lastActivityRef.current = Date.now()
    if (timerRef.current) clearTimeout(timerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    timerRef.current = null
    countdownRef.current = null
    startTimer()
  }, [authenticated, startTimer])

  if (!authenticated || !showWarning) return null

  const minutes = Math.floor(secondsRemaining / 60)
  const secs = secondsRemaining % 60

  return (
    <ConfirmModal
      open
      title="Session expiring soon"
      body={
        <>
          For your security, your session will expire in{" "}
          <strong>
            {minutes}m {secs.toString().padStart(2, "0")}s
          </strong>{" "}
          of inactivity. Click below to stay signed in.
        </>
      }
      confirmLabel="Stay signed in"
      busy={false}
      onConfirm={extendSession}
      onCancel={() => {
        setShowWarning(false)
        if (countdownRef.current) {
          clearInterval(countdownRef.current)
          countdownRef.current = null
        }
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }}
    />
  )
}
