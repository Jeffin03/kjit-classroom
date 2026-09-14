import type { Role } from "../data";

interface NavbarProps {
  role: Role | null;
  page: string;
  onNavigate: (page: string) => void;
  onSignOut: () => void;
  userName?: string;
}

export default function Navbar({ role, page, onNavigate, onSignOut, userName }: NavbarProps) {
  const studentLinks = [
    { id: "s-assignments", label: "Assignments" },
    { id: "s-dashboard", label: "My Dashboard" },
    { id: "s-announcements", label: "Announcements" },
  ];

  const facultyLinks = [
    { id: "f-dashboard", label: "Dashboard" },
    { id: "f-assignments", label: "Assignments" },
    { id: "f-review", label: "Review" },
    { id: "f-roster", label: "Roster" },
    { id: "f-announcements", label: "Announcements" },
  ];

  const links = role === "student" ? studentLinks : role === "faculty" ? facultyLinks : [];

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ borderColor: "var(--color-border)", background: "rgba(11,15,26,0.95)", backdropFilter: "blur(8px)" }}>
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center gap-6">
        <button onClick={() => onNavigate("landing")} className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold mono" style={{ background: "var(--color-accent)", color: "#fff" }}>K</div>
          <span className="font-semibold tracking-tight text-sm mono" style={{ color: "var(--color-text)" }}>KJIT Classroom</span>
        </button>

        {role && (
          <div className="flex items-center gap-1 flex-1">
            {links.map(link => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                style={{
                  color: page === link.id ? "var(--color-text)" : "var(--color-muted)",
                  background: page === link.id ? "var(--color-surface-2)" : "transparent",
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          {role ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}>
                  {userName?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs mono" style={{ color: "var(--color-muted)" }}>{userName}</span>
                <span className="text-xs px-1.5 py-0.5 rounded mono uppercase tracking-wider" style={{ background: role === "faculty" ? "var(--color-amber-dim)" : "var(--color-green-dim)", color: role === "faculty" ? "var(--color-amber)" : "var(--color-green)", fontSize: "10px" }}>{role}</span>
              </div>
              <button onClick={onSignOut} className="text-xs px-3 py-1.5 rounded border transition-colors hover:border-blue-500" style={{ color: "var(--color-muted)", borderColor: "var(--color-border)" }}>
                Sign out
              </button>
            </>
          ) : (
            <span className="text-xs mono" style={{ color: "var(--color-muted)" }}>KJIT · CE Dept</span>
          )}
        </div>
      </div>
    </nav>
  );
}
