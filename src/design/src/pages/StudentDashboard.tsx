import { MOCK_SUBMISSIONS, MOCK_ASSIGNMENTS } from "../data";

interface Props {
  onViewAssignment: (id: string) => void;
}

export default function StudentDashboard({ onViewAssignment }: Props) {
  const mySubmissions = MOCK_SUBMISSIONS.filter(s => s.studentId === "s1");
  const totalSprints = mySubmissions.reduce((sum, s) => sum + s.sprints.length, 0);
  const pending = mySubmissions.reduce((sum, s) => sum + (4 - s.sprints.length), 0);

  return (
    <div className="max-w-screen-lg mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="text-xs mono mb-1" style={{ color: "var(--color-muted)" }}>Aarav Mehta · 22CE001</div>
        <h1 className="text-2xl font-bold mono" style={{ color: "var(--color-text)" }}>My Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Submissions", value: mySubmissions.length },
          { label: "Sprints Completed", value: totalSprints, color: "var(--color-green)" },
          { label: "Sprints Pending", value: pending, color: "var(--color-amber)" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="text-3xl font-bold mono mb-1" style={{ color: s.color ?? "var(--color-text)" }}>{s.value}</div>
            <div className="text-xs mono" style={{ color: "var(--color-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Submissions list */}
      <div className="mb-4 text-xs mono font-semibold" style={{ color: "var(--color-muted)" }}>ACTIVE SUBMISSIONS</div>
      <div className="flex flex-col gap-3">
        {mySubmissions.map(sub => {
          const assignment = MOCK_ASSIGNMENTS.find(a => a.id === sub.assignmentId);
          if (!assignment) return null;
          const completed = sub.sprints.length;

          return (
            <div key={sub.id} className="rounded border p-4 flex items-center justify-between gap-4" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs mono px-2 py-0.5 rounded" style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}>{assignment.subject}</span>
                  <span className="text-xs mono px-2 py-0.5 rounded" style={{
                    background: sub.status === "accepted" ? "var(--color-green-dim)" : "var(--color-surface-2)",
                    color: sub.status === "accepted" ? "var(--color-green)" : "var(--color-muted)"
                  }}>{sub.status}</span>
                </div>
                <div className="font-semibold mono text-sm mb-2" style={{ color: "var(--color-text)" }}>{assignment.title}</div>
                <div className="flex items-center gap-3">
                  {/* Sprint progress dots */}
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded flex items-center justify-center text-xs mono font-bold"
                        style={{
                          background: i < completed ? "var(--color-green-dim)" : "var(--color-surface-2)",
                          color: i < completed ? "var(--color-green)" : "var(--color-muted)",
                          border: `1px solid ${i < completed ? "var(--color-green)" : "var(--color-border)"}`
                        }}>
                        {i}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs mono" style={{ color: "var(--color-muted)" }}>{completed}/4 sprints</span>
                  <a href={sub.repoUrl} target="_blank" rel="noreferrer" className="text-xs mono hover:underline" style={{ color: "var(--color-accent)" }}>
                    {sub.repoUrl.replace("https://github.com/", "")}
                  </a>
                </div>
              </div>
              <button
                onClick={() => onViewAssignment(sub.assignmentId)}
                className="px-3 py-1.5 rounded text-xs font-semibold border transition-colors hover:border-blue-500"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                View timeline
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
