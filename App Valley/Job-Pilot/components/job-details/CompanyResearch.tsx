import Link from "next/link";
import type { ComponentType } from "react";
import {
  Building2,
  CircleHelp,
  Code2,
  Compass,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { ResearchCompanyButton } from "@/components/job-details/ResearchCompanyButton";
import type { CompanyResearchDossier } from "@/types";

type Props = {
  company: string;
  jobId: string;
  research: CompanyResearchDossier | null;
};

type SectionProps = {
  title: string;
  items: string[];
  icon: ComponentType<{ className?: string }>;
  variant?: "accent" | "success" | "info";
};

function getIconClasses(variant: SectionProps["variant"]): string {
  if (variant === "success") {
    return "bg-success-lightest text-success";
  }

  if (variant === "info") {
    return "bg-info-lightest text-info-medium";
  }

  return "bg-accent-muted text-accent";
}

function ResearchList({ title, items, icon: Icon, variant }: SectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-4">
      <div className="mb-3 flex items-center gap-2">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${getIconClasses(variant)}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold leading-5 text-text-primary">
          {title}
        </h3>
      </div>
      <ul className="space-y-2 text-sm font-medium leading-6 text-text-primary">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TechStack({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold leading-5 text-text-primary">
        Tech Stack
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent"
          >
            <Code2 className="h-3 w-3" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function Sources({ sources }: { sources: string[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="border-t border-border px-6 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        Sources
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {sources.map((source) => (
          <Link
            key={source}
            href={source}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            {source}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CompanyResearch({ company, jobId, research }: Props) {
  const hasResearch = research !== null;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted">
            <Building2 className="h-4 w-4 text-accent" />
          </div>
          <h2 className="text-base font-semibold leading-6 text-text-primary">
            Company Research
          </h2>
        </div>

        {!hasResearch && <ResearchCompanyButton jobId={jobId} />}
      </div>

      {research ? (
        <>
          <div className="flex flex-col gap-6 p-6">
            <div className="rounded-xl border border-border bg-surface-secondary p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-muted text-accent">
                  <Compass className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold leading-5 text-text-primary">
                  Company Overview
                </h3>
              </div>
              <p className="text-sm font-medium leading-6 text-text-primary">
                {research.companyOverview}
              </p>
            </div>

            <TechStack items={research.techStack} />

            <div className="grid gap-4 md:grid-cols-2">
              <ResearchList
                title="Culture"
                items={research.culture}
                icon={Users}
                variant="info"
              />
              <ResearchList
                title="Your Edge"
                items={research.yourEdge}
                icon={ShieldCheck}
                variant="success"
              />
              <ResearchList
                title="Gaps to Address"
                items={research.gapsToAddress}
                icon={ListChecks}
              />
              <ResearchList
                title="Smart Questions"
                items={research.smartQuestions}
                icon={CircleHelp}
                variant="info"
              />
              <ResearchList
                title="Interview Prep"
                items={research.interviewPrep}
                icon={MessageSquareText}
                variant="success"
              />
            </div>

            <div className="rounded-xl border border-border bg-surface-secondary p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-lightest text-success">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold leading-5 text-text-primary">
                  Why This Role
                </h3>
              </div>
              <p className="text-sm font-medium leading-6 text-text-primary">
                {research.whyThisRole}
              </p>
            </div>
          </div>

          <Sources sources={research.sources} />
        </>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary">
            <Building2 className="h-6 w-6 text-text-muted" />
          </div>
          <p className="mt-5 text-sm font-semibold leading-5 text-text-primary">
            No research yet
          </p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-text-muted">
            Click &quot;Research Company&quot; to let the AI browse {company}
            &apos;s public pages and build a dossier.
          </p>
          <div className="mt-5 flex items-center gap-2 rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent">
            <Sparkles className="h-3 w-3" />
            Candidate-specific briefing
          </div>
          <div className="mt-4">
            <ResearchCompanyButton jobId={jobId} />
          </div>
        </div>
      )}
    </section>
  );
}
