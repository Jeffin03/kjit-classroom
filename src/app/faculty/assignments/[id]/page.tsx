import FacultyAssignmentDetail from "@/frontend/components/FacultyAssignmentDetail"

export default async function FacultyAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <FacultyAssignmentDetail assignmentId={id} />
}