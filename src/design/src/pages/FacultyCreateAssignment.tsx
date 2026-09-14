import { useState } from "react";

interface Props {
  onBack: () => void;
}

export default function FacultyCreateAssignment({ onBack }: Props) {
  const [objectives, setObjectives] = useState<string[]>(["", ""]);
  const [requirements, setRequirements] = useState<string[]>(["", ""]);
  const [criteria, setCriteria] = useState<string[]>(["", ""]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const teams = ["CE-A", "CE-B", "CE-C", "IT-A"];

  const editList = (list: string[], setter: (v: string[]) => void, idx: number, val: string) => {
    const next = [...list]; next[idx] = val; setter(next);
  };
  const addItem = (list: string[], setter: (v: string[]) => void) => setter([...list, ""]);
  const removeItem = (list: string[], setter: (v: string[]) => void, idx: number) => setter(list.filter((_, i) => i !== idx));

  const toggleTeam = (t: string) => setSelectedTeams(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const labelStyle = { color: "var(--color-muted)" };
  const inputStyle = { background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text)" };

  return (
    <div className="max-w-screen-md mx-auto px-6 py-8">
      <button onClick={onBack} className="text-xs mono mb-6 flex items-center gap-1 transition-colors hover:text-white" style={{ color: "var(--color-muted)" }}>
        ← Back
      </button>

      <h1 className="text-2xl font-bold mono mb-8" style={{ color: "var(--color-text)" }}>New Assignment</h1>

      <form onSubmit={e => { e.preventDefault(); alert("Assignment created! (demo)"); onBack(); }} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs mono block mb-1" style={labelStyle}>Title</label>
            <input required className="w-full rounded border px-3 py-2 text-sm" style={inputStyle} placeholder="e.g. Distributed Cache System" />
          </div>
          <div>
            <label className="text-xs mono block mb-1" style={labelStyle}>Subject</label>
            <input required className="w-full rounded border px-3 py-2 text-sm" style={inputStyle} placeholder="e.g. Cloud Computing" />
          </div>
        </div>

        <div>
          <label className="text-xs mono block mb-1" style={labelStyle}>Description</label>
          <textarea required rows={2} className="w-full rounded border px-3 py-2 text-sm resize-none" style={inputStyle} />
        </div>

        <div>
          <label className="text-xs mono block mb-1" style={labelStyle}>Deadline</label>
          <input type="date" required className="w-full rounded border px-3 py-2 text-sm mono" style={inputStyle} />
        </div>

        <div>
          <label className="text-xs mono block mb-1" style={labelStyle}>Problem Statement</label>
          <textarea required rows={4} className="w-full rounded border px-3 py-2 text-sm resize-none" style={inputStyle} />
        </div>

        {[
          { label: "Objectives", list: objectives, setter: setObjectives },
          { label: "Requirements", list: requirements, setter: setRequirements },
          { label: "Evaluation Criteria", list: criteria, setter: setCriteria },
        ].map(({ label, list, setter }) => (
          <div key={label}>
            <label className="text-xs mono block mb-2" style={labelStyle}>{label}</label>
            <div className="space-y-2">
              {list.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={item}
                    onChange={e => editList(list, setter, i, e.target.value)}
                    className="flex-1 rounded border px-3 py-2 text-sm"
                    style={inputStyle}
                    placeholder={`${label.slice(0, -1)} ${i + 1}`}
                  />
                  <button type="button" onClick={() => removeItem(list, setter, i)} className="px-2 text-xs rounded border" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>×</button>
                </div>
              ))}
              <button type="button" onClick={() => addItem(list, setter)} className="text-xs mono px-3 py-1.5 rounded border" style={{ borderColor: "var(--color-border-bright)", color: "var(--color-accent)" }}>
                + Add {label.slice(0, -1).toLowerCase()}
              </button>
            </div>
          </div>
        ))}

        <div>
          <label className="text-xs mono block mb-2" style={labelStyle}>Assign to Teams</label>
          <div className="flex gap-2 flex-wrap">
            {teams.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTeam(t)}
                className="px-3 py-1.5 rounded border text-xs mono font-semibold transition-all"
                style={{
                  background: selectedTeams.includes(t) ? "var(--color-accent-dim)" : "var(--color-surface)",
                  borderColor: selectedTeams.includes(t) ? "var(--color-accent)" : "var(--color-border)",
                  color: selectedTeams.includes(t) ? "var(--color-accent)" : "var(--color-muted)",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t flex gap-3" style={{ borderColor: "var(--color-border)" }}>
          <button type="submit" className="px-6 py-2 rounded text-sm font-semibold" style={{ background: "var(--color-accent)", color: "#fff" }}>
            Create Assignment
          </button>
          <button type="button" onClick={onBack} className="px-6 py-2 rounded text-sm border" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
