import Link from "next/link";
import { Building2 } from "lucide-react";

import { getMatchScoreColor, getMatchScoreTextColor, formatDate } from "@/lib/utils";
import type { Job } from "@/types";

type Props = {
  jobs: Job[];
  isLoading?: boolean;
};

function MatchScoreBar({ score }: { score: number }) {
  const fillColor = getMatchScoreColor(score);
  const textColor = getMatchScoreTextColor(score);

  return (
    <div className="flex items-center gap-3">
      <div className="h-1 w-24 overflow-hidden rounded-full bg-border-light">
        <div
          className={`h-full rounded-full ${fillColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-sm font-medium ${textColor}`}>{score}%</span>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  if (source === "search") {
    return (
      <span className="inline-flex items-center rounded-full bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
        Search
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-medium text-text-secondary">
      URL
    </span>
  );
}

export function JobsTable({ jobs, isLoading = false }: Props) {
  if (jobs.length === 0 && !isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-surface shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary">
            <Building2 className="h-6 w-6 text-text-muted" />
          </div>
          <p className="text-sm text-text-muted">No jobs found yet. Run a search to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-border bg-surface shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] overflow-hidden transition-opacity ${isLoading ? "opacity-60" : "opacity-100"}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
              Company
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
              Match Score
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
              Salary Est.
            </th>
            <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary sm:table-cell">
              Source
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
              Date Found
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, index) => (
            <tr
              key={job.id}
              className={`group cursor-pointer hover:bg-surface-secondary ${
                index < jobs.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <td className="px-6 py-4">
                <Link href={`/find-jobs/${job.id}`} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-surface-secondary">
                    <Building2 className="h-4 w-4 text-text-muted" />
                  </div>
                  <span className="text-sm font-medium text-text-primary">
                    {job.company ?? "—"}
                  </span>
                </Link>
              </td>
              <td className="px-6 py-4">
                <Link href={`/find-jobs/${job.id}`} className="block">
                  <span className="text-sm text-text-primary">{job.title ?? "—"}</span>
                </Link>
              </td>
              <td className="px-6 py-4">
                <Link href={`/find-jobs/${job.id}`} className="block">
                  {job.match_score !== null ? (
                    <MatchScoreBar score={job.match_score} />
                  ) : (
                    <span className="text-sm text-text-muted">—</span>
                  )}
                </Link>
              </td>
              <td className="px-6 py-4">
                <Link href={`/find-jobs/${job.id}`} className="block">
                  <span className="text-sm text-text-primary">{job.salary ?? "—"}</span>
                </Link>
              </td>
              <td className="hidden px-6 py-4 sm:table-cell">
                <Link href={`/find-jobs/${job.id}`} className="block">
                  <SourceBadge source={job.source} />
                </Link>
              </td>
              <td className="px-6 py-4">
                <Link href={`/find-jobs/${job.id}`} className="block">
                  <span className="text-sm text-text-muted">{formatDate(job.found_at)}</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
