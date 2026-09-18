import type { DiffMetrics, SprintSummary } from "@/backend/types"

interface SprintRowProps {
  index: number
  label: string
  status: "done" | "pending" | "pivot"
  repoUrl?: string
  commitSha?: string
  submittedDate?: string
  summary?: string
  previousRepoUrl?: string
  documentationUrl?: string
  summaryDetail?: SprintSummary
  diffMetrics?: DiffMetrics
  onSubmit?: () => void
}

function CommitFileList({ label, files }: { label: string; files: string[] }) {
  if (files.length === 0) return null
  return (
    <div className="text-[13px] text-[var(--color-ink-faint)]">
      <span className="text-[var(--color-ink-muted)]">{label}:</span>{" "}
      {files.slice(0, 3).join(", ")}
      {files.length > 3 && ` +${files.length - 3} more`}
    </div>
  )
}

export function SprintRow({
  index,
  label,
  status,
  repoUrl,
  commitSha,
  submittedDate,
  summary,
  previousRepoUrl,
  documentationUrl,
  summaryDetail,
  diffMetrics,
  onSubmit,
}: SprintRowProps) {
  return (
    <div className="flex gap-4 py-5 border-b border-[var(--color-border)] last:border-0">
      <div className="flex flex-col items-center pt-1">
        <span className={`status-dot status-dot--${status}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <h4 className="text-base font-medium text-[var(--color-ink)]">
            Sprint {index}
            {label ? ` — ${label}` : ""}
          </h4>
          {status === "pivot" && (
            <span className="text-xs text-[var(--color-caution)]">
              pivoted here
            </span>
          )}
        </div>

        {status === "pending" ? (
          <>
            <p className="text-sm text-[var(--color-ink-faint)] mb-3">
              Not submitted yet
            </p>
            {onSubmit && (
              <button
                onClick={onSubmit}
                className="text-sm font-medium text-white bg-[var(--color-accent)] px-4 py-2 rounded-md hover:bg-[#372FA8] transition-colors"
              >
                Submit Sprint {index}
              </button>
            )}
          </>
        ) : (
          <div className="text-sm text-[var(--color-ink-muted)] space-y-1">
            {repoUrl && (
              <div>
                Repo:{" "}
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[13px] text-[var(--color-accent)] hover:underline"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {repoUrl.replace("https://github.com/", "")}
                </a>
              </div>
            )}
            {previousRepoUrl && (
              <div>
                Previous repo:{" "}
                <a
                  href={previousRepoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[13px] text-[var(--color-ink-faint)] hover:underline"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {previousRepoUrl.replace("https://github.com/", "")}
                </a>
              </div>
            )}
            {commitSha && submittedDate && (
              <div>
                Commit:{" "}
                <span
                  className="font-mono text-[13px]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {commitSha.slice(0, 7)}
                </span>{" "}
                · {submittedDate}
              </div>
            )}
            {documentationUrl && (
              <div>
                Documentation:{" "}
                <a
                  href={documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-[var(--color-accent)] hover:underline"
                >
                  View →
                </a>
              </div>
            )}
            {summary && <p className="pt-1">{summary}</p>}
            {summaryDetail && (
              <div className="pt-1 space-y-1">
                <p>{summaryDetail.changed}</p>
                {summaryDetail.completed.length > 0 && (
                  <p>
                    <span className="font-medium text-[var(--color-ink-muted)]">
                      Completed:
                    </span>{" "}
                    {summaryDetail.completed.join(" · ")}
                  </p>
                )}
                {summaryDetail.blockers && (
                  <p>
                    <span className="font-medium text-[var(--color-ink-muted)]">
                      Blockers:
                    </span>{" "}
                    {summaryDetail.blockers}
                  </p>
                )}
                {summaryDetail.demoUrl && (
                  <p>
                    <span className="font-medium text-[var(--color-ink-muted)]">
                      Demo:
                    </span>{" "}
                    <a
                      href={summaryDetail.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-[var(--color-accent)] hover:underline"
                    >
                      View →
                    </a>
                  </p>
                )}
              </div>
            )}
            {diffMetrics && (
              <div className="mt-2 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] p-4">
                <div className="text-[13px] font-medium text-[var(--color-ink)] mb-2">
                  Changes since previous sprint
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-[var(--color-ink-muted)]">
                  <span>
                    <span className="font-semibold text-[var(--color-ink)]">
                      {diffMetrics.totalCommits}
                    </span>{" "}
                    commits
                  </span>
                  <span>
                    <span className="font-semibold text-[var(--color-ink)]">
                      {diffMetrics.filesChanged}
                    </span>{" "}
                    files
                  </span>
                  <span>
                    <span className="font-semibold text-[var(--color-success)]">
                      +{diffMetrics.additions}
                    </span>{" "}
                    <span className="font-semibold text-[var(--color-danger)]">
                      -{diffMetrics.deletions}
                    </span>{" "}
                    lines
                  </span>
                  <span>
                    {diffMetrics.newFiles.length} new,{" "}
                    {diffMetrics.modifiedFiles.length} modified
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  <CommitFileList label="New" files={diffMetrics.newFiles} />
                  <CommitFileList
                    label="Modified"
                    files={diffMetrics.modifiedFiles}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}