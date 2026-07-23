"use client";

import { Search, Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
  onSearch: (jobTitle: string, location: string) => void;
  isSearching: boolean;
  successMessage: string | null;
};

export function SearchControls({ onSearch, isSearching, successMessage }: Props) {
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jobTitle.trim()) return;
    onSearch(jobTitle.trim(), location.trim());
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Job Title
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                aria-hidden="true"
              />
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Frontend Engineer"
                className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Remote, New York..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSearching || !jobTitle.trim()}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Find Jobs
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-success-light bg-success-lightest px-4 py-2.5">
            <span className="text-base">✨</span>
            <p className="text-sm font-medium text-success-foreground">{successMessage}</p>
          </div>
        )}
      </form>
    </div>
  );
}
