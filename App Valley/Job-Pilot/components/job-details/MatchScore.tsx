import { Check, Sparkles, X } from "lucide-react";

type Props = {
  matchReason: string | null;
  matchedSkills: string[];
  missingSkills: string[];
};

function SkillBadge({
  skill,
  type,
}: {
  skill: string;
  type: "matched" | "missing";
}) {
  const isMatched = type === "matched";
  const Icon = isMatched ? Check : X;
  const className = isMatched
    ? "bg-success-lightest text-success-foreground"
    : "bg-accent-muted text-accent";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${className}`}
    >
      <Icon className="h-3 w-3" />
      {skill}
    </span>
  );
}

export function MatchScore({ matchReason, matchedSkills, missingSkills }: Props) {
  return (
    <>
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-lightest">
            <Sparkles className="h-4 w-4 text-success" />
          </div>
          <h2 className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-secondary">
            AI Match Reasoning
          </h2>
        </div>
        <p className="text-sm font-medium leading-6 text-text-primary">
          {matchReason ?? "No match reasoning is available for this role yet."}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
        <h2 className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-secondary">
          Required Skills vs Your Profile
        </h2>

        <div className="mt-5 flex flex-col gap-4">
          <div>
            <p className="mb-2 text-xs font-medium leading-4 text-text-muted">You have</p>
            {matchedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {matchedSkills.map((skill) => (
                  <SkillBadge key={skill} skill={skill} type="matched" />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No matched skills were recorded.</p>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium leading-4 text-text-muted">Gap skills</p>
            {missingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {missingSkills.map((skill) => (
                  <SkillBadge key={skill} skill={skill} type="missing" />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No gap skills were recorded.</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
