import { useState } from "react";
import type { Role } from "./data";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import StudentAssignments from "./pages/StudentAssignments";
import StudentTimeline from "./pages/StudentTimeline";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import FacultyAssignments from "./pages/FacultyAssignments";
import FacultyAssignmentDetail from "./pages/FacultyAssignmentDetail";
import FacultyStudentReview from "./pages/FacultyStudentReview";
import FacultyCreateAssignment from "./pages/FacultyCreateAssignment";
import FacultyRoster from "./pages/FacultyRoster";
import Announcements from "./pages/Announcements";

type Page =
  | "landing"
  | "s-assignments"
  | "s-timeline"
  | "s-dashboard"
  | "s-announcements"
  | "f-dashboard"
  | "f-assignments"
  | "f-assignment-detail"
  | "f-student-review"
  | "f-create-assignment"
  | "f-review"
  | "f-roster"
  | "f-announcements";

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [page, setPage] = useState<Page>("landing");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const navigate = (p: string) => setPage(p as Page);

  const signIn = (r: Role) => {
    setRole(r);
    setPage(r === "student" ? "s-assignments" : "f-dashboard");
  };

  const signOut = () => {
    setRole(null);
    setPage("landing");
  };

  const userName = role === "student" ? "aarav-m" : role === "faculty" ? "d.raval" : undefined;

  // Determine which page label to highlight in nav
  const navPage = page.startsWith("s-") || page.startsWith("f-") ? page : page;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <Navbar role={role} page={navPage} onNavigate={navigate} onSignOut={signOut} userName={userName} />

      {page === "landing" && <Landing onSignIn={signIn} />}

      {/* Student pages */}
      {page === "s-assignments" && (
        <StudentAssignments
          onViewAssignment={id => { setSelectedAssignmentId(id); setPage("s-timeline"); }}
        />
      )}
      {page === "s-timeline" && selectedAssignmentId && (
        <StudentTimeline
          assignmentId={selectedAssignmentId}
          onBack={() => setPage("s-assignments")}
        />
      )}
      {page === "s-dashboard" && (
        <StudentDashboard
          onViewAssignment={id => { setSelectedAssignmentId(id); setPage("s-timeline"); }}
        />
      )}
      {page === "s-announcements" && <Announcements />}

      {/* Faculty pages */}
      {page === "f-dashboard" && (
        <FacultyDashboard
          onViewStudent={id => { setSelectedSubmissionId(id); setPage("f-student-review"); }}
        />
      )}
      {page === "f-assignments" && (
        <FacultyAssignments
          onViewDetail={id => { setSelectedAssignmentId(id); setPage("f-assignment-detail"); }}
          onCreateNew={() => setPage("f-create-assignment")}
        />
      )}
      {page === "f-assignment-detail" && selectedAssignmentId && (
        <FacultyAssignmentDetail
          assignmentId={selectedAssignmentId}
          onBack={() => setPage("f-assignments")}
          onViewStudent={id => { setSelectedSubmissionId(id); setPage("f-student-review"); }}
        />
      )}
      {page === "f-student-review" && selectedSubmissionId && (
        <FacultyStudentReview
          submissionId={selectedSubmissionId}
          onBack={() => {
            if (selectedAssignmentId) setPage("f-assignment-detail");
            else setPage("f-dashboard");
          }}
        />
      )}
      {page === "f-create-assignment" && (
        <FacultyCreateAssignment onBack={() => setPage("f-assignments")} />
      )}
      {page === "f-roster" && <FacultyRoster />}
      {page === "f-review" && (
        <FacultyDashboard
          onViewStudent={id => { setSelectedSubmissionId(id); setPage("f-student-review"); }}
        />
      )}
      {page === "f-announcements" && <Announcements />}
    </div>
  );
}
