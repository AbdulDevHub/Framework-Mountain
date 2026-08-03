"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, BellOff, CheckCircle2, XCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { PageContainer, PageHeader } from "@/app/components/ui/PageContainer";
import { Card, CardBody } from "@/app/components/ui/Card";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import { Button } from "@/app/components/ui/Button";
import { Spinner } from "@/app/components/ui/Spinner";
import { EmptyState } from "@/app/components/ui/EmptyState";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
] as const;

export function RemindersContent() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<string>("all");

  const reminders = trpc.reminder.list.useQuery(filter === "all" ? undefined : { status: filter as "pending" | "sent" | "failed" | "cancelled" });

  const cancel = trpc.reminder.cancel.useMutation({
    onSuccess: async () => {
      await utils.reminder.list.invalidate();
    },
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-rose-500" />;
      case "cancelled":
        return <BellOff className="h-4 w-4 text-slate-400" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Reminders"
        description="Upcoming and past application follow-ups, queued via BullMQ"
        action={
          <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f.value ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      />

      {reminders.isLoading && (
        <div className="flex items-center gap-3 py-16 text-sm text-slate-500">
          <Spinner /> Loading reminders…
        </div>
      )}

      {reminders.error && <p className="py-8 text-sm text-red-600">{reminders.error.message}</p>}

      {reminders.data && reminders.data.length === 0 && (
        <Card>
          <EmptyState
            icon={Bell}
            title="No reminders yet"
            description="Schedule a follow-up from any application to see it here."
            action={
              <Link href="/dashboard">
                <Button variant="secondary">Go to dashboard</Button>
              </Link>
            }
          />
        </Card>
      )}

      {reminders.data && reminders.data.length > 0 && (
        <div className="space-y-3">
          {reminders.data.map((r) => (
            <Card key={r.id}>
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{statusIcon(r.status)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className="text-sm font-medium text-slate-900">
                        {new Date(r.scheduledFor).toLocaleString()}
                      </span>
                    </div>
                    <Link href={`/applications/${r.applicationId}`} className="mt-1 block text-sm font-medium text-brand-600 hover:text-brand-700">
                      {r.application.company} — {r.application.role}
                    </Link>
                    {r.failureReason && <p className="mt-1 text-xs text-rose-600">{r.failureReason}</p>}
                  </div>
                </div>
                {r.status === "pending" && (
                  <Button variant="secondary" size="sm" onClick={() => cancel.mutate({ id: r.id })} disabled={cancel.isPending}>
                    <BellOff className="h-4 w-4" />
                    {cancel.isPending ? "Cancelling…" : "Cancel"}
                  </Button>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}