import { MOCK_ANNOUNCEMENTS } from "../data";

export default function Announcements() {
  return (
    <div className="max-w-screen-md mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mono" style={{ color: "var(--color-text)" }}>Announcements</h1>
      </div>

      <div className="mb-4 px-4 py-3 rounded border text-xs" style={{ background: "var(--color-accent-dim)", borderColor: "var(--color-accent)", color: "var(--color-accent)" }}>
        ℹ Announcements are also sent as GitHub org notifications. Make sure you have email notifications enabled for the KJIT GitHub organization.
      </div>

      <div className="flex flex-col gap-4 mt-6">
        {MOCK_ANNOUNCEMENTS.map(a => (
          <div key={a.id} className="rounded border p-5" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold mono text-sm" style={{ color: "var(--color-text)" }}>{a.title}</h2>
              <div className="flex items-center gap-2 text-xs mono" style={{ color: "var(--color-muted)" }}>
                <span>{a.date}</span>
                <span>·</span>
                <span>{a.author}</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>{a.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
