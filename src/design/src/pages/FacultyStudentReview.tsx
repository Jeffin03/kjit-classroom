import { useState } from "react";
import { MOCK_SUBMISSIONS, MOCK_STUDENTS, MOCK_ASSIGNMENTS } from "../data";

interface Props {
  submissionId: string;
  onBack: () => void;
}

const SPRINT_LABELS = ["Sprint 0 — Baseline", "Sprint 1 — Core", "Sprint 2 — Integration", "Sprint 3 — Final"];

export default function FacultyStudentReview({ submissionId, onBack }: Props) {
  const submission = MOCK_SUBMISSIONS.find(s => s.id === submissionId);
  const student = MOCK_STUDENTS.find(s => s.id === submission?.studentId);
  const assignment = MOCK_ASSIGNMENTS.find(a => a.id === submission?.assignmentId);

  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [hashModal, setHashModal] = useState<{ sprint: number; current: string } | null>(null);
  const [newHash, setNewHash] = useState("");
  const [savedNotes, setSavedNotes] = useState<Set<number>>(new Set());

  if (!submission || !student || !assignment) return null;

  return (
    <div className="max-w-screen-md mx-auto px-6 py-8">
      <button onClick={onBack} className="text-xs mono mb-6 flex items-center gap-1 transition-colors hover:text-white" style={{ color: "var(--color-muted)" }}>
        ← Back
      </button>

      {/* Student header */}
      <div className="p-5 rounded border mb-6" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold mono text-lg" style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}>
            {student.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold mono" style={{ color: "var(--color-text)" }}>{student.name}</div>
            <div className="text-xs mono mt-0.5" style={{ color: "var(--color-muted)" }}>
              {student.rollNumber} · @{student.githubUsername} · {student.team}
            </div>
          </div>
          <div className="ml-auto">
            <span className="text-xs mono px-2 py-1 rounded" style={{ background: submission.status === "accepted" ? "var(--color-green-dim)" : "var(--color-surface-2)", color: submission.status === "accepted" ? "var(--color-green)" : "var(--color-muted)" }}>
              {submission.status}
            </span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t text-xs mono" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
          {assignment.subject} · {assignment.title} · <a href={submission.repoUrl} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: "var(--color-accent)" }}>{submission.repoUrl.replace("https://github.com/", "")}</a>
        </div>
      </div>

      {/* Sprint breakdown */}
      <div className="flex flex-col gap-5">
        {submission.sprints.map(sprint => (
          <div key={sprint.sprint} className="rounded border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
              <span className="font-semibold mono text-sm" style={{ color: "var(--color-text)" }}>{SPRINT_LABELS[sprint.sprint]}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs mono px-2 py-0.5 rounded" style={{ background: "var(--color-green-dim)", color: "var(--color-green)" }}>Submitted</span>
                <span className="text-xs mono" style={{ color: "var(--color-muted)" }}>{new Date(sprint.submittedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-xs mono">
                <div>
                  <span style={{ color: "var(--color-muted)" }}>Commit SHA</span>
                  <div className="mt-0.5 font-medium" style={{ color: "var(--color-text)" }}>{sprint.commitSha}</div>
                </div>
                <div>
                  <span style={{ color: "var(--color-muted)" }}>Documentation</span>
                  <div className="mt-0.5">
                    <a href={sprint.docLink} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: "var(--color-accent)" }}>Open Doc →</a>
                  </div>
                </div>
              </div>

              {sprint.pivoted && (
                <div className="text-xs px-3 py-2 rounded mono" style={{ background: "var(--color-amber-dim)", color: "var(--color-amber)" }}>⚡ Pivot — Student started with a new repository at this sprint</div>
              )}

              {/* Summary */}
              <div className="text-xs space-y-2">
                <div>
                  <div className="mono font-semibold mb-1" style={{ color: "var(--color-muted)" }}>COMPLETED</div>
                  <ul className="space-y-0.5">
                    {sprint.summary.completed.map((c, i) => (
                      <li key={i} className="flex gap-2" style={{ color: "var(--color-text)" }}>
                        <span style={{ color: "var(--color-green)" }}>✓</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="mono font-semibold mb-1" style={{ color: "var(--color-muted)" }}>WHAT CHANGED</div>
                  <p className="leading-relaxed" style={{ color: "var(--color-text)" }}>{sprint.summary.changed}</p>
                </div>
                <div>
                  <div className="mono font-semibold mb-1" style={{ color: "var(--color-muted)" }}>BLOCKERS</div>
                  <p className="leading-relaxed" style={{ color: sprint.summary.blockers === "None." || sprint.summary.blockers === "None at this stage." ? "var(--color-green)" : "var(--color-amber)" }}>{sprint.summary.blockers}</p>
                </div>
                {sprint.summary.demoLink && (
                  <div>
                    <div className="mono font-semibold mb-1" style={{ color: "var(--color-muted)" }}>DEMO</div>
                    <a href={sprint.summary.demoLink} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: "var(--color-accent)" }}>{sprint.summary.demoLink}</a>
                  </div>
                )}
              </div>

              {/* Diff metrics */}
              <div>
                <div className="mono text-xs font-semibold mb-2" style={{ color: "var(--color-muted)" }}>DIFF METRICS</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Commits", value: sprint.metrics.commits, color: "var(--color-accent)" },
                    { label: "Files Δ", value: sprint.metrics.filesChanged },
                    { label: "Lines +", value: `+${sprint.metrics.linesAdded}`, color: "var(--color-green)" },
                    { label: "Lines −", value: `-${sprint.metrics.linesRemoved}`, color: "var(--color-red)" },
                    { label: "New Files", value: sprint.metrics.newFiles },
                    { label: "Modified", value: sprint.metrics.modifiedFiles },
                  ].map(m => (
                    <div key={m.label} className="p-2 rounded text-center" style={{ background: "var(--color-surface-2)" }}>
                      <div className="text-sm font-bold mono" style={{ color: m.color ?? "var(--color-text)" }}>{m.value}</div>
                      <div className="text-xs mono mt-0.5" style={{ color: "var(--color-muted)", fontSize: "10px" }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review notes */}
              <div>
                <div className="mono text-xs font-semibold mb-2" style={{ color: "var(--color-muted)" }}>REVIEW NOTES</div>
                <textarea
                  rows={2}
                  placeholder="Add lab review notes..."
                  value={reviewNotes[sprint.sprint] ?? ""}
                  onChange={e => setReviewNotes(prev => ({ ...prev, [sprint.sprint]: e.target.value }))}
                  className="w-full rounded border px-3 py-2 text-xs mono resize-none"
                  style={{ background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setSavedNotes(prev => new Set([...prev, sprint.sprint]))}
                    className="px-3 py-1 rounded text-xs mono font-semibold"
                    style={{ background: "var(--color-accent)", color: "#fff" }}
                  >
                    {savedNotes.has(sprint.sprint) ? "Saved ✓" : "Save Notes"}
                  </button>
                  <button
                    onClick={() => setHashModal({ sprint: sprint.sprint, current: sprint.commitSha })}
                    className="px-3 py-1 rounded text-xs mono border"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                  >
                    Update Commit Hash
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Commit hash modal */}
      {hashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded border p-6 w-full max-w-sm" style={{ background: "var(--color-surface)", borderColor: "var(--color-border-bright)" }}>
            <h3 className="font-bold mono mb-4" style={{ color: "var(--color-text)" }}>Update Commit Hash</h3>
            <div className="mb-4 text-xs mono p-2 rounded" style={{ background: "var(--color-bg)", color: "var(--color-muted)" }}>
              Current: <span style={{ color: "var(--color-text)" }}>{hashModal.current}</span>
            </div>
            <label className="text-xs mono block mb-1" style={{ color: "var(--color-muted)" }}>New commit hash</label>
            <input
              value={newHash}
              onChange={e => setNewHash(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm mono mb-4"
              style={{ background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
              placeholder="e.g. a1b2c3d"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { alert("Commit hash updated (demo)"); setHashModal(null); setNewHash(""); }}
                className="flex-1 py-2 rounded text-sm font-semibold mono"
                style={{ background: "var(--color-accent)", color: "#fff" }}
              >
                Confirm
              </button>
              <button
                onClick={() => { setHashModal(null); setNewHash(""); }}
                className="flex-1 py-2 rounded text-sm mono border"
                style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
