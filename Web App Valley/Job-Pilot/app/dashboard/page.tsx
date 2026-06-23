import { PostHogIdentify } from "@/components/analytics/PostHogIdentify";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import {
  CompanyResearchChart,
  JobsOverTimeChart,
  MatchDistributionChart,
} from "@/components/dashboard/AnalyticsCharts";
import { ProfileAttentionBanner } from "@/components/profile/ProfileAttentionBanner";
import { Navbar } from "@/components/layout/Navbar";
import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { calculateCompletion } from "@/lib/profile-utils";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types";

type JobStatsRow = {
  match_score: number | null;
  company_research: unknown;
  found_at: string;
};

type AgentRunRow = {
  id: string;
  job_title_searched: string | null;
  jobs_found: number | null;
  completed_at: string | null;
};

type ResearchedJobRow = {
  id: string;
  company: string;
  found_at: string;
};

const DAYS_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MATCH_BUCKETS = ["50-60%", "60-70%", "70-80%", "80-90%", "90-100%"] as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const insforge = await createInsforgeServer();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const [{ data: profile }, { data: jobRows }, { data: agentRuns }, { data: researchedJobs }] =
    await Promise.all([
      insforge.database
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle<Profile>(),
      insforge.database
        .from("jobs")
        .select("match_score, company_research, found_at")
        .eq("user_id", user.id)
        .returns<JobStatsRow[]>(),
      insforge.database
        .from("agent_runs")
        .select("id, job_title_searched, jobs_found, completed_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(10)
        .returns<AgentRunRow[]>(),
      insforge.database
        .from("jobs")
        .select("id, company, found_at")
        .eq("user_id", user.id)
        .not("company_research", "is", null)
        .order("found_at", { ascending: false })
        .limit(10)
        .returns<ResearchedJobRow[]>(),
    ]);

  // Stats
  const jobs = jobRows ?? [];
  const totalJobs = jobs.length;
  const avgMatchRate =
    totalJobs > 0
      ? Math.round(jobs.reduce((sum, j) => sum + (j.match_score ?? 0), 0) / totalJobs)
      : 0;
  const companiesResearched = jobs.filter((j) => j.company_research !== null).length;
  const jobsThisWeek = jobs.filter((j) => new Date(j.found_at) >= weekAgo).length;

  // Recent activity — merge agent_runs + researched jobs, sort by time, take top 10
  type ActivityItem = {
    id: string;
    text: string;
    time: string;
    type: "job_found" | "researched";
    sortKey: number;
  };

  const runItems: ActivityItem[] = (agentRuns ?? [])
    .filter((r) => r.completed_at)
    .map((r) => ({
      id: `run-${r.id}`,
      text: `Found ${r.jobs_found ?? 0} jobs for ${r.job_title_searched ?? "your search"}`,
      time: formatDate(r.completed_at!),
      type: "job_found" as const,
      sortKey: new Date(r.completed_at!).getTime(),
    }));

  const researchItems: ActivityItem[] = (researchedJobs ?? []).map((j) => ({
    id: `research-${j.id}`,
    text: `Researched ${j.company}`,
    time: formatDate(j.found_at),
    type: "researched" as const,
    sortKey: new Date(j.found_at).getTime(),
  }));

  const activityItems = [...runItems, ...researchItems]
    .sort((a, b) => b.sortKey - a.sortKey)
    .slice(0, 10)
    .map(({ id, text, time, type }) => ({ id, text, time, type }));

  // Chart data — derived from DB jobs rows

  // Jobs found per day of week (last 7 days)
  const jobsByDay: Record<string, number> = {};
  for (const j of jobs) {
    const d = new Date(j.found_at);
    if (d >= weekAgo) {
      const label = DAY_LABELS[d.getDay()];
      jobsByDay[label] = (jobsByDay[label] ?? 0) + 1;
    }
  }
  const jobsOverTimeData = DAYS_ORDER.map((d) => ({ day: d, count: jobsByDay[d] ?? 0 }));

  // Company research activity per day of week (last 7 days)
  const researchByDay: Record<string, number> = {};
  for (const j of jobs) {
    if (j.company_research !== null) {
      const d = new Date(j.found_at);
      if (d >= weekAgo) {
        const label = DAY_LABELS[d.getDay()];
        researchByDay[label] = (researchByDay[label] ?? 0) + 1;
      }
    }
  }
  const researchActivityData = DAYS_ORDER.map((d) => ({ day: d, count: researchByDay[d] ?? 0 }));

  // Match score distribution (all time, scores >= 50)
  const matchCounts: Record<string, number> = {};
  for (const j of jobs) {
    const score = j.match_score ?? 0;
    if (score < 50) continue;
    const bucket =
      score >= 90
        ? "90-100%"
        : score >= 80
          ? "80-90%"
          : score >= 70
            ? "70-80%"
            : score >= 60
              ? "60-70%"
              : "50-60%";
    matchCounts[bucket] = (matchCounts[bucket] ?? 0) + 1;
  }
  const matchDistributionData = MATCH_BUCKETS.map((r) => ({ range: r, count: matchCounts[r] ?? 0 }));

  // Profile completion
  const { completionPercent, missingFields } = calculateCompletion(
    profile ?? {
      full_name: null,
      phone: null,
      location: null,
      current_title: null,
      experience_level: null,
      years_experience: null,
      skills: [],
      work_experience: null,
      education: null,
    },
  );

  return (
    <>
      <PostHogIdentify userId={user.id} />
      <Navbar isAuthenticated />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-360 flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        {completionPercent < 100 && (
          <ProfileAttentionBanner
            completionPercent={completionPercent}
            missingFields={missingFields}
          />
        )}

        <StatsBar
          totalJobs={totalJobs}
          avgMatchRate={avgMatchRate}
          companiesResearched={companiesResearched}
          jobsThisWeek={jobsThisWeek}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RecentActivity items={activityItems} />
          <CompanyResearchChart data={researchActivityData} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <JobsOverTimeChart data={jobsOverTimeData} />
          <MatchDistributionChart data={matchDistributionData} />
        </div>
      </main>
    </>
  );
}
