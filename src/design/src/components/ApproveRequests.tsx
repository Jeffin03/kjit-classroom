import { useState } from "react";

const initialRequests = [
  {
    id: 1,
    username: "priya.menon",
    email: "priya.menon@kristujayanti.com",
    classes: ["MCA-A"],
    requestedAt: "Sep 2, 2026",
    avatar: "P",
  },
  {
    id: 2,
    username: "arjun.nair",
    email: "arjun.nair@kristujayanti.com",
    classes: ["MSc CS-B", "MSc AI"],
    requestedAt: "Sep 1, 2026",
    avatar: "A",
  },
];

export default function ApproveRequests() {
  const [requests, setRequests] = useState(initialRequests);

  const approve = (id: number) => setRequests((r) => r.filter((req) => req.id !== id));
  const deny = (id: number) => setRequests((r) => r.filter((req) => req.id !== id));

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Teacher Requests</h1>
        <p className="mt-2 text-base text-gray-600">Review and approve teacher role requests</p>
      </div>

      <div className="mt-8 space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-base text-gray-500">No pending requests</div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="bg-white border border-gray-100 rounded-xl p-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                  {req.avatar}
                </div>
                <div>
                  <div className="text-base font-semibold text-gray-900">{req.username}</div>
                  <div className="text-sm text-gray-500">{req.email}</div>
                  <div className="mt-1 flex items-center gap-2">
                    {req.classes.map((cls) => (
                      <span key={cls} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        {cls}
                      </span>
                    ))}
                    <span className="text-xs text-gray-400">{req.requestedAt}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => approve(req.id)}
                  className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => deny(req.id)}
                  className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Deny
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
