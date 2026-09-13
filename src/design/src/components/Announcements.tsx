const announcements = [
  {
    id: 1,
    title: "Mid-semester submission deadline extended",
    body: "The deadline for the Data Structures assignment (Graph Traversal Visualizer) has been extended to October 22, 2026. Please ensure your PR is open before that date.",
    author: "Dr. Priya Menon",
    date: "Sep 3, 2026",
    badge: "Important",
    badgeColor: "bg-red-100 text-red-700",
  },
  {
    id: 2,
    title: "New Machine Learning assignment posted",
    body: "A new assignment — Sentiment Analysis API — is now live on the Assignments page. Check the objectives and submission guidelines carefully before forking.",
    author: "Prof. Arjun Nair",
    date: "Sep 1, 2026",
    badge: "New",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    id: 3,
    title: "GitHub Organization invite resent",
    body: "If you did not receive or accidentally declined the KJIT-CS GitHub organization invite, please contact your class teacher to be re-invited. Check your college email for the invite link.",
    author: "Dept. Admin",
    date: "Aug 28, 2026",
    badge: "Action Required",
    badgeColor: "bg-yellow-100 text-yellow-700",
  },
];

export default function Announcements() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
        <p className="mt-2 text-base text-gray-600">Updates and notices from your faculty</p>
      </div>

      <div className="mt-8 space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${a.badgeColor}`}>
                    {a.badge}
                  </span>
                  <span className="text-xs text-gray-400">{a.date}</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{a.title}</h2>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{a.body}</p>
                <div className="mt-3 text-xs text-gray-400">— {a.author}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
