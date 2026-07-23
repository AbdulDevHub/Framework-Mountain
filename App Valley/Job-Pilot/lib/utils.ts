export const MATCH_THRESHOLD = 70;

export function getMatchScoreColor(score: number): string {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-info";
  return "bg-warning";
}

export function getMatchScoreTextColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-info-medium";
  return "text-warning";
}

export function formatSalary(salary: string | null): string {
  return salary ?? "—";
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
