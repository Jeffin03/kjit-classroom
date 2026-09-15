import FacultyReview from "@/frontend/components/FacultyReview"

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const assignmentParam =
    typeof params.assignmentId === "string" ? params.assignmentId : undefined
  return <FacultyReview assignmentParam={assignmentParam} />
}