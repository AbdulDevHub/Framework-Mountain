"use client";

import { useState } from "react";
import { RefreshCw, Sparkles, AlertTriangle, History } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "./ui/Button";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Spinner } from "./ui/Spinner";

export function MatchScoreCard({ resumeId, jobPostingId }: { resumeId: string; jobPostingId: string }) {
  const utils = trpc.useUtils();
  const [showHistory, setShowHistory] = useState(false);

  const latest = trpc.match.getLatest.useQuery({ resumeId, jobPostingId });
  const history = trpc.match.getHistory.useQuery({ resumeId, jobPostingId }, { enabled: showHistory });

  const compute = trpc.match.compute.useMutation({
    onSuccess: async () => {
      await utils.match.getLatest.invalidate({ resumeId, jobPostingId });
      await utils.match.getHistory.invalidate({ resumeId, jobPostingId });
    },
  });

  if (latest.isLoading) {
    return (
      <Card>
        <CardBody className="flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Checking for an existing match score…
        </CardBody>
      </Card>
    );
  }

  if (latest.error) {
    return (
      <Card>
        <CardBody className="text-sm text-red-600">{latest.error.message}</CardBody>
      </Card>
    );
  }

  if (!latest.data) {
    return (
      <Card>
        <CardBody>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">No match score yet</p>
              <p className="mt-0.5 text-sm text-slate-500">
                Score this resume against the job posting using Postgres full-text search and trigram similarity.
              </p>
            </div>
            <Button onClick={() => compute.mutate({ resumeId, jobPostingId })} disabled={compute.isPending}>
              {compute.isPending ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <Sparkles className="h-4 w-4" />}
              {compute.isPending ? "Computing…" : "Compute match score"}
            </Button>
          </div>
          {compute.error && <p className="mt-3 text-sm text-red-600">{compute.error.message}</p>}
        </CardBody>
      </Card>
    );
  }

  const { ftsScore, trigramScore, isStale } = latest.data;

  return (
    <Card className={isStale ? "border-amber-300" : undefined}>
      <CardHeader
        title="Match score"
        description="Postgres full-text + trigram similarity"
        action={
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            <History className="h-3.5 w-3.5" />
            {showHistory ? "Hide history" : "History"}
          </button>
        }
      />
      <CardBody>
        {isStale && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This score may be outdated — the resume or posting has changed since it was last computed.
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Full-text</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{ftsScore.toFixed(3)}</p>
            <p className="mt-0.5 text-xs text-slate-500">ts_rank()</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Trigram</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{trigramScore.toFixed(3)}</p>
            <p className="mt-0.5 text-xs text-slate-500">similarity()</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">Computed {new Date(latest.data.computedAt).toLocaleString()}</p>
          <Button variant="secondary" size="sm" onClick={() => compute.mutate({ resumeId, jobPostingId })} disabled={compute.isPending}>
            {compute.isPending ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
            {compute.isPending ? "Recomputing…" : isStale ? "Recompute" : "Recompute anyway"}
          </Button>
        </div>

        {compute.error && <p className="mt-3 text-sm text-red-600">{compute.error.message}</p>}

        {showHistory && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-900">Score history</h4>
            {history.isLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Spinner /> Loading history…
              </div>
            )}
            {history.error && <p className="text-sm text-red-600">{history.error.message}</p>}
            {history.data && history.data.length === 0 && <p className="text-sm text-slate-500">No previous computations.</p>}
            {history.data && history.data.length > 0 && (
              <ul className="space-y-2">
                {history.data.map((h) => (
                  <li key={h.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                    <span className="text-slate-500">{new Date(h.computedAt).toLocaleString()}</span>
                    <span className="font-mono text-xs text-slate-600">
                      FTS {h.ftsScore.toFixed(3)} · Tri {h.trigramScore.toFixed(3)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}