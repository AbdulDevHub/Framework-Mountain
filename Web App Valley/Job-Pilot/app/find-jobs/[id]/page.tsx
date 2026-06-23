export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { PostHogIdentify } from "@/components/analytics/PostHogIdentify";
import { CompanyResearch } from "@/components/job-details/CompanyResearch";
import { JobActions } from "@/components/job-details/JobActions";
import { JobDescription } from "@/components/job-details/JobDescription";
import { JobInfo } from "@/components/job-details/JobInfo";
import { MatchScore } from "@/components/job-details/MatchScore";
import { Navbar } from "@/components/layout/Navbar";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import type { Job } from "@/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailsPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const insforge = await createInsforgeServer();

  const { data: job, error } = await insforge.database
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<Job>();

  if (error) {
    console.error("[find-jobs/id]", error);
  }

  if (error || !job) {
    notFound();
  }

  const company = job.company ?? "this company";
  const applyUrl = job.external_apply_url ?? job.source_url;

  return (
    <>
      <PostHogIdentify userId={user.id} />
      <Navbar isAuthenticated />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[820px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-0">
        <JobActions applyUrl={applyUrl} company={company} showBackLink />
        <JobInfo job={job} />
        <MatchScore
          matchReason={job.match_reason}
          matchedSkills={job.matched_skills}
          missingSkills={job.missing_skills}
        />
        <JobDescription
          aboutRole={job.about_role}
          responsibilities={job.responsibilities}
          requirements={job.requirements}
          niceToHave={job.nice_to_have}
          benefits={job.benefits}
          sourceUrl={applyUrl}
        />
        <CompanyResearch
          company={company}
          jobId={job.id}
          research={job.company_research}
        />
        <JobActions applyUrl={applyUrl} company={company} showApplyButton />
      </main>
    </>
  );
}
