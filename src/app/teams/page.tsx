import TeamManager from "@/frontend/components/Student/TeamManager"

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const assignmentId =
    typeof params.assignmentId === "string" ? params.assignmentId : undefined

  return <TeamManager assignmentId={assignmentId} />
}
