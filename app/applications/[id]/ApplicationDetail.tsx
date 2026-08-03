"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, CalendarClock, Pencil, Trash2, Building2, FileText, StickyNote } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/app/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/app/components/ui/Card";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import { Spinner } from "@/app/components/ui/Spinner";
import { FieldWrapper, TextInput, TextArea, Select } from "@/app/components/ui/FormFields";
import { ConfirmDeleteModal } from "@/app/components/ui/ConfirmDeleteModal";
import { MatchScoreCard } from "@/app/components/MatchScoreCard";

const STATUSES = ["saved", "applied", "interviewing", "offer", "rejected", "withdrawn", "accepted"] as const;

export function ApplicationDetail({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const app = trpc.application.getById.useQuery({ id: applicationId });
  const jobPostings = trpc.jobPosting.list.useQuery();
  const resumes = trpc.resume.list.useQuery();

  // Edit state
  const [editing, setEditing] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [jobPostingId, setJobPostingId] = useState("");
  const [resumeId, setResumeId] = useState("");

  // Status state
  const [newStatus, setNewStatus] = useState<string>("");

  // Reminder state
  const [reminderDate, setReminderDate] = useState("");
  const [showReminderForm, setShowReminderForm] = useState(false);

  // Delete state
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const update = trpc.application.update.useMutation({
    onSuccess: async () => {
      await utils.application.getById.invalidate({ id: applicationId });
      await utils.application.list.invalidate();
      setEditing(false);
    },
  });

  const updateStatus = trpc.application.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.application.getById.invalidate({ id: applicationId });
      await utils.application.list.invalidate();
      setNewStatus("");
    },
  });

  const scheduleReminder = trpc.reminder.schedule.useMutation({
    onSuccess: async () => {
      await utils.reminder.list.invalidate();
      setShowReminderForm(false);
      setReminderDate("");
    },
  });

  const del = trpc.application.delete.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
    },
  });

  if (app.isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-16 text-sm text-slate-500">
        <Spinner /> Loading application…
      </div>
    );
  }

  if (app.error || !app.data) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-sm text-red-600">{app.error?.message ?? "Application not found."}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const application = app.data;

  function startEdit() {
    setCompany(application.company);
    setRole(application.role);
    setNotes(application.notes ?? "");
    setJobPostingId(application.jobPostingId ?? "");
    setResumeId(application.resumeId ?? "");
    setEditing(true);
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    update.mutate({
      id: applicationId,
      company,
      role,
      notes: notes || undefined,
      jobPostingId: jobPostingId || null,
      resumeId: resumeId || null,
    });
  }

  function handleStatusChange(e: React.FormEvent) {
    e.preventDefault();
    if (!newStatus) return;
    updateStatus.mutate({ id: applicationId, status: newStatus as (typeof STATUSES)[number] });
  }

  function handleScheduleReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!reminderDate) return;
    scheduleReminder.mutate({ applicationId, scheduledFor: new Date(reminderDate) });
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{application.role}</h1>
            <StatusBadge status={application.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            at <span className="font-medium text-slate-700">{application.company}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={startEdit}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Edit form */}
          {editing && (
            <Card>
              <CardHeader title="Edit application" />
              <CardBody>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldWrapper label="Company">
                      <TextInput value={company} onChange={(e) => setCompany(e.target.value)} required />
                    </FieldWrapper>
                    <FieldWrapper label="Role">
                      <TextInput value={role} onChange={(e) => setRole(e.target.value)} required />
                    </FieldWrapper>
                  </div>
                  <FieldWrapper label="Notes">
                    <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                  </FieldWrapper>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldWrapper label="Job posting" hint="Optional — link to a saved posting">
                      <Select value={jobPostingId} onChange={(e) => setJobPostingId(e.target.value)}>
                        <option value="">— None —</option>
                        {jobPostings.data?.map((jp) => (
                          <option key={jp.id} value={jp.id}>
                            {jp.title} — {jp.company}
                          </option>
                        ))}
                      </Select>
                    </FieldWrapper>
                    <FieldWrapper label="Resume" hint="Optional — link a resume variant">
                      <Select value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
                        <option value="">— None —</option>
                        {resumes.data?.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </Select>
                    </FieldWrapper>
                  </div>
                  {update.error && <p className="text-sm text-red-600">{update.error.message}</p>}
                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={update.isPending || !company || !role}>
                      {update.isPending ? "Saving…" : "Save changes"}
                    </Button>
                    <Button variant="ghost" onClick={() => setEditing(false)} disabled={update.isPending}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}

          {/* Status timeline */}
          <Card>
            <CardHeader title="Status history" description="Every status change, in order" />
            <CardBody>
              <form onSubmit={handleStatusChange} className="mb-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <FieldWrapper label="Update status">
                    <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                      <option value="">Select a new status…</option>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </FieldWrapper>
                </div>
                <Button type="submit" disabled={!newStatus || updateStatus.isPending}>
                  {updateStatus.isPending ? "Updating…" : "Update"}
                </Button>
              </form>
              {updateStatus.error && <p className="mb-4 text-sm text-red-600">{updateStatus.error.message}</p>}

              <ol className="relative space-y-6 border-l-2 border-slate-200 pl-6">
                {application.statusLog.map((log) => (
                  <li key={log.id} className="relative">
                    <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-500 ring-2 ring-brand-200" />
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={log.status} />
                      <span className="text-xs text-slate-500">{new Date(log.changedAt).toLocaleString()}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>

          {/* Match score */}
          {application.jobPostingId && application.resumeId ? (
            <MatchScoreCard resumeId={application.resumeId} jobPostingId={application.jobPostingId} />
          ) : (
            <Card>
              <CardBody className="text-sm text-slate-500">
                Link both a job posting and a resume to this application to see a match score.
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader title="Details" />
            <CardBody className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">{application.company}</p>
                  <p className="text-slate-500">Company</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">{application.role}</p>
                  <p className="text-slate-500">Role</p>
                </div>
              </div>
              {application.notes && (
                <div className="flex items-start gap-3">
                  <StickyNote className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="whitespace-pre-wrap text-slate-700">{application.notes}</p>
                    <p className="text-slate-500">Notes</p>
                  </div>
                </div>
              )}
              <div className="border-t border-slate-100 pt-3 text-xs text-slate-500">
                Created {new Date(application.createdAt).toLocaleDateString()} · Updated{" "}
                {new Date(application.updatedAt).toLocaleDateString()}
              </div>
            </CardBody>
          </Card>

          {/* Reminder */}
          <Card>
            <CardHeader
              title="Reminder"
              description="Schedule a follow-up"
              action={
                <button
                  onClick={() => setShowReminderForm((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <Bell className="h-3.5 w-3.5" />
                  {showReminderForm ? "Close" : "Schedule"}
                </button>
              }
            />
            <CardBody>
              {showReminderForm ? (
                <form onSubmit={handleScheduleReminder} className="space-y-3">
                  <FieldWrapper label="When" hint="Date and time to send the follow-up">
                    <TextInput type="datetime-local" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} required />
                  </FieldWrapper>
                  {scheduleReminder.error && <p className="text-sm text-red-600">{scheduleReminder.error.message}</p>}
                  <Button type="submit" disabled={scheduleReminder.isPending || !reminderDate} className="w-full">
                    <CalendarClock className="h-4 w-4" />
                    {scheduleReminder.isPending ? "Scheduling…" : "Schedule reminder"}
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-slate-500">
                  Set a reminder to follow up on this application. It will be queued via BullMQ and sent at the scheduled time.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmDeleteModal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Delete application"
        description={
          <>
            This will permanently delete <span className="font-medium text-slate-900">{application.role}</span> at{" "}
            <span className="font-medium text-slate-900">{application.company}</span>, along with its status history and any
            reminders. This action cannot be undone.
          </>
        }
        isPending={del.isPending}
        error={del.error?.message}
        onConfirm={() => del.mutate({ id: applicationId })}
      />
    </div>
  );
}