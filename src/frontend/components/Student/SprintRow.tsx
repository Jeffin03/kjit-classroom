import type { DiffMetrics, SprintSummary } from "@/backend/types"
import SprintPill, { type SprintState } from "../SprintPill"

interface SprintRowProps {
  index: number
  label: string
  status: SprintState
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
    <div className="text-[13px] text-[var(--color-ink-muted)]">
      <span className="font-medium text-[var(--color-ink)]">{label}:</span>{" "}
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
    <div className="border-b border-[var(--color-border)] py-5 last:border-0">
      <div className="flex flex-wrap items-center gap-3">
        <h4 className="text-base font-medium text-[var(--color-ink)]">
          Sprint {index}
          {label ? ` — ${label}` : ""}
        </h4>
        <SprintPill state={status} />
      </div>

      <div className="mt-3 min-w-0">
        {status === "pending" ? (
          <>
            <p className="mb-3 text-sm text-[var(--color-ink-muted)]">
              Not submitted yet
            </p>
            {onSubmit && (
              <button
                onClick={onSubmit}
                className="inline-flex min-h-10 items-center rounded-lg bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
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
                  className="font-mono text-[13px] text-[var(--color-ink-muted)] hover:underline"
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
              <div className="mt-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-4">
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