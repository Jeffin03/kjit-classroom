import { useState } from "react";
import { MOCK_ASSIGNMENTS, MOCK_SUBMISSIONS } from "../data";

interface Props {
  onViewDetail: (id: string) => void;
  onCreateNew: () => void;
}

export default function FacultyAssignments({ onViewDetail, onCreateNew }: Props) {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs mono mb-1" style={{ color: "var(--color-muted)" }}>Faculty</div>
          <h1 className="text-2xl font-bold mono" style={{ color: "var(--color-text)" }}>Assignments</h1>
        </div>
        <button onClick={onCreateNew} className="px-4 py-2 rounded text-sm font-semibold" style={{ background: "var(--color-accent)", color: "#fff" }}>
          + New Assignment
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {MOCK_ASSIGNMENTS.map(a => {
          const subs = MOCK_SUBMISSIONS.filter(s => s.assignmentId === a.id);
          const deadline = new Date(a.deadline);
          const now = new Date();
          const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          return (
            <div key={a.id} className="rounded border p-5" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs mono px-2 py-0.5 rounded" style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}>{a.subject}</span>
                    <span className="text-xs mono" style={{ color: daysLeft < 0 ? "var(--color-red)" : daysLeft < 14 ? "var(--color-amber)" : "var(--color-muted)" }}>
                      {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d remaining`}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold mono mb-2" style={{ color: "var(--color-text)" }}>{a.title}</h2>
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--color-muted)" }}>{a.description}</p>
                  <div className="flex items-center gap-4 text-xs mono" style={{ color: "var(--color-muted)" }}>
                    <span>Teams: {a.teams.join(", ")}</span>
                    <span>·</span>
                    <span>Due {a.deadline}</span>
                    <span>·</span>
                    <span style={{ color: "var(--color-green)" }}>{subs.length} submissions</span>
                  </div>
                </div>
                <button onClick={() => onViewDetail(a.id)} className="shrink-0 px-4 py-2 rounded text-sm font-semibold border transition-colors hover:border-blue-500" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                  View Details →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
