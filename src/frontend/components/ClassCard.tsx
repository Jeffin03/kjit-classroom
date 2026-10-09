import Link from "next/link"
import { ChevronRightIcon, UsersIcon } from "./Icons"

interface Props {
  team: string
  students: number
  assignments: number
  inProgress: number
  toReview: number
  subjects: string[]
}

export default function ClassCard({
  team,
  students,
  assignments,
  inProgress,
  toReview,
  subjects,
}: Props) {
  const live = assignments

  return (
    <Link
      href={`/faculty/class/${encodeURIComponent(team)}`}
      className="card-interactive block rounded-2xl border border-border bg-surface p-6"
    >
      <div className="flex items-start gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <UsersIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{team}</p>
          <p className="mt-0.5 truncate text-xs text-ink-muted">
            {subjects.length ? subjects.join(" · ") : "No subjects yet"}
          </p>
        </div>
        <ChevronRightIcon className="size-4 shrink-0 text-ink-faint" />
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2">
        {[
          ["Students", students],
          ["Assignments", assignments],
          ["In progress", inProgress],
          ["To review", toReview],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <p className="text-lg font-semibold">{value as number}</p>
            <p className="text-[10px] uppercase tracking-wide text-ink-faint">
              {label as string}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-ink-subtle">
        <span>
          {subjects.length} subject{subjects.length === 1 ? "" : "s"} · {live} live
          assignment{live === 1 ? "" : "s"}
        </span>
        <span className="font-medium text-accent">Open ›</span>
      </div>
    </Link>
  )
}
