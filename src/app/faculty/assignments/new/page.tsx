import NewAssignment from "@/frontend/components/Faculty/NewAssignment"

export default async function NewAssignmentPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; class?: string; team?: string }>
}) {
  const { edit, class: classParam, team } = await searchParams
  return <NewAssignment assignmentId={edit} initialClass={classParam || team} />
}
