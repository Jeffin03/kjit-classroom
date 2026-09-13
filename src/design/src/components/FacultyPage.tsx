type Page =
  | "faculty"
  | "faculty-create"
  | "faculty-review"
  | "faculty-onboard"
  | "faculty-roster"
  | "faculty-requests"
  | "faculty-request-role";

interface FacultyPageProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isFaculty: boolean;
}

const facultyNav: { label: string; page: Page; facultyOnly?: boolean }[] = [
  { label: "Dashboard", page: "faculty" },
  { label: "Create Assignment", page: "faculty-create", facultyOnly: true },
  { label: "Review Submissions", page: "faculty-review", facultyOnly: true },
  { label: "Onboard Students", page: "faculty-onboard", facultyOnly: true },
  { label: "View Roster", page: "faculty-roster", facultyOnly: true },
  { label: "Approve Requests", page: "faculty-requests", facultyOnly: true },
  { label: "Request Animator Role", page: "faculty-request-role" },
];

export default function FacultyTabBar({
  currentPage,
  onNavigate,
  isFaculty,
}: FacultyPageProps) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {facultyNav.map(({ label, page, facultyOnly }) => {
            if (facultyOnly && !isFaculty) return null;
            const isActive = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
