const assignments = [
  {
    id: 1,
    subject: "Web Development",
    title: "Portfolio Website",
    description: "Build a personal portfolio website using HTML, CSS, and JavaScript. Showcase your skills, projects, and contact information in a clean, responsive design.",
    deadline: "Sep 30, 2026",
    repo: "portfolio-template",
    isPastDeadline: false,
  },
  {
    id: 2,
    subject: "Data Structures",
    title: "Graph Traversal Visualizer",
    description: "Implement BFS and DFS algorithms with a live visual representation. Users should be able to step through the traversal and observe node discovery order.",
    deadline: "Oct 15, 2026",
    repo: "graph-traversal-starter",
    isPastDeadline: false,
  },
  {
    id: 3,
    subject: "Database Systems",
    title: "Library Management System",
    description: "Design and implement a full-stack library management system with PostgreSQL backend, Express API, and a React frontend.",
    deadline: "Aug 20, 2026",
    repo: "library-mgmt-template",
    isPastDeadline: true,
  },
  {
    id: 4,
    subject: "Machine Learning",
    title: "Sentiment Analysis API",
    description: "Build a REST API that accepts text input and returns sentiment scores using a pretrained model from HuggingFace. Deploy to a cloud provider.",
    deadline: "Nov 5, 2026",
    repo: "sentiment-api-starter",
    isPastDeadline: false,
  },
];

export default function Assignments() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
        <p className="mt-2 text-base text-gray-600">
          Read the problem statement, fork the repo, and start building
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="mt-3 text-base text-gray-600">No assignments available yet</p>
          </div>
        ) : (
          assignments.map((a) => (
            <div
              key={a.id}
              className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  {a.subject}
                </span>
                {a.isPastDeadline && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    Past deadline
                  </span>
                )}
              </div>

              <h2 className="mt-3 text-xl font-semibold text-gray-900">{a.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{a.description}</p>

              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Due {a.deadline}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  {a.repo}
                </div>
              </div>

              <button className="mt-4 inline-flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Start
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
