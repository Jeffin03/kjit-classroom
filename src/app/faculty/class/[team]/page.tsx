import FacultyClassDetail from "@/frontend/components/Faculty/FacultyClassDetail"

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ team: string }>
}) {
  const { team } = await params
  return <FacultyClassDetail team={decodeURIComponent(team)} />
}
