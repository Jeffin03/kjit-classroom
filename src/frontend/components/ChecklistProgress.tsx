"use client"

export default function ChecklistProgress({
  current,
  total,
  compact = false,
}: {
  current: number
  total: number
  compact?: boolean
}) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100)

  return (
    <div>
      {!compact && (
        <div className="mb-1 flex items-center justify-between text-xs text-[var(--color-ink-muted)]">
          <span>
            Sprint {current} of {total}
          </span>
          <span>{pct}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={`${current} of ${total} sprints submitted`}
        className="h-1.5 w-full rounded-full bg-[var(--color-border)]"
      >
        <div
          className="h-1.5 rounded-full bg-[var(--color-accent)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
