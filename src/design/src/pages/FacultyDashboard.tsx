import { useState } from "react";
import { MOCK_SUBMISSIONS, MOCK_STUDENTS, MOCK_ASSIGNMENTS } from "../data";

interface Props {
  onViewStudent: (submissionId: string) => void;
}

export default function FacultyDashboard({ onViewStudent }: Props) {
  const [filterAssignment, setFilterAssignment] = useState<string>("all");

  const filtered = MOCK_SUBMISSIONS.filter(s => filterAssignment === "all" || s.assignmentId === filterAssignment);
  const accepted = filtered.filter(s => s.status === "accepted").length;
  const pending = filtered.filter(s => s.status !== "accepted").length;

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="text-xs mono mb-1" style={{ color: "var(--color-muted)" }}>Prof. D. Raval · Faculty</div>
        <h1 className="text-2xl font-bold mono" style={{ color: "var(--color-text)" }}>Faculty Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Students", value: MOCK_STUDENTS.length },
          { label: "Submissions", value: MOCK_SUBMISSIONS.length },
          { label: "Accepted", value: accepted, color: "var(--color-green)" },
          { label: "Pending", value: pending, color: "var(--color-amber)" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="text-3xl font-bold mono mb-1" style={{ color: s.color ?? "var(--color-text)" }}>{s.value}</div>
            <div className="text-xs mono" style={{ color: "var(--color-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs mono" style={{ color: "var(--color-muted)" }}>Filter:</span>
        <select
          value={filterAssignment}
          onChange={e => setFilterAssignment(e.target.value)}
          className="text-xs mono rounded border px-2 py-1"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          <option value="all">All assignments</option>
          {MOCK_ASSIGNMENTS.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "var(--color-surface-2)" }}>
              {["Student", "Roll No.", "Assignment", "Sprints", "Status", "Repo", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 mono font-semibold" style={{ color: "var(--color-muted)", borderBottom: `1px solid var(--color-border)` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((sub, i) => {
              const student = MOCK_STUDENTS.find(s => s.id === sub.studentId);
              const assignment = MOCK_ASSIGNMENTS.find(a => a.id === sub.assignmentId);
              const completed = sub.sprints.length;

              return (
                <tr key={sub.id} className="transition-colors hover:bg-white/5" style={{ background: i % 2 === 0 ? "var(--color-surface)" : "transparent", borderBottom: `1px solid var(--color-border)` }}>
                  <td className="px-4 py-3">
                    <div className="font-medium mono" style={{ color: "var(--color-text)" }}>{student?.name}</div>
                    <div style={{ color: "var(--color-muted)" }}>{student?.githubUsername}</div>
                  </td>
                  <td className="px-4 py-3 mono" style={{ color: "var(--color-muted)" }}>{student?.rollNumber}</td>
                  <td className="px-4 py-3 mono" style={{ color: "var(--color-text)" }}>{assignment?.title.split(" ").slice(0, 3).join(" ")}…</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} className="w-5 h-5 rounded flex items-center justify-center font-bold"
                          style={{
                            fontSize: "9px",
                            background: i < completed ? "var(--color-green-dim)" : "var(--color-surface-2)",
                            color: i < completed ? "var(--color-green)" : "var(--color-muted)",
                          }}>
                          {i}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="mono px-2 py-0.5 rounded" style={{
                      background: sub.status === "accepted" ? "var(--color-green-dim)" : sub.status === "completed" ? "var(--color-accent-dim)" : "var(--color-surface-2)",
                      color: sub.status === "accepted" ? "var(--color-green)" : sub.status === "completed" ? "var(--color-accent)" : "var(--color-muted)"
                    }}>{sub.status}</span>
                  </td>
                  <td className="px-4 py-3 mono">
                    <a href={sub.repoUrl} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: "var(--color-accent)" }}>
                      {sub.repoUrl.replace("https://github.com/", "")}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => onViewStudent(sub.id)} className="mono px-3 py-1 rounded border text-xs transition-colors hover:border-blue-500" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                      Review →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
