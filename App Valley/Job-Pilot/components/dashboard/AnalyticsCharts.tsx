"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DayCount = { day: string; count: number };
type MatchBucket = { range: string; count: number };

const AXIS_STYLE = { fill: "#9CA3AF", fontSize: 12 };

export function CompanyResearchChart({ data }: { data: DayCount[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <h2 className="text-base font-semibold leading-6 text-text-primary">
        Company Research Activity
      </h2>
      <div className="mt-6 h-55">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--color-border)"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={AXIS_STYLE}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={AXIS_STYLE}
              tickCount={5}
            />
            <Tooltip
              cursor={{ fill: "var(--color-surface-secondary)" }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="count"
              fill="var(--color-info)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function JobsOverTimeChart({ data }: { data: DayCount[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <h2 className="text-base font-semibold leading-6 text-text-primary">
        Jobs Found Over Time
      </h2>
      <div className="mt-6 h-55">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="jobsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-accent)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-accent)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--color-border)"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={AXIS_STYLE}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={AXIS_STYLE}
              tickCount={5}
            />
            <Tooltip
              cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--color-accent)"
              strokeWidth={3}
              fill="url(#jobsGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function MatchDistributionChart({ data }: { data: MatchBucket[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <h2 className="text-base font-semibold leading-6 text-text-primary">
        Match Score Distribution
      </h2>
      <div className="mt-6 h-55">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--color-border)"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="range"
              axisLine={false}
              tickLine={false}
              tick={AXIS_STYLE}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={AXIS_STYLE}
              tickCount={5}
            />
            <Tooltip
              cursor={{ fill: "var(--color-surface-secondary)" }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="count"
              fill="var(--color-success)"
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
