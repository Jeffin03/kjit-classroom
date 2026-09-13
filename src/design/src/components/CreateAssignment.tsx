import { useState } from "react";

interface CreateAssignmentProps {
  onBack: () => void;
}

function DynamicList({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const update = (i: number, val: string) => {
    const next = [...items];
    next[i] = val;
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, ""]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-gray-400 hover:text-red-500 transition-colors px-2"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
      >
        + Add more
      </button>
    </div>
  );
}

export default function CreateAssignment({ onBack }: CreateAssignmentProps) {
  const [form, setForm] = useState({
    title: "",
    subject: "",
    deadline: "",
    description: "",
    problemStatement: "",
    objectives: [""],
    requirements: [""],
    evaluationCriteria: [""],
    submissionGuidelines: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSuccess(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Assignment</h1>
        <p className="mt-2 text-base text-gray-600">
          Fill in the details and a GitHub repo will be created with a README
        </p>
      </div>

      {success && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">
            Assignment created!{" "}
            <a href="#" className="underline font-medium">View repo →</a>
          </p>
        </div>
      )}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Basic Info */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Portfolio Website"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="Web Development"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => set("deadline", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description of the assignment"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Details */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Problem Statement</label>
            <textarea
              rows={4}
              value={form.problemStatement}
              onChange={(e) => set("problemStatement", e.target.value)}
              placeholder="Detailed problem statement for students"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>
          <DynamicList
            label="Objectives"
            items={form.objectives}
            onChange={(v) => set("objectives", v)}
            placeholder="What students will learn"
          />
          <DynamicList
            label="Requirements"
            items={form.requirements}
            onChange={(v) => set("requirements", v)}
            placeholder="Tech stack or tools required"
          />
          <DynamicList
            label="Evaluation Criteria"
            items={form.evaluationCriteria}
            onChange={(v) => set("evaluationCriteria", v)}
            placeholder="How students will be graded"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Submission Guidelines</label>
            <textarea
              rows={2}
              value={form.submissionGuidelines}
              onChange={(e) => set("submissionGuidelines", e.target.value)}
              placeholder="How students should submit their work"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Assignment"}
          </button>
        </div>
      </form>
    </div>
  );
}
