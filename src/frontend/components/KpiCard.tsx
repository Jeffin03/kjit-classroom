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
      <span className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
          {label}
        </span>
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
          {icon}
        </span>
      </span>
      <strong className={`mt-3 block text-3xl font-semibold tracking-tight ${tones[tone]}`}>
        {value}
      </strong>
      <span className="mt-1 block truncate text-xs text-ink-subtle">{hint}</span>
    </>
  )

  const base =
    "min-h-28 w-full rounded-2xl border border-border bg-surface p-5 text-left transition-all hover:-translate-y-px hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"

  if (to) {
    return (
      <Link href={to} className={`${base} block`}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={base}>
        {content}
      </button>
    )
  }

  return <div className={`${base} hover:shadow-none hover:translate-y-0`}>{content}</div>
}
