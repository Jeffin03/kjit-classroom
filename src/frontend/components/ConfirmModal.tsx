"use client"

import { useEffect, useRef } from "react"
import Button from "./Button"
import { TrashIcon } from "./Icons"

export default function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = "Remove",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", onKeyDown)
    confirmRef.current?.focus()
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 bg-ink/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl"
      >
        <span className="flex size-10 items-center justify-center rounded-xl bg-danger-soft text-danger">
          <TrashIcon className="size-5" />
        </span>
        <h2 id="confirm-modal-title" className="mt-4 text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">{body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            variant="danger"
            type="button"
            onClick={onConfirm}
            disabled={busy}
            loading={busy}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
