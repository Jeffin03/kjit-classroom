"use client"

import { useEffect } from "react"

export interface ToastMessage {
  id: number
  text: string
  actionLabel?: string
}

export default function Toast({
  toast,
  onAction,
  onDismiss,
}: {
  toast: ToastMessage | null
  onAction?: () => void
  onDismiss: () => void
}) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.id])

  if (!toast) return null

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-4 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-xl"
    >
      <span>{toast.text}</span>
      {toast.actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="font-medium text-accent-soft hover:underline"
        >
          {toast.actionLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        className="font-medium text-white/60 hover:text-white"
      >
        Dismiss
      </button>
    </div>
  )
}
