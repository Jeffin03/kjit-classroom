import { MOCK_ASSIGNMENTS } from "../data";

interface Props {
  onViewAssignment: (id: string) => void;
}

export default function StudentAssignments({ onViewAssignment }: Props) {
  const assignments = MOCK_ASSIGNMENTS.filter(a => a.teams.includes("CE-A"));

  return (
    <div className="max-w-screen-lg mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="text-xs mono mb-1" style={{ color: "var(--color-muted)" }}>CE-A · Semester 5</div>
        <h1 className="text-2xl font-bold mono" style={{ color: "var(--color-text)" }}>Assignments</h1>
      </div>

      <div className="flex flex-col gap-3">
        {assignments.map(a => {
          const deadline = new Date(a.deadline);
          const now = new Date();
          const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isOverdue = daysLeft < 0;

          return (
            <div key={a.id} className="rounded border p-5" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs mono px-2 py-0.5 rounded" style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}>{a.subject}</span>
                    <span className="text-xs mono" style={{ color: isOverdue ? "var(--color-red)" : daysLeft < 14 ? "var(--color-amber)" : "var(--color-muted)" }}>
                      {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold mono mb-2" style={{ color: "var(--color-text)" }}>{a.title}</h2>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--color-muted)" }}>{a.description}</p>
                  <div className="flex items-center gap-4 text-xs mono" style={{ color: "var(--color-muted)" }}>
                    <span>4 sprints</span>
                    <span>·</span>
                    <span>Due {a.deadline}</span>
                    <span>·</span>
                    <span>Teams: {a.teams.join(", ")}</span>
                  </div>
                </div>
                <button
                  onClick={() => onViewAssignment(a.id)}
                  className="shrink-0 px-4 py-2 rounded text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: "var(--color-accent)", color: "#fff" }}
                >
                  View →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
