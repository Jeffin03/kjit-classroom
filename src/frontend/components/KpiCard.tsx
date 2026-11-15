import Link from "next/link"
import type { ReactNode } from "react"

interface Props {
  label: string
  value: string | number
  hint: string
  icon?: ReactNode
  tone?: "neutral" | "accent" | "success" | "caution" | "danger"
  to?: string
  onClick?: () => void
}

const tones = {
  neutral: "text-ink",
  accent: "text-accent",
  success: "text-success",
  caution: "text-caution",
  danger: "text-danger",
}

const iconTones = {
  neutral: "bg-[var(--color-canvas)] text-ink-muted",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  caution: "bg-caution-soft text-caution",
  danger: "bg-danger-soft text-danger",
}

export default function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  to,
  onClick,
}: Props) {
  const content = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-subtle pt-0.5">
          {label}
        </span>
        {icon && (
          <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${iconTones[tone]}`}>
            {icon}
          </span>
        )}
      </span>
      <strong className={`mt-3 block text-3xl font-bold tracking-tight leading-none ${tones[tone]} break-words`}>
        {value}
      </strong>
      <span className="mt-2 block truncate text-xs text-ink-subtle">{hint}</span>
    </>
  )

  const base =
    "min-h-28 w-full rounded-2xl border border-border bg-surface p-5 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
  const interactive =
    "hover:-translate-y-0.5 hover:shadow-md hover:border-border cursor-pointer"

  if (to) {
    return (
      <Link href={to} className={`${base} ${interactive} block`}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${interactive}`}>
        {content}
      </button>
    )
  }

  return <div className={base}>{content}</div>
}
