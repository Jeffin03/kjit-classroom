import { useState } from "react";
import { MOCK_STUDENTS } from "../data";

export default function FacultyRoster() {
  const [filterTeam, setFilterTeam] = useState("all");
  const [search, setSearch] = useState("");

  const teams = [...new Set(MOCK_STUDENTS.map(s => s.team))];
  const filtered = MOCK_STUDENTS.filter(s => {
    const matchTeam = filterTeam === "all" || s.team === filterTeam;
    const matchSearch = !search || s.rollNumber.includes(search) || s.email.includes(search) || s.githubUsername.includes(search) || s.name.toLowerCase().includes(search.toLowerCase());
    return matchTeam && matchSearch;
  });

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs mono mb-1" style={{ color: "var(--color-muted)" }}>Faculty</div>
          <h1 className="text-2xl font-bold mono" style={{ color: "var(--color-text)" }}>Student Roster</h1>
        </div>
        <button className="px-4 py-2 rounded text-sm font-semibold" style={{ background: "var(--color-accent)", color: "#fff" }}>
          + Onboard Students
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by roll no., email, or GitHub..."
          className="flex-1 rounded border px-3 py-2 text-sm mono"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
        />
        <select
          value={filterTeam}
          onChange={e => setFilterTeam(e.target.value)}
          className="rounded border px-3 py-2 text-sm mono"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          <option value="all">All teams</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="rounded border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "var(--color-surface-2)" }}>
              {["Roll No.", "Name", "Email", "GitHub", "Team", "Status"].map(h => (
                <th key={h} className="text-left px-4 py-3 mono font-semibold" style={{ color: "var(--color-muted)", borderBottom: "1px solid var(--color-border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id} className="hover:bg-white/5 transition-colors" style={{ background: i % 2 === 0 ? "var(--color-surface)" : "transparent", borderBottom: "1px solid var(--color-border)" }}>
                <td className="px-4 py-3 mono font-medium" style={{ color: "var(--color-text)" }}>{s.rollNumber}</td>
                <td className="px-4 py-3 mono" style={{ color: "var(--color-text)" }}>{s.name}</td>
                <td className="px-4 py-3 mono" style={{ color: "var(--color-muted)" }}>{s.email}</td>
                <td className="px-4 py-3 mono" style={{ color: "var(--color-accent)" }}>@{s.githubUsername}</td>
                <td className="px-4 py-3">
                  <span className="mono px-2 py-0.5 rounded" style={{ background: "var(--color-surface-2)", color: "var(--color-text)" }}>{s.team}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="mono px-2 py-0.5 rounded" style={{ background: s.status === "active" ? "var(--color-green-dim)" : "var(--color-surface-2)", color: s.status === "active" ? "var(--color-green)" : "var(--color-muted)" }}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center mono text-sm" style={{ color: "var(--color-muted)" }}>No students match your filters</div>
        )}
      </div>
    </div>
  );
}
