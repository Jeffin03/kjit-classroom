import NewAssignment from "@/frontend/components/Faculty/NewAssignment"

export default async function NewAssignmentPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  return <NewAssignment assignmentId={edit} />
}
