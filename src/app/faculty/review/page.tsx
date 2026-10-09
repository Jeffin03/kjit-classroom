import FacultyReview from "@/frontend/components/Faculty/FacultyReview"

/**
 * The review queue is deep-linkable: KPI cards on the dashboards and class
 * detail pass `assignmentId`, `class`, and `status` so the queue opens already
 * filtered to the list the card counts.
 */
export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const read = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : undefined

  return (
    <FacultyReview
      assignmentParam={read("assignmentId")}
      classParam={read("class")}
      statusParam={read("status")}
    />
  )
}
