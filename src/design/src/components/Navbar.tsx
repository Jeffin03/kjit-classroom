type Page =
  | "landing"
  | "assignments"
  | "dashboard"
  | "announcements"
  | "faculty"
  | "faculty-create"
  | "faculty-onboard"
  | "faculty-review"
  | "faculty-roster"
  | "faculty-requests"
  | "faculty-request-role";

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isLoggedIn: boolean;
  isFaculty: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  user?: { name: string; avatar: string };
}

export default function Navbar({
  currentPage,
  onNavigate,
  isLoggedIn,
  isFaculty,
  onSignIn,
  onSignOut,
  user,
}: NavbarProps) {
  const navLinks: { label: string; page: Page; facultyOnly?: boolean }[] = [
    { label: "Assignments", page: "assignments" },
    { label: "My Dashboard", page: "dashboard" },
    { label: "Announcements", page: "announcements" },
    { label: "Faculty", page: "faculty", facultyOnly: true },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => onNavigate("landing")}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="text-gray-900 font-bold text-xl">KJIT Classroom</span>
          </button>

          {isLoggedIn && (
            <div className="ml-8 flex items-center gap-1">
              {navLinks.map(({ label, page, facultyOnly }) => {
                if (facultyOnly && !isFaculty) return null;
                const isActive = currentPage === page || (page === "faculty" && currentPage.startsWith("faculty"));
                return (
                  <button
                    key={page}
                    onClick={() => onNavigate(page)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn && user ? (
            <>
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-sm text-gray-700 hidden md:block">{user.name}</span>
              <button
                onClick={onSignOut}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={onSignIn}
              className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Sign in with GitHub
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
