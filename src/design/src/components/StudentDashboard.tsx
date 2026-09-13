const submissions = [
  {
    id: 1,
    title: "Portfolio Website",
    subject: "Web Development",
    status: "merged" as const,
    forkUrl: "#",
    prUrl: "#",
    initials: "P",
  },
  {
    id: 2,
    title: "Graph Traversal Visualizer",
    subject: "Data Structures",
    status: "submitted" as const,
    forkUrl: "#",
    prUrl: "#",
    initials: "G",
  },
  {
    id: 3,
    title: "Sentiment Analysis API",
    subject: "Machine Learning",
    status: "forked" as const,
    forkUrl: "#",
    prUrl: null,
    initials: "S",
  },
];

const statusConfig = {
  forked: { label: "Forked", bg: "bg-yellow-100", text: "text-yellow-700" },
  submitted: { label: "Submitted", bg: "bg-blue-100", text: "text-blue-700" },
  reviewed: { label: "Reviewed", bg: "bg-purple-100", text: "text-purple-700" },
  merged: { label: "Merged", bg: "bg-green-100", text: "text-green-700" },
};

export default function StudentDashboard() {
  const total = submissions.length;
  const merged = submissions.filter((s) => s.status === "merged").length;
  const inProgress = submissions.filter((s) => s.status !== "merged").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="mt-2 text-base text-gray-600">Track your project submissions</p>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <div className="text-3xl font-bold text-indigo-600">{total}</div>
          <div className="mt-1 text-sm text-gray-600">Total Submissions</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <div className="text-3xl font-bold text-green-600">{merged}</div>
          <div className="mt-1 text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <div className="text-3xl font-bold text-yellow-600">{inProgress}</div>
          <div className="mt-1 text-sm text-gray-600">In Progress</div>
        </div>
      </div>

      {/* Submissions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Submissions</h2>

        {submissions.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="mt-3 text-base text-gray-600">No submissions yet</p>
            <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-700">Browse assignments →</button>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => {
              const cfg = statusConfig[s.status];
              return (
                <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                      {s.initials}
                    </div>
                    <div>
                      <div className="text-base font-semibold text-gray-900">{s.title}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{s.subject}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <a href={s.forkUrl} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        View Fork
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      {s.prUrl && (
                        <a href={s.prUrl} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                          View PR
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
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
