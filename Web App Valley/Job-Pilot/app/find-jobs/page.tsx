export const dynamic = "force-dynamic";

import { PostHogIdentify } from "@/components/analytics/PostHogIdentify";
import { FindJobsClient } from "@/components/find-jobs/FindJobsClient";
import { Navbar } from "@/components/layout/Navbar";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import type { Job } from "@/types";

export default async function FindJobsPage() {
  const user = await requireUser();
  const insforge = await createInsforgeServer();

  const { data: jobs, count } = await insforge.database
    .from("jobs")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("match_score", { ascending: false, nullsFirst: false })
    .range(0, 19);

  const initialJobs = (jobs as Job[] | null) ?? [];
  const initialTotalCount = count ?? 0;

  return (
    <>
      <PostHogIdentify userId={user.id} />
      <Navbar isAuthenticated />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <FindJobsClient initialJobs={initialJobs} initialTotalCount={initialTotalCount} />
      </main>
    </>
  );
}
