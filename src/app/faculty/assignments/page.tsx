import { redirect } from "next/navigation"

/** Reached only via stale links — assignments are drilled into from class cards. */
export default function FacultyAssignmentsPage() {
  redirect("/faculty")
}
