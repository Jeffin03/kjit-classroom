import type { ReactNode } from "react"

export type StatusTone =
  | "neutral"
  | "accent"
  | "success"
  | "caution"
  | "danger"
  | "reviewed"

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-[var(--color-canvas)] text-[var(--color-ink-muted)]",
  accent: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success-text)]",
  caution: "bg-[var(--color-caution-soft)] text-[var(--color-caution-text)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger-text)]",
  reviewed: "bg-[var(--color-reviewed-soft)] text-[var(--color-reviewed-text)]",
}

export default function StatusPill({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: StatusTone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-medium ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
