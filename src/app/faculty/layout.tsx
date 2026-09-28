import FacultyShell from "@/frontend/components/Faculty/FacultyShell"

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <FacultyShell>{children}</FacultyShell>
}
