import { useState } from "react";
import Navbar from "./components/Navbar";
import Landing from "./components/Landing";
import Assignments from "./components/Assignments";
import StudentDashboard from "./components/StudentDashboard";
import Announcements from "./components/Announcements";
import FacultyDashboard from "./components/FacultyDashboard";
import CreateAssignment from "./components/CreateAssignment";
import OnboardingWizard from "./components/OnboardingWizard";
import RequestAnimator from "./components/RequestAnimator";
import ApproveRequests from "./components/ApproveRequests";
import RosterView from "./components/RosterView";
import CodeReview from "./components/CodeReview";
import FacultyTabBar from "./components/FacultyPage";

type Page =
  | "landing"
  | "assignments"
  | "dashboard"
  | "announcements"
  | "faculty"
  | "faculty-create"
  | "faculty-review"
  | "faculty-onboard"
  | "faculty-roster"
  | "faculty-requests"
  | "faculty-request-role";

const MOCK_USER = {
  name: "Ananya Sharma",
  avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Ananya+Sharma&backgroundColor=4F46E5&textColor=ffffff",
};

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFaculty] = useState(true);

  const navigate = (p: Page) => setPage(p);

  const signIn = () => {
    setIsLoggedIn(true);
    setPage("assignments");
  };

  const signOut = () => {
    setIsLoggedIn(false);
    setPage("landing");
  };

  const isFacultyPage = page.startsWith("faculty");

  return (
    <div className="min-h-full bg-gray-50">
      <Navbar
        currentPage={page}
        onNavigate={navigate}
        isLoggedIn={isLoggedIn}
        isFaculty={isFaculty}
        onSignIn={signIn}
        onSignOut={signOut}
        user={isLoggedIn ? MOCK_USER : undefined}
      />

      {isFacultyPage && (
        <FacultyTabBar
          currentPage={page as "faculty" | "faculty-create" | "faculty-review" | "faculty-onboard" | "faculty-roster" | "faculty-requests" | "faculty-request-role"}
          onNavigate={navigate}
          isFaculty={isFaculty}
        />
      )}

      {page === "landing" && (
        <Landing
          isLoggedIn={isLoggedIn}
          onSignIn={signIn}
          onNavigate={(p) => navigate(p)}
        />
      )}

      {page === "assignments" && isLoggedIn && <Assignments />}
      {page === "dashboard" && isLoggedIn && <StudentDashboard />}
      {page === "announcements" && isLoggedIn && <Announcements />}

      {page === "faculty" && isLoggedIn && (
        <FacultyDashboard
          onNavigate={(p) => navigate(p as Page)}
        />
      )}
      {page === "faculty-create" && isLoggedIn && (
        <CreateAssignment onBack={() => navigate("faculty")} />
      )}
      {page === "faculty-onboard" && isLoggedIn && (
        <OnboardingWizard onBack={() => navigate("faculty-roster")} />
      )}
      {page === "faculty-request-role" && isLoggedIn && (
        <RequestAnimator onBack={() => navigate("faculty")} />
      )}
      {page === "faculty-requests" && isLoggedIn && <ApproveRequests />}
      {page === "faculty-roster" && isLoggedIn && <RosterView />}
      {page === "faculty-review" && isLoggedIn && <CodeReview />}

      {!isLoggedIn && page !== "landing" && (
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <span className="text-white font-bold text-3xl">K</span>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Sign in to KJIT Classroom</h2>
          <p className="mt-2 text-sm text-gray-500">Use your GitHub account to continue</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <button
            onClick={signIn}
            className="mt-4 w-full flex items-center justify-center gap-3 bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            Continue with GitHub
          </button>
          <p className="mt-4 text-xs text-gray-400">By signing in, you agree to our Terms of Service</p>
        </div>
      )}
    </div>
  );
}
