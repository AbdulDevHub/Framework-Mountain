import type { MissingField } from "@/types";

type Props = {
  completionPercent: number;
  missingFields: MissingField[];
};

export function ProfileAttentionBanner({
  completionPercent,
  missingFields,
}: Props) {
  if (completionPercent === 100) return null;

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (completionPercent / 100) * circumference;

  return (
    <section className="flex items-start justify-between gap-6 rounded-2xl border border-border bg-surface p-6 shadow-card">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="8" fill="var(--color-warning)" />
            <rect x="7" y="4" width="2" height="5" rx="1" fill="white" />
            <rect x="7" y="10" width="2" height="2" rx="1" fill="white" />
          </svg>
          <h2 className="text-sm font-semibold text-text-primary">
            Profile needs attention
          </h2>
        </div>

        <p className="mt-1 text-sm text-text-secondary">
          Complete the following fields to improve your chances of getting
          quality resumes.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {missingFields.map((field) => (
            <span
              key={field}
              className="rounded-sm bg-warning px-2 py-0.5 text-xs font-medium text-warning-foreground"
            >
              {field}
            </span>
          ))}
        </div>
      </div>

      <div className="relative flex-shrink-0" style={{ width: 88, height: 88 }}>
        <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="8"
          />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 44 44)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold leading-none text-text-primary">
            {completionPercent}%
          </span>
        </div>
      </div>
    </section>
  );
}
