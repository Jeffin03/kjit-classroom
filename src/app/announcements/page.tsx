"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Announcements are a module on every dashboard now — the old standalone page
 * sends existing links to the right place.
 */
export default function AnnouncementsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard#announcements")
  }, [router])

  return (
    <div className="mx-auto max-w-7xl p-8 text-sm text-ink-muted">
      Opening announcements…
    </div>
  )
}
