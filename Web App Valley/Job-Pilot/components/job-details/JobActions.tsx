import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  applyUrl: string | null;
  company: string;
  showBackLink?: boolean;
  showApplyButton?: boolean;
};

export function JobActions({
  applyUrl,
  company,
  showBackLink = false,
  showApplyButton = false,
}: Props) {
  const resolvedUrl = applyUrl ?? "/find-jobs";

  return (
    <>
      {showBackLink && (
        <Link
          href="/find-jobs"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Link>
      )}

      {showApplyButton && (
        <Link
          href={resolvedUrl}
          target={applyUrl ? "_blank" : undefined}
          rel={applyUrl ? "noreferrer" : undefined}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-accent px-4 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Apply Now at {company}
        </Link>
      )}
    </>
  );
}
