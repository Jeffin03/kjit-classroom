import FacultyRoster from "@/frontend/components/Faculty/FacultyRoster"

/** `?class=` opens the roster pre-filtered (class detail KPI click-through). */
export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const classParam = typeof params.class === "string" ? params.class : undefined
  return <FacultyRoster classParam={classParam} />
}
