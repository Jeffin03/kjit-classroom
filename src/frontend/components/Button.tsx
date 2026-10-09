import type { ButtonHTMLAttributes, ReactNode, Ref } from "react"

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger" | "ink"
  large?: boolean
  loading?: boolean
  ref?: Ref<HTMLButtonElement>
  children: ReactNode
}

export default function Button({
  variant = "primary",
  large,
  loading,
  className = "",
  children,
  disabled,
  ...props
}: Props) {
  const variants = {
    primary: "bg-accent text-white hover:bg-accent-hover",
    outline: "border border-border bg-surface text-ink hover:bg-canvas",
    ghost: "text-ink-muted hover:bg-canvas hover:text-ink",
    danger: "bg-danger text-white hover:opacity-90",
    ink: "bg-ink text-white hover:opacity-90",
  }
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 ${
        large ? "min-h-11 text-sm" : "h-9 text-sm"
      } ${variants[variant]} ${className}`}
    >
      {loading && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      )}
      {children}
    </button>
  )
}
