import { useState } from "react";
import { MOCK_ASSIGNMENTS, MOCK_SUBMISSIONS } from "../data";

interface Props {
  assignmentId: string;
  onBack: () => void;
}

const SPRINT_LABELS = ["Sprint 0 — Baseline", "Sprint 1 — Core Implementation", "Sprint 2 — Integration", "Sprint 3 — Final"];

export default function StudentTimeline({ assignmentId, onBack }: Props) {
  const assignment = MOCK_ASSIGNMENTS.find(a => a.id === assignmentId);
  const submission = MOCK_SUBMISSIONS.find(s => s.assignmentId === assignmentId && s.studentId === "s1");
  const [submitSprint, setSubmitSprint] = useState<number | null>(null);
  const [formData, setFormData] = useState({ repoUrl: submission?.repoUrl ?? "", docLink: "", summary: "", blockers: "", pivot: false, pivotUrl: "" });

  if (!assignment) return null;

  const submittedSprints = new Set(submission?.sprints.map(s => s.sprint) ?? []);
  const nextSprint = [0, 1, 2, 3].find(n => !submittedSprints.has(n)) ?? null;

  return (
    <div className="max-w-screen-md mx-auto px-6 py-8">
      <button onClick={onBack} className="text-xs mono mb-6 flex items-center gap-1 transition-colors hover:text-white" style={{ color: "var(--color-muted)" }}>
        ← Back to assignments
      </button>

      <div className="mb-8 p-5 rounded border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="text-xs mono mb-1" style={{ color: "var(--color-accent)" }}>{assignment.subject}</div>
        <h1 className="text-xl font-bold mono mb-2" style={{ color: "var(--color-text)" }}>{assignment.title}</h1>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>{assignment.description}</p>
        {submission && (
          <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs mono" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
            <span>Repo: <a href={submission.repoUrl} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: "var(--color-accent)" }}>{submission.repoUrl.replace("https://github.com/", "")}</a></span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: "var(--color-border)" }} />

        <div className="flex flex-col gap-6">
          {[0, 1, 2, 3].map(sprintNum => {
            const sprint = submission?.sprints.find(s => s.sprint === sprintNum);
            const isSubmitted = !!sprint;
            const isPending = !isSubmitted && sprintNum === nextSprint;
            const isLocked = !isSubmitted && sprintNum !== nextSprint;

            return (
              <div key={sprintNum} className="pl-10 relative">
                {/* Dot */}
                <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 flex items-center justify-center"
                  style={{
                    background: isSubmitted ? "var(--color-green)" : isPending ? "var(--color-surface-2)" : "var(--color-bg)",
                    borderColor: isSubmitted ? "var(--color-green)" : isPending ? "var(--color-accent)" : "var(--color-border)",
                  }} />

                <div className="rounded border p-4" style={{ background: "var(--color-surface)", borderColor: isSubmitted ? "var(--color-border)" : isPending ? "var(--color-accent-dim)" : "var(--color-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold mono" style={{ color: "var(--color-text)" }}>{SPRINT_LABELS[sprintNum]}</span>
                    <span className="text-xs mono px-2 py-0.5 rounded"
                      style={{
                        background: isSubmitted ? "var(--color-green-dim)" : isPending ? "var(--color-accent-dim)" : "var(--color-surface-2)",
                        color: isSubmitted ? "var(--color-green)" : isPending ? "var(--color-accent)" : "var(--color-muted)"
                      }}>
                      {isSubmitted ? "Submitted" : isPending ? "Pending" : "Locked"}
                    </span>
                  </div>

                  {isSubmitted && sprint && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs mono" style={{ color: "var(--color-muted)" }}>
                        <span>SHA: <span style={{ color: "var(--color-text)" }}>{sprint.commitSha}</span></span>
                        <span>Date: <span style={{ color: "var(--color-text)" }}>{new Date(sprint.submittedAt).toLocaleDateString()}</span></span>
                      </div>
                      {sprint.pivoted && (
                        <div className="text-xs px-2 py-1 rounded mono" style={{ background: "var(--color-amber-dim)", color: "var(--color-amber)" }}>⚡ Pivot — new repo introduced</div>
                      )}
                      <div className="text-xs" style={{ color: "var(--color-muted)" }}>
                        <span className="mono font-medium" style={{ color: "var(--color-text)" }}>Completed:</span>
                        <ul className="mt-1 space-y-0.5">
                          {sprint.summary.completed.map((c, i) => <li key={i} className="flex gap-1"><span style={{ color: "var(--color-green)" }}>✓</span> {c}</li>)}
                        </ul>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Commits", value: sprint.metrics.commits },
                          { label: "Files Δ", value: sprint.metrics.filesChanged },
                          { label: "+Lines", value: sprint.metrics.linesAdded, color: "var(--color-green)" },
                        ].map(m => (
                          <div key={m.label} className="p-2 rounded text-center" style={{ background: "var(--color-surface-2)" }}>
                            <div className="text-lg font-bold mono" style={{ color: m.color ?? "var(--color-text)" }}>{m.value}</div>
                            <div className="text-xs mono" style={{ color: "var(--color-muted)" }}>{m.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isPending && submitSprint !== sprintNum && (
                    <button
                      onClick={() => setSubmitSprint(sprintNum)}
                      className="mt-2 px-4 py-2 rounded text-sm font-semibold transition-all hover:opacity-90"
                      style={{ background: "var(--color-accent)", color: "#fff" }}
                    >
                      Submit Sprint {sprintNum}
                    </button>
                  )}

                  {isPending && submitSprint === sprintNum && (
                    <form className="mt-3 space-y-3" onSubmit={e => { e.preventDefault(); alert("Sprint submitted! (demo)"); setSubmitSprint(null); }}>
                      <div>
                        <label className="text-xs mono block mb-1" style={{ color: "var(--color-muted)" }}>Repository URL</label>
                        <input className="w-full rounded border px-3 py-2 text-sm mono" style={{ background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                          value={formData.repoUrl} onChange={e => setFormData(f => ({ ...f, repoUrl: e.target.value }))} />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="pivot" checked={formData.pivot} onChange={e => setFormData(f => ({ ...f, pivot: e.target.checked }))} />
                        <label htmlFor="pivot" className="text-xs mono" style={{ color: "var(--color-amber)" }}>Starting fresh with a new repository (pivot)</label>
                      </div>
                      {formData.pivot && (
                        <div>
                          <label className="text-xs mono block mb-1" style={{ color: "var(--color-amber)" }}>New repository URL</label>
                          <input className="w-full rounded border px-3 py-2 text-sm mono" style={{ background: "var(--color-bg)", borderColor: "var(--color-amber)", color: "var(--color-text)" }}
                            value={formData.pivotUrl} onChange={e => setFormData(f => ({ ...f, pivotUrl: e.target.value }))} placeholder="https://github.com/..." />
                        </div>
                      )}
                      <div>
                        <label className="text-xs mono block mb-1" style={{ color: "var(--color-muted)" }}>Documentation link (Google Doc)</label>
                        <input className="w-full rounded border px-3 py-2 text-sm mono" style={{ background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                          value={formData.docLink} onChange={e => setFormData(f => ({ ...f, docLink: e.target.value }))} placeholder="https://docs.google.com/..." />
                      </div>
                      <div>
                        <label className="text-xs mono block mb-1" style={{ color: "var(--color-muted)" }}>What was completed (one per line)</label>
                        <textarea className="w-full rounded border px-3 py-2 text-sm mono" rows={3} style={{ background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                          placeholder="Feature A&#10;Bug fix B&#10;Documentation" />
                      </div>
                      <div>
                        <label className="text-xs mono block mb-1" style={{ color: "var(--color-muted)" }}>What changed since last sprint</label>
                        <textarea className="w-full rounded border px-3 py-2 text-sm mono" rows={2} style={{ background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text)" }} />
                      </div>
                      <div>
                        <label className="text-xs mono block mb-1" style={{ color: "var(--color-muted)" }}>Blockers</label>
                        <textarea className="w-full rounded border px-3 py-2 text-sm mono" rows={2} style={{ background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text)" }} />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="px-4 py-2 rounded text-sm font-semibold" style={{ background: "var(--color-accent)", color: "#fff" }}>Submit</button>
                        <button type="button" onClick={() => setSubmitSprint(null)} className="px-4 py-2 rounded text-sm border" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>Cancel</button>
                      </div>
                    </form>
                  )}

                  {isLocked && (
                    <p className="mt-1 text-xs mono" style={{ color: "var(--color-muted)" }}>Submit previous sprint to unlock</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
