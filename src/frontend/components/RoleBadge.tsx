import type { ReactNode } from "react"
import {
  StarFilledIcon,
  BookOpenIcon,
  BookmarkIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  UsersIcon,
} from "@/frontend/components/Icons"

export type RoleType =
  | "animator"
  | "subject-teacher"
  | "elective-teacher"
  | "owner"
  | "student"
  | "unrostered"
  | string

export interface RoleConfig {
  label: string
  shortLabel: string
  icon: (className?: string) => ReactNode
  badgeClass: string
  iconClass: string
}

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  animator: {
    label: "Class Animator",
    shortLabel: "Animator",
    icon: (cls = "size-3") => <StarFilledIcon className={cls} />,
    badgeClass: "bg-amber-100/90 text-amber-900 border border-amber-300/80 shadow-2xs",
    iconClass: "text-amber-600",
  },
  "subject-teacher": {
    label: "Subject Teacher",
    shortLabel: "Subject Faculty",
    icon: (cls = "size-3") => <BookOpenIcon className={cls} />,
    badgeClass: "bg-blue-50 text-blue-900 border border-blue-200/90 shadow-2xs",
    iconClass: "text-blue-600",
  },
  "elective-teacher": {
    label: "Elective Teacher",
    shortLabel: "Elective Faculty",
    icon: (cls = "size-3") => <BookmarkIcon className={cls} />,
    badgeClass: "bg-purple-50 text-purple-900 border border-purple-200/90 shadow-2xs",
    iconClass: "text-purple-600",
  },
  owner: {
    label: "Org Owner",
    shortLabel: "Admin",
    icon: (cls = "size-3") => <ShieldCheckIcon className={cls} />,
    badgeClass: "bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs",
    iconClass: "text-amber-700",
  },
  student: {
    label: "Student",
    shortLabel: "Student",
    icon: (cls = "size-3") => <AcademicCapIcon className={cls} />,
    badgeClass: "bg-emerald-50 text-emerald-900 border border-emerald-200/90 shadow-2xs",
    iconClass: "text-emerald-600",
  },
  unrostered: {
    label: "Not on Roster",
    shortLabel: "Unrostered",
    icon: (cls = "size-3") => <UsersIcon className={cls} />,
    badgeClass: "bg-canvas text-ink-muted border border-border shadow-2xs",
    iconClass: "text-ink-faint",
  },
}

export function getRoleConfig(role: string): RoleConfig {
  return (
    ROLE_CONFIGS[role] || {
      label: role,
      shortLabel: role,
      icon: (cls = "size-3") => <UsersIcon className={cls} />,
      badgeClass: "bg-accent-soft text-accent border border-accent/20",
      iconClass: "text-accent",
    }
  )
}

export default function RoleBadge({
  role,
  label,
  size = "sm",
  showIcon = true,
  className = "",
}: {
  role: string
  label?: string
  size?: "xs" | "sm" | "md"
  showIcon?: boolean
  className?: string
}) {
  const config = getRoleConfig(role)
  const displayLabel = label || config.label

  const sizeClasses = {
    xs: "px-2 py-0.5 text-[10px] gap-1",
    sm: "px-2.5 py-0.5 text-xs gap-1.5",
    md: "px-3 py-1 text-xs gap-2",
  }[size]

  const iconSizes = {
    xs: "size-2.5",
    sm: "size-3",
    md: "size-3.5",
  }[size]

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${config.badgeClass} ${sizeClasses} ${className}`}
    >
      {showIcon && config.icon(`${iconSizes} ${config.iconClass} shrink-0`)}
      <span>{displayLabel}</span>
    </span>
  )
}
