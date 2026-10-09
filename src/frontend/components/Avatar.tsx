import Image from "next/image"

export default function Avatar({
  name,
  size = "md",
  image,
}: {
  name: string
  size?: "sm" | "md"
  image?: string
}) {
  const initials =
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "K"

  const edge = size === "sm" ? 32 : 40

  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={edge}
        height={edge}
        className={`${size === "sm" ? "size-8" : "size-10"} inline-flex shrink-0 rounded-full object-cover ring-1 ring-border`}
      />
    )
  }

  return (
    <span
      className={`${size === "sm" ? "size-8 text-xs" : "size-10 text-sm"} inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent`}
    >
      {initials}
    </span>
  )
}
