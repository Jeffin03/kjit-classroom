import Link from "next/link"
import type { ReactNode } from "react"
import type { StatusTone } from "./StatusPill"

const valueTones: Record<StatusTone, string> = {
  neutral: "text-[var(--color-ink)]",
  accent: "text-[var(--color-accent)]",
  success: "text-[var(--color-success-text)]",
  caution: "text-[var(--color-caution-text)]",
  danger: "text-[var(--color-danger-text)]",
  reviewed: "text-[var(--color-reviewed-text)]",
}

export default function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  to,
}: {
  label: string
  value: ReactNode
  hint?: string
  tone?: StatusTone
  to?: string
}) {
  const body = (
    <>
      <span className="text-sm text-[var(--color-ink-muted)]">{label}</span>
      <div
        className={`mt-2 text-3xl font-semibold tracking-tight ${valueTones[tone]}`}
      >
        {value}
      </div>
      {hint ? (
        <p className="mt-1.5 text-xs text-[var(--color-ink-muted)]">{hint}</p>
      ) : null}
    </>
  )

  const className =
    "rounded-2xl border border-[var(--color-border)] bg-white p-5"

  if (to) {
    return (
      <Link
        href={to}
        className={`card-interactive block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] ${className}`}
      >
        {body}
      </Link>
    )
  }

  return <div className={className}>{body}</div>
}
