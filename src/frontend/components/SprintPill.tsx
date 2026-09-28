import StatusPill, { type StatusTone } from "./StatusPill"

export type SprintState = "pending" | "submitted" | "reviewed" | "pivot"

const stateMeta: Record<SprintState, { label: string; tone: StatusTone }> = {
  pending: { label: "Pending", tone: "neutral" },
  submitted: { label: "Submitted", tone: "accent" },
  reviewed: { label: "Reviewed", tone: "reviewed" },
  pivot: { label: "Pivot", tone: "caution" },
}

export default function SprintPill({
  number,
  state,
}: {
  number?: number
  state: SprintState
}) {
  const meta = stateMeta[state]

  return (
    <StatusPill tone={meta.tone} className="px-2">
      {number !== undefined ? (
        <span className="sr-only">Sprint {number}: </span>
      ) : null}
      {meta.label}
    </StatusPill>
  )
}
