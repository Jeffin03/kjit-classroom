import { MOCK_ASSIGNMENTS, MOCK_SUBMISSIONS, MOCK_STUDENTS } from "../data";

interface Props {
  assignmentId: string;
  onBack: () => void;
  onViewStudent: (submissionId: string) => void;
}

export default function FacultyAssignmentDetail({ assignmentId, onBack, onViewStudent }: Props) {
  const assignment = MOCK_ASSIGNMENTS.find(a => a.id === assignmentId);
  if (!assignment) return null;

  const submissions = MOCK_SUBMISSIONS.filter(s => s.assignmentId === assignmentId);
  const accepted = submissions.filter(s => s.status === "accepted").length;
  const active = submissions.filter(s => s.status === "active").length;
  const noSub = MOCK_STUDENTS.filter(s => assignment.teams.includes(s.team)).length - submissions.length;

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      <button onClick={onBack} className="text-xs mono mb-6 flex items-center gap-1 transition-colors hover:text-white" style={{ color: "var(--color-muted)" }}>
        ← Back to assignments
      </button>

      {/* Header */}
      <div className="mb-8 p-6 rounded border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs mono mb-1" style={{ color: "var(--color-accent)" }}>{assignment.subject}</div>
            <h1 className="text-xl font-bold mono mb-2" style={{ color: "var(--color-text)" }}>{assignment.title}</h1>
            <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>{assignment.description}</p>
            <div className="text-xs mono" style={{ color: "var(--color-muted)" }}>Teams: {assignment.teams.join(", ")} · Due {assignment.deadline}</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[
            { label: "Total Students", value: MOCK_STUDENTS.filter(s => assignment.teams.includes(s.team)).length },
            { label: "Accepted", value: accepted, color: "var(--color-green)" },
            { label: "Active", value: active, color: "var(--color-accent)" },
            { label: "No Submission", value: noSub, color: "var(--color-red)" },
          ].map(s => (
            <div key={s.label} className="p-3 rounded" style={{ background: "var(--color-surface-2)" }}>
              <div className="text-2xl font-bold mono" style={{ color: s.color ?? "var(--color-text)" }}>{s.value}</div>
              <div className="text-xs mono mt-1" style={{ color: "var(--color-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Problem statement */}
      <div className="mb-6 p-4 rounded border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="text-xs mono font-semibold mb-2" style={{ color: "var(--color-muted)" }}>PROBLEM STATEMENT</div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>{assignment.problemStatement}</p>
      </div>

      {/* Student list */}
      <div className="mb-3 text-xs mono font-semibold" style={{ color: "var(--color-muted)" }}>STUDENT SUBMISSIONS</div>
      <div className="rounded border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "var(--color-surface-2)" }}>
              {["Student", "Roll No.", "GitHub", "Sprint 0", "Sprint 1", "Sprint 2", "Sprint 3", "Repo", "Status", ""].map(h => (
                <th key={h} className="text-left px-3 py-3 mono font-semibold" style={{ color: "var(--color-muted)", borderBottom: "1px solid var(--color-border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub, i) => {
              const student = MOCK_STUDENTS.find(s => s.id === sub.studentId);
              const completedSprints = new Set(sub.sprints.map(s => s.sprint));

              return (
                <tr key={sub.id} className="hover:bg-white/5 transition-colors" style={{ background: i % 2 === 0 ? "var(--color-surface)" : "transparent", borderBottom: "1px solid var(--color-border)" }}>
                  <td className="px-3 py-3 mono font-medium" style={{ color: "var(--color-text)" }}>{student?.name}</td>
                  <td className="px-3 py-3 mono" style={{ color: "var(--color-muted)" }}>{student?.rollNumber}</td>
                  <td className="px-3 py-3 mono" style={{ color: "var(--color-accent)" }}>@{student?.githubUsername}</td>
                  {[0, 1, 2, 3].map(n => (
                    <td key={n} className="px-3 py-3 text-center">
                      {completedSprints.has(n)
                        ? <span style={{ color: "var(--color-green)" }}>✓</span>
                        : <span style={{ color: "var(--color-border-bright)" }}>○</span>}
                    </td>
                  ))}
                  <td className="px-3 py-3 mono">
                    <a href={sub.repoUrl} target="_blank" rel="noreferrer" className="hover:underline truncate block max-w-[120px]" style={{ color: "var(--color-accent)" }}>
                      {sub.repoUrl.replace("https://github.com/", "")}
                    </a>
                  </td>
                  <td className="px-3 py-3">
                    <span className="mono px-2 py-0.5 rounded" style={{
                      background: sub.status === "accepted" ? "var(--color-green-dim)" : sub.status === "completed" ? "var(--color-accent-dim)" : "var(--color-surface-2)",
                      color: sub.status === "accepted" ? "var(--color-green)" : sub.status === "completed" ? "var(--color-accent)" : "var(--color-muted)"
                    }}>{sub.status}</span>
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => onViewStudent(sub.id)} className="mono px-3 py-1 rounded border text-xs hover:border-blue-500 transition-colors" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
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
