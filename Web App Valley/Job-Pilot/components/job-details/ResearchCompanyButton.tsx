"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";

import type { CompanyResearchDossier } from "@/types";

type Props = {
  jobId: string;
};

export function ResearchCompanyButton({ jobId }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick(): void {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const res = await fetch("/api/agent/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        });
        const json = (await res.json()) as {
          success: boolean;
          data?: { dossier: CompanyResearchDossier };
          error?: string;
        };

        if (!res.ok || !json.success) {
          setError(
            json.error ??
              "Company research could not be completed. Please try again.",
          );
          return;
        }

        setSuccess(true);
        router.refresh();
      } catch {
        setError("Network error. Please check your connection and try again.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        <Search className="h-4 w-4" />
        {isPending ? "Researching..." : "Research Company"}
      </button>
      {error && <p className="max-w-xs text-xs text-error">{error}</p>}
      {success && (
        <p className="max-w-xs text-xs text-success">
          Research saved. Refreshing details...
        </p>
      )}
    </div>
  );
}
