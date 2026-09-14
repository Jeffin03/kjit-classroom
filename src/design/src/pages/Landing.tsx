interface LandingProps {
  onSignIn: (role: "student" | "faculty") => void;
}

export default function Landing({ onSignIn }: LandingProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)" }}>
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative overflow-hidden">
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border text-xs mono" style={{ borderColor: "var(--color-border-bright)", color: "var(--color-muted)", background: "var(--color-surface)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-green)" }} />
            CE Department · KJIT
          </div>

          <h1 className="text-5xl font-bold mb-4 leading-tight tracking-tight" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text)" }}>
            KJIT<br />
            <span style={{ color: "var(--color-accent)" }}>Classroom</span>
          </h1>

          <p className="text-base mb-2" style={{ color: "var(--color-muted)", fontFamily: "var(--font-sans)" }}>
            Project-based learning, tracked sprint by sprint.
          </p>
          <p className="text-sm mb-10" style={{ color: "var(--color-muted)", opacity: 0.7 }}>
            Faculty creates assignments · Students build on GitHub · Progress tracked through timed sprints
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onSignIn("student")}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              <GitHubIcon />
              Sign in as Student
            </button>
            <button
              onClick={() => onSignIn("faculty")}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded text-sm font-semibold transition-all hover:opacity-90 border"
              style={{ borderColor: "var(--color-border-bright)", color: "var(--color-text)", background: "var(--color-surface)" }}
            >
              <GitHubIcon />
              Sign in as Faculty
            </button>
          </div>
          <p className="text-xs mt-4" style={{ color: "var(--color-muted)", opacity: 0.5 }}>Authentication via GitHub OAuth · Only KJIT org members</p>
        </div>
      </div>

      {/* Feature cards */}
      <div className="max-w-screen-lg mx-auto w-full px-6 pb-20 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: "⬡", title: "Sprint Tracking", desc: "Four timed sprints per project. Students submit repo links, commit SHAs, and summaries at each milestone." },
          { icon: "◈", title: "Diff Metrics", desc: "System automatically fetches commits, files changed, and lines added/removed from GitHub for every sprint." },
          { icon: "◉", title: "Lab Reviews", desc: "Faculty reviews submissions sprint-by-sprint, adds review notes, and can update commit hashes with validation." },
        ].map(f => (
          <div key={f.title} className="p-5 rounded border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="text-2xl mb-3 mono" style={{ color: "var(--color-accent)" }}>{f.icon}</div>
            <div className="text-sm font-semibold mb-2 mono" style={{ color: "var(--color-text)" }}>{f.title}</div>
            <div className="text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
