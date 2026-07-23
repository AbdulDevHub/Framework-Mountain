type ActivityType = "job_found" | "researched";

type ActivityItem = {
  id: string;
  text: string;
  time: string;
  type: ActivityType;
};

type Props = {
  items: ActivityItem[];
};

function ActivityDot({ type }: { type: ActivityType }) {
  if (type === "job_found") {
    return (
      <span
        className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
        style={{ background: "var(--color-success-light)" }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: "var(--color-success-alt)" }}
        />
      </span>
    );
  }
  return (
    <span
      className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
      style={{ background: "var(--color-info-light)" }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: "var(--color-info)" }}
      />
    </span>
  );
}

export function RecentActivity({ items }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <h2 className="text-base font-semibold leading-6 text-text-primary">
        Recent Activity
      </h2>
      {items.length === 0 ? (
        <p className="mt-5 text-sm text-text-muted">
          No activity yet. Start by finding jobs on the Find Jobs page.
        </p>
      ) : (
        <ul className="mt-5 space-y-5">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <ActivityDot type={item.type} />
              <div>
                <p className="text-sm font-medium leading-5 text-text-primary">
                  {item.text}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">{item.time}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
