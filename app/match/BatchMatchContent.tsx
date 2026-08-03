"use client";

import { useState } from "react";
import { Sparkles, CheckSquare, Square } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { PageContainer, PageHeader } from "@/app/components/ui/PageContainer";
import { Card, CardBody, CardHeader } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Spinner } from "@/app/components/ui/Spinner";
import { FieldWrapper, Select } from "@/app/components/ui/FormFields";
import { EmptyState } from "@/app/components/ui/EmptyState";

export function BatchMatchContent() {
  const utils = trpc.useUtils();
  const resumes = trpc.resume.list.useQuery();
  const jobPostings = trpc.jobPosting.list.useQuery();

  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedPostingIds, setSelectedPostingIds] = useState<string[]>([]);

  const computeBatch = trpc.match.computeBatch.useMutation({
    onSuccess: async () => {
      await utils.match.getLatest.invalidate();
      await utils.match.getHistory.invalidate();
    },
  });

  function togglePosting(id: string) {
    setSelectedPostingIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedResumeId || selectedPostingIds.length === 0) return;
    computeBatch.mutate({ resumeId: selectedResumeId, jobPostingIds: selectedPostingIds });
  }

  return (
    <PageContainer>
      <PageHeader
        title="Batch match"
        description="Re-score one resume against multiple job postings at once"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Selection panel */}
        <Card className="lg:col-span-1">
          <CardHeader title="Select" description="Choose a resume and postings to score" />
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-5">
              <FieldWrapper label="Resume">
                <Select value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)}>
                  <option value="">Select a resume…</option>
                  {resumes.data?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </FieldWrapper>

              <div>
                <p className="mb-1 block text-sm font-medium text-slate-700">Job postings</p>
                {jobPostings.isLoading && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Spinner /> Loading postings…
                  </div>
                )}
                {jobPostings.data && jobPostings.data.length === 0 && (
                  <p className="text-sm text-slate-500">No job postings yet. Add some first.</p>
                )}
                {jobPostings.data && jobPostings.data.length > 0 && (
                  <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 p-2 scrollbar-thin">
                    {jobPostings.data.map((jp) => {
                      const checked = selectedPostingIds.includes(jp.id);
                      return (
                        <button
                          key={jp.id}
                          type="button"
                          onClick={() => togglePosting(jp.id)}
                          className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            checked ? "bg-brand-50 text-brand-900" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {checked ? (
                            <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                          ) : (
                            <Square className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          )}
                          <span>
                            <span className="block font-medium">{jp.title}</span>
                            <span className="block text-xs text-slate-500">{jp.company}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {computeBatch.error && <p className="text-sm text-red-600">{computeBatch.error.message}</p>}

              <Button
                type="submit"
                disabled={!selectedResumeId || selectedPostingIds.length === 0 || computeBatch.isPending}
                className="w-full"
              >
                {computeBatch.isPending ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <Sparkles className="h-4 w-4" />}
                {computeBatch.isPending
                  ? "Scoring…"
                  : `Score ${selectedPostingIds.length} posting${selectedPostingIds.length === 1 ? "" : "s"}`}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Results panel */}
        <div className="lg:col-span-2">
          {!computeBatch.data && !computeBatch.isPending && (
            <Card>
              <EmptyState
                icon={Sparkles}
                title="No scores yet"
                description="Select a resume and at least one job posting, then run the batch to see full-text and trigram scores."
              />
            </Card>
          )}

          {computeBatch.isPending && (
            <Card>
              <CardBody className="flex items-center gap-3 text-sm text-slate-500">
                <Spinner /> Computing scores for {selectedPostingIds.length} posting{selectedPostingIds.length === 1 ? "" : "s"}…
              </CardBody>
            </Card>
          )}

          {computeBatch.data && computeBatch.data.length > 0 && (
            <div className="space-y-3">
              {computeBatch.data.map((result) => {
                const posting = jobPostings.data?.find((jp) => jp.id === result.jobPostingId);
                return (
                <Card key={result.id}>
                  <CardBody>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-900">{posting?.title ?? "Unknown posting"}</p>
                        <p className="text-sm text-slate-500">{posting?.company}</p>
                      </div>
                      <div className="flex gap-4 text-right">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Full-text</p>
                          <p className="text-lg font-semibold text-slate-900">{result.ftsScore.toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Trigram</p>
                          <p className="text-lg font-semibold text-slate-900">{result.trigramScore.toFixed(3)}</p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}