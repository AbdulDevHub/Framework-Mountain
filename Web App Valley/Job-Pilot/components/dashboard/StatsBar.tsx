import { TrendingUp } from "lucide-react";

type Props = {
  totalJobs: number;
  avgMatchRate: number;
  companiesResearched: number;
  jobsThisWeek: number;
};

type StatCard = {
  label: string;
  value: string;
  trendLabel: string;
};

export function StatsBar({
  totalJobs,
  avgMatchRate,
  companiesResearched,
  jobsThisWeek,
}: Props) {
  const stats: StatCard[] = [
    { label: "Total Jobs Found", value: String(totalJobs), trendLabel: "vs last week" },
    { label: "Avg. Match Rate", value: `${avgMatchRate}%`, trendLabel: "vs last week" },
    { label: "Companies Researched", value: String(companiesResearched), trendLabel: "Total researched" },
    { label: "Jobs This Week", value: String(jobsThisWeek), trendLabel: "New this week" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-border bg-surface p-6 shadow-card"
        >
          <p className="text-sm font-medium text-text-secondary">{stat.label}</p>
          <p className="mt-2 text-3xl font-semibold leading-9 text-text-primary">
            {stat.value}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-success-darker" />
            <span className="text-xs text-text-muted">{stat.trendLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
