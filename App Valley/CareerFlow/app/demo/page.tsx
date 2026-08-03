"use client";

import { Briefcase, Layers, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { PageContainer, PageHeader } from "@/app/components/ui/PageContainer";
import { Card, CardBody } from "@/app/components/ui/Card";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import { Spinner } from "@/app/components/ui/Spinner";
import { EmptyState } from "@/app/components/ui/EmptyState";

// No Server Component gate needed here, unlike dashboard/page.tsx —
// there's nothing to protect. Every procedure this page calls
// (trpc.demo.*) is a publicProcedure reading a fixed seeded user's
// data; there's no session-dependent branching at all.
export default function DemoPage() {
  const jobPostings = trpc.demo.jobPostings.useQuery();
  const applications = trpc.demo.applications.useQuery();
  const matchResults = trpc.demo.matchResults.useQuery();

  return (
    <PageContainer>
      <PageHeader
        title="Demo"
        description="Read-only sample data — no login required."
      />

      <div className="space-y-8">
        {/* Job postings */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Job postings</h2>
          {jobPostings.isLoading && (
            <div className="flex items-center gap-3 py-8 text-sm text-slate-500">
              <Spinner /> Loading postings…
            </div>
          )}
          {jobPostings.error && <p className="py-4 text-sm text-red-600">{jobPostings.error.message}</p>}
          {jobPostings.data && jobPostings.data.length === 0 && (
            <Card>
              <EmptyState icon={Briefcase} title="No postings" description="No seeded job postings yet." />
            </Card>
          )}
          {jobPostings.data && jobPostings.data.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {jobPostings.data.map((jp) => (
                <Card key={jp.id}>
                  <CardBody>
                    <p className="font-medium text-slate-900">{jp.title}</p>
                    <p className="text-sm text-slate-500">{jp.company}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Applications */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Applications</h2>
          {applications.isLoading && (
            <div className="flex items-center gap-3 py-8 text-sm text-slate-500">
              <Spinner /> Loading applications…
            </div>
          )}
          {applications.error && <p className="py-4 text-sm text-red-600">{applications.error.message}</p>}
          {applications.data && applications.data.length === 0 && (
            <Card>
              <EmptyState icon={Layers} title="No applications" description="No seeded applications yet." />
            </Card>
          )}
          {applications.data && applications.data.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {applications.data.map((app) => (
                <Card key={app.id}>
                  <CardBody>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{app.role}</p>
                        <p className="text-sm text-slate-500">{app.company}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                    {app.statusLog && app.statusLog.length > 0 && (
                      <p className="mt-3 text-xs text-slate-400">
                        {app.statusLog.length} status change{app.statusLog.length === 1 ? "" : "s"}
                      </p>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Match scores */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Match scores</h2>
          {matchResults.isLoading && (
            <div className="flex items-center gap-3 py-8 text-sm text-slate-500">
              <Spinner /> Loading match scores…
            </div>
          )}
          {matchResults.error && <p className="py-4 text-sm text-red-600">{matchResults.error.message}</p>}
          {matchResults.data && matchResults.data.length === 0 && (
            <Card>
              <EmptyState icon={Sparkles} title="No match scores" description="No seeded match scores yet." />
            </Card>
          )}
          {matchResults.data && matchResults.data.length > 0 && (
            <div className="space-y-3">
              {matchResults.data.map((m) => (
                <Card key={m.id}>
                  <CardBody>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          {m.resume.label} <span className="text-slate-400">↔</span> {m.jobPosting.title}
                        </p>
                        <p className="text-sm text-slate-500">{m.jobPosting.company}</p>
                      </div>
                      <div className="flex gap-4 text-right">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Full-text</p>
                          <p className="text-lg font-semibold text-slate-900">{m.ftsScore.toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Trigram</p>
                          <p className="text-lg font-semibold text-slate-900">{m.trigramScore.toFixed(3)}</p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}