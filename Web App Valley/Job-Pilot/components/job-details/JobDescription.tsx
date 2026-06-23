import { FileText } from "lucide-react";
import Link from "next/link";

type Props = {
  aboutRole: string | null;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  sourceUrl: string | null;
};

type BulletSection = {
  title: string;
  items: string[];
};

function isTruncatedPreview(description: string | null): boolean {
  if (!description) return false;

  const trimmed = description.trim();
  return trimmed.endsWith("…") || trimmed.endsWith("...");
}

function BulletList({ section }: { section: BulletSection }) {
  if (section.items.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold leading-5 text-text-primary">
        {section.title}
      </h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-medium leading-6 text-text-primary">
        {section.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function JobDescription({
  aboutRole,
  responsibilities,
  requirements,
  niceToHave,
  benefits,
  sourceUrl,
}: Props) {
  const shouldShowFullPostLink = isTruncatedPreview(aboutRole) && sourceUrl;
  const sections: BulletSection[] = [
    { title: "Responsibilities", items: responsibilities },
    { title: "Requirements", items: requirements },
    { title: "Nice to Have", items: niceToHave },
    { title: "Benefits", items: benefits },
  ];

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-secondary">
          <FileText className="h-4 w-4 text-text-secondary" />
        </div>
        <h2 className="text-base font-semibold leading-6 text-text-primary">
          Job Description
        </h2>
      </div>
      <p className="whitespace-pre-line text-sm font-medium leading-6 text-text-primary">
        {aboutRole ?? "No job description is available for this role yet."}
      </p>
      {sections.map((section) => (
        <BulletList key={section.title} section={section} />
      ))}
      {shouldShowFullPostLink && (
        <div className="mt-6 rounded-lg border border-border bg-surface-secondary p-4">
          <p className="text-sm leading-6 text-text-secondary">
            This job board provided a preview that ends mid-sentence. Open the original listing to read the full description.
          </p>
          <Link
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary"
          >
            View Full Job Post
          </Link>
        </div>
      )}
    </section>
  );
}
