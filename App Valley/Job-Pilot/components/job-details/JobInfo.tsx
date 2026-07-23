import Link from "next/link";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  DollarSign,
  ExternalLink,
  MapPin,
} from "lucide-react";

import { formatDate } from "@/lib/utils";
import type { Job } from "@/types";

type InfoItem = {
  label: string;
  value: string;
  icon: typeof DollarSign;
  iconClassName: string;
  iconBackgroundClassName: string;
};

type Props = {
  job: Job;
};

function formatJobType(jobType: string | null): string {
  if (!jobType) return "—";

  const normalized = jobType.replace(/[_-]/g, " ").trim();
  if (!normalized) return "—";

  return normalized
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function InfoCard({ item }: { item: InfoItem }) {
  const Icon = item.icon;

  return (
    <article className="flex min-h-20 items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${item.iconBackgroundClassName}`}
      >
        <Icon className={`h-5 w-5 ${item.iconClassName}`} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold leading-5 text-text-primary">
          {item.value}
        </p>
        <p className="mt-1 text-xs font-medium uppercase leading-4 tracking-wide text-text-muted">
          {item.label}
        </p>
      </div>
    </article>
  );
}

export function JobInfo({ job }: Props) {
  const company = job.company ?? "Unknown company";
  const matchScore = job.match_score ?? 0;
  const applyUrl = job.external_apply_url ?? job.source_url ?? "/find-jobs";
  const infoItems: InfoItem[] = [
    {
      label: "Salary Est.",
      value: job.salary ?? "—",
      icon: DollarSign,
      iconClassName: "text-success",
      iconBackgroundClassName: "bg-success-lightest",
    },
    {
      label: "Location",
      value: job.location ?? "—",
      icon: MapPin,
      iconClassName: "text-info-medium",
      iconBackgroundClassName: "bg-info-lightest",
    },
    {
      label: "Job Type",
      value: formatJobType(job.job_type),
      icon: BriefcaseBusiness,
      iconClassName: "text-accent",
      iconBackgroundClassName: "bg-accent-muted",
    },
    {
      label: "Date Found",
      value: formatDate(job.found_at),
      icon: CalendarDays,
      iconClassName: "text-text-secondary",
      iconBackgroundClassName: "bg-surface-secondary",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-border bg-surface-secondary">
              <Building2 className="h-7 w-7 text-text-muted" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold leading-8 text-text-primary">
                {job.title ?? "Untitled role"}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium leading-5 text-text-secondary">
                  {company}
                </p>
                <span className="h-1 w-1 rounded-full bg-text-muted" />
                <span className="inline-flex items-center rounded-full bg-success-lightest px-3 py-1 text-xs font-medium text-success-foreground">
                  {matchScore}% Match Score
                </span>
              </div>
            </div>
          </div>

          <Link
            href={applyUrl}
            target={applyUrl === "/find-jobs" ? undefined : "_blank"}
            rel={applyUrl === "/find-jobs" ? undefined : "noreferrer"}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary"
          >
            <ExternalLink className="h-4 w-4" />
            View Job Post
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {infoItems.map((item) => (
          <InfoCard key={item.label} item={item} />
        ))}
      </div>
    </div>
  );
}
