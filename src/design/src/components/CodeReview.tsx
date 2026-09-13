import { useState } from "react";

const initialSubmissions = [
  {
    id: 1,
    name: "Ananya Sharma",
    rollNo: "MCA22001",
    avatar: "A",
    assignment: "Portfolio Website",
    status: "submitted" as const,
    forkUrl: "#",
    prUrl: "#",
  },
  {
    id: 2,
    name: "Sneha Raj",
    rollNo: "MCA22005",
    avatar: "S",
    assignment: "Graph Traversal Visualizer",
    status: "submitted" as const,
    forkUrl: "#",
    prUrl: "#",
  },
  {
    id: 3,
    name: "Rohit Krishnan",
    rollNo: "MCA22002",
    avatar: "R",
    assignment: "Portfolio Website",
    status: "merged" as const,
    forkUrl: "#",
    prUrl: "#",
  },
];

const statusConfig = {
  forked: { label: "Forked", bg: "bg-yellow-100", text: "text-yellow-700" },
  submitted: { label: "Submitted", bg: "bg-blue-100", text: "text-blue-700" },
  reviewed: { label: "Reviewed", bg: "bg-purple-100", text: "text-purple-700" },
  merged: { label: "Merged", bg: "bg-green-100", text: "text-green-700" },
};

export default function CodeReview() {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [filter, setFilter] = useState("All Assignments");

  const accept = (id: number) => {
    setSubmissions((s) =>
      s.map((sub) => (sub.id === id ? { ...sub, status: "merged" as const } : sub))
    );
  };

  const filtered = submissions.filter(
    (s) => filter === "All Assignments" || s.assignment === filter
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Submissions</h1>
        <p className="mt-2 text-base text-gray-600">Review student work and accept submissions</p>
      </div>

      <div className="mt-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option>All Assignments</option>
          <option>Portfolio Website</option>
          <option>Graph Traversal Visualizer</option>
          <option>Sentiment Analysis API</option>
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-base text-gray-500">No submissions to review</div>
        ) : (
          filtered.map((s) => {
            const cfg = statusConfig[s.status];
            return (
              <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-6 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                    {s.avatar}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-gray-900">{s.name}</span>
                      <span className="text-sm text-gray-500">{s.rollNo}</span>
                    </div>
                    <div className="text-sm text-gray-600">{s.assignment}</div>
                    <div className="flex items-center gap-4">
                      <a href={s.forkUrl} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        View Fork
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <a href={s.prUrl} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        View PR
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {s.status === "submitted" ? (
                    <button
                      onClick={() => accept(s.id)}
                      className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                  ) : s.status === "merged" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Accepted
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
