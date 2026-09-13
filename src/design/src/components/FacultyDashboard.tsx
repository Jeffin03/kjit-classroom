type Page =
  | "faculty-create"
  | "faculty-review"
  | "faculty-onboard"
  | "faculty-roster"
  | "faculty-requests";

interface FacultyDashboardProps {
  onNavigate: (page: Page) => void;
}

const submissions = [
  { id: 1, name: "Ananya Sharma", rollNo: "MCA22001", assignment: "Portfolio Website", status: "submitted" as const, avatar: "A" },
  { id: 2, name: "Rohit Krishnan", rollNo: "MCA22002", assignment: "Portfolio Website", status: "merged" as const, avatar: "R" },
  { id: 3, name: "Divya Nair", rollNo: "MCA22003", assignment: "Graph Traversal Visualizer", status: "forked" as const, avatar: "D" },
  { id: 4, name: "Arun Pillai", rollNo: "MCA22004", assignment: "Portfolio Website", status: "reviewed" as const, avatar: "A" },
  { id: 5, name: "Sneha Raj", rollNo: "MCA22005", assignment: "Graph Traversal Visualizer", status: "submitted" as const, avatar: "S" },
];

const statusConfig = {
  forked: { label: "Forked", bg: "bg-yellow-100", text: "text-yellow-700" },
  submitted: { label: "Submitted", bg: "bg-blue-100", text: "text-blue-700" },
  reviewed: { label: "Reviewed", bg: "bg-purple-100", text: "text-purple-700" },
  merged: { label: "Merged", bg: "bg-green-100", text: "text-green-700" },
};

export default function FacultyDashboard({ onNavigate }: FacultyDashboardProps) {
  const total = 48;
  const forked = submissions.filter((s) => s.status === "forked").length;
  const submitted = submissions.filter((s) => s.status === "submitted").length;
  const merged = submissions.filter((s) => s.status === "merged").length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faculty Dashboard</h1>
          <p className="mt-2 text-base text-gray-600">Monitor student submissions across all assignments</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => onNavigate("faculty-create")}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Assignments
          </button>
          <button
            onClick={() => onNavigate("faculty-review")}
            className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Review Submissions
          </button>
          <button
            onClick={() => onNavigate("faculty-onboard")}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Onboard Students
          </button>
          <button
            onClick={() => onNavigate("faculty-roster")}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Roster
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="mt-6 flex items-center gap-4">
        <label className="text-sm text-gray-700">Filter by assignment:</label>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option>All Assignments</option>
          <option>Portfolio Website</option>
          <option>Graph Traversal Visualizer</option>
          <option>Sentiment Analysis API</option>
        </select>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: total, color: "text-gray-900" },
          { label: "Forked Only", value: forked, color: "text-yellow-600" },
          { label: "PR Submitted", value: submitted, color: "text-blue-600" },
          { label: "Merged", value: merged, color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="mt-1 text-sm text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="mt-8 bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">All Submissions</h2>
        </div>
        {submissions.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">No submissions found</div>
        ) : (
          <div>
            {submissions.map((s) => {
              const cfg = statusConfig[s.status];
              return (
                <div
                  key={s.id}
                  className="px-6 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                      {s.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{s.name}</div>
                      <div className="text-sm text-gray-500">{s.assignment}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-3">
                      <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700">Fork</a>
                      <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700">PR</a>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
