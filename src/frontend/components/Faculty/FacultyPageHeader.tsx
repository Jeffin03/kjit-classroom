import type { ReactNode } from "react"

export default function FacultyPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-[var(--color-ink-muted)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>
      ) : null}
    </div>
  )
}
