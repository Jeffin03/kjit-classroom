import Image from "next/image"

export default function Avatar({
  name,
  size = "md",
  image,
  className = "",
}: {
  name: string
  size?: "sm" | "md" | "lg"
  image?: string
  className?: string
}) {
  const initials =
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "K"

  const edge = size === "sm" ? 32 : size === "lg" ? 64 : 40
  const sizeClass =
    size === "sm"
      ? "size-8 text-xs"
      : size === "lg"
        ? "size-16 text-xl"
        : "size-10 text-sm"

  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={edge}
        height={edge}
        className={`${sizeClass} inline-flex shrink-0 rounded-full object-cover ring-1 ring-border ${className}`}
      />
    )
  }

  return (
    <span
      className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent ${className}`}
    >
      {initials}
    </span>
  )
}
