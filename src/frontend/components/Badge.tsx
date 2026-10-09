export type BadgeStatus =
  | "not-started"
  | "in-progress"
  | "submitted"
  | "awaiting"
  | "partially-reviewed"
  | "reviewed"
  | "accepted"
  | "active"
  | "invited"
  | "no-account"
  | "pivoted"
  | "overdue"

const styles: Record<BadgeStatus, { label: string; className: string }> = {
  "not-started": { label: "Not started", className: "bg-canvas text-ink-muted" },
  "in-progress": { label: "In progress", className: "bg-accent-soft text-accent" },
  submitted: { label: "Awaiting review", className: "bg-caution-soft text-caution-text" },
  awaiting: {
    label: "Awaiting acceptance",
    className: "bg-caution-soft text-caution-text",
  },
  "partially-reviewed": {
    label: "Partially reviewed",
    className: "bg-reviewed-soft text-reviewed",
  },
  reviewed: { label: "Reviewed", className: "bg-reviewed-soft text-reviewed" },
  accepted: { label: "Accepted", className: "bg-success-soft text-success-text" },
  active: { label: "Active", className: "bg-success-soft text-success-text" },
  invited: { label: "Invited", className: "bg-caution-soft text-caution-text" },
  "no-account": { label: "No account", className: "bg-danger-soft text-danger-text" },
  pivoted: { label: "Pivoted", className: "bg-caution-soft text-caution-text" },
  overdue: { label: "Deadline passed", className: "bg-danger-soft text-danger-text" },
}

export default function Badge({
  status,
  className = "",
}: {
  status: BadgeStatus
  className?: string
}) {
  const item = styles[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${item.className} ${className}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {item.label}
    </span>
  )
}

export function SubjectBadge({ subject }: { subject: string }) {
  return (
    <span className="inline-flex rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
      {subject}
    </span>
  )
}
