import { useState } from "react";

interface RequestAnimatorProps {
  onBack: () => void;
}

export default function RequestAnimator({ onBack }: RequestAnimatorProps) {
  const [form, setForm] = useState({ email: "", classes: "", reason: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSuccess(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Request Animator Role</h1>
        <p className="mt-2 text-base text-gray-600">
          Request to become a class animator (class teacher). An admin will review your request.
        </p>
      </div>

      {success ? (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-700 font-medium">
              Request submitted! An admin will review it shortly.
            </p>
          </div>
          <button onClick={onBack} className="mt-4 text-sm text-indigo-600 hover:text-indigo-700">
            ← Back to Faculty
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8">
          <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">College Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="yourname@kristujayanti.com"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class Sections</label>
              <input
                type="text"
                value={form.classes}
                onChange={(e) => set("classes", e.target.value)}
                placeholder="MCA-A, MCA-B"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-400">Comma-separated list of class sections you teach</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <textarea
                rows={4}
                value={form.reason}
                onChange={(e) => set("reason", e.target.value)}
                placeholder="Why you need animator access"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
