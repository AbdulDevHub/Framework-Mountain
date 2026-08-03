"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Briefcase, FileText, Layers, Pencil, Trash2, Sparkles, Bell } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardBody } from "@/app/components/ui/Card";
import { StatusBadge } from "@/app/components/ui/StatusBadge";
import { Button } from "@/app/components/ui/Button";
import { Spinner } from "@/app/components/ui/Spinner";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { ConfirmDeleteModal } from "@/app/components/ui/ConfirmDeleteModal";
import { FieldWrapper, TextInput, TextArea } from "@/app/components/ui/FormFields";

export function DashboardContent() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const jobPostings = trpc.jobPosting.list.useQuery();
  const resumes = trpc.resume.list.useQuery();
  const applications = trpc.application.list.useQuery(undefined);

  // Sent reminders surface here as activity. The worker runs as a
  // SEPARATE process and writes straight to Postgres, so there's no
  // tRPC mutation whose onSuccess could invalidate this — polling
  // (plus React Query's refetch-on-window-focus) is what makes a
  // delivery appear without a manual reload.
  const recentReminders = trpc.reminder.recent.useQuery(undefined, { refetchInterval: 30_000 });

  // Posting edit state
  const [editingPosting, setEditingPosting] = useState<string | null>(null);
  const [postingTitle, setPostingTitle] = useState("");
  const [postingCompany, setPostingCompany] = useState("");
  const [postingDescription, setPostingDescription] = useState("");

  // Resume edit state
  const [editingResume, setEditingResume] = useState<string | null>(null);
  const [resumeLabel, setResumeLabel] = useState("");
  const [resumeText, setResumeText] = useState("");

  // Delete state
  const [deletingPosting, setDeletingPosting] = useState<string | null>(null);
  const [deletingResume, setDeletingResume] = useState<string | null>(null);

  const updatePosting = trpc.jobPosting.update.useMutation({
    onSuccess: async () => {
      await utils.jobPosting.list.invalidate();
      setEditingPosting(null);
    },
  });

  const updateResume = trpc.resume.update.useMutation({
    onSuccess: async () => {
      await utils.resume.list.invalidate();
      setEditingResume(null);
    },
  });

  const deletePosting = trpc.jobPosting.delete.useMutation({
    onSuccess: async () => {
      await utils.jobPosting.list.invalidate();
      await utils.application.list.invalidate();
      setDeletingPosting(null);
    },
  });

  const deleteResume = trpc.resume.delete.useMutation({
    onSuccess: async () => {
      await utils.resume.list.invalidate();
      setDeletingResume(null);
    },
  });

  const postingImpact = trpc.jobPosting.getDeleteImpact.useQuery(
    { id: deletingPosting ?? "" },
    { enabled: !!deletingPosting },
  );
  const resumeImpact = trpc.resume.getDeleteImpact.useQuery({ id: deletingResume ?? "" }, { enabled: !!deletingResume });

  const counts = (applications.data ?? []).reduce<Record<string, number>>((acc, app) => {
    acc[app.status] = (acc[app.status] ?? 0) + 1;
    return acc;
  }, {});

  const totalApplications = applications.data?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
              <Layers className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{totalApplications}</p>
              <p className="text-xs text-slate-500">Applications</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50">
              <Briefcase className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{jobPostings.data?.length ?? "…"}</p>
              <p className="text-xs text-slate-500">Postings</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{resumes.data?.length ?? "…"}</p>
              <p className="text-xs text-slate-500">Resumes</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{counts.interviewing ?? 0}</p>
              <p className="text-xs text-slate-500">Interviewing</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/applications/new">
          <Button>
            <Plus className="h-4 w-4" /> Log an application
          </Button>
        </Link>
        <Link href="/match">
          <Button variant="secondary">
            <Sparkles className="h-4 w-4" /> Batch match
          </Button>
        </Link>
        <Link href="/reminders">
          <Button variant="secondary">
            <Bell className="h-4 w-4" /> Reminders
          </Button>
        </Link>
      </div>

      {/* Applications */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Applications</h2>
          <span className="text-sm text-slate-500">{totalApplications} total</span>
        </div>

        {applications.isLoading && (
          <div className="flex items-center gap-3 py-8 text-sm text-slate-500">
            <Spinner /> Loading applications…
          </div>
        )}
        {applications.error && <p className="py-4 text-sm text-red-600">{applications.error.message}</p>}

        {applications.data && applications.data.length === 0 && (
          <Card>
            <EmptyState
              icon={Layers}
              title="No applications yet"
              description="Log your first application to start tracking your job search."
              action={
                <Link href="/applications/new">
                  <Button>Log an application</Button>
                </Link>
              }
            />
          </Card>
        )}

        {applications.data && applications.data.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {applications.data.map((app) => (
              <Card key={app.id} hover>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        onClick={() => router.push(`/applications/${app.id}`)}
                        className="text-left font-medium text-slate-900 hover:text-brand-600"
                      >
                        {app.role}
                      </button>
                      <p className="text-sm text-slate-500">{app.company}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                  {app.notes && <p className="mt-3 line-clamp-2 text-sm text-slate-500">{app.notes}</p>}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-400">{new Date(app.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => router.push(`/applications/${app.id}`)}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      View details →
                    </button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Recent reminders */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent reminders</h2>
          <span className="text-sm text-slate-500">Follow-ups sent</span>
        </div>

        {recentReminders.isLoading && (
          <div className="flex items-center gap-3 py-8 text-sm text-slate-500">
            <Spinner /> Loading reminders…
          </div>
        )}
        {recentReminders.error && <p className="py-4 text-sm text-red-600">{recentReminders.error.message}</p>}

        {recentReminders.data && recentReminders.data.length === 0 && (
          <Card>
            <EmptyState
              icon={Bell}
              title="No reminders sent yet"
              description="Schedule a follow-up from any application and sent reminders will show up here."
            />
          </Card>
        )}

        {recentReminders.data && recentReminders.data.length > 0 && (
          <div className="space-y-3">
            {recentReminders.data.map((r) => (
              <Card key={r.id}>
                <CardBody className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                    <Bell className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/applications/${r.applicationId}`}
                      className="block truncate font-medium text-slate-900 hover:text-brand-600"
                    >
                      {r.application.company} — {r.application.role}
                    </Link>
                    <p className="text-sm text-slate-500">Follow-up reminder sent</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {r.sentAt ? new Date(r.sentAt).toLocaleString() : ""}
                  </span>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Job postings */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Job postings</h2>
          <span className="text-sm text-slate-500">{jobPostings.data?.length ?? 0} saved</span>
        </div>

        {jobPostings.isLoading && (
          <div className="flex items-center gap-3 py-8 text-sm text-slate-500">
            <Spinner /> Loading postings…
          </div>
        )}
        {jobPostings.error && <p className="py-4 text-sm text-red-600">{jobPostings.error.message}</p>}

        {jobPostings.data && jobPostings.data.length === 0 && (
          <Card>
            <EmptyState
              icon={Briefcase}
              title="No job postings"
              description="Save job postings to match them against your resumes."
            />
          </Card>
        )}

        {jobPostings.data && jobPostings.data.length > 0 && (
          <div className="space-y-3">
            {jobPostings.data.map((jp) => (
              <Card key={jp.id}>
                <CardBody>
                  {editingPosting === jp.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        updatePosting.mutate({ id: jp.id, title: postingTitle, company: postingCompany, description: postingDescription });
                      }}
                      className="space-y-3"
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <FieldWrapper label="Title">
                          <TextInput value={postingTitle} onChange={(e) => setPostingTitle(e.target.value)} required />
                        </FieldWrapper>
                        <FieldWrapper label="Company">
                          <TextInput value={postingCompany} onChange={(e) => setPostingCompany(e.target.value)} required />
                        </FieldWrapper>
                      </div>
                      <FieldWrapper label="Description">
                        <TextArea value={postingDescription} onChange={(e) => setPostingDescription(e.target.value)} rows={3} required />
                      </FieldWrapper>
                      {updatePosting.error && <p className="text-sm text-red-600">{updatePosting.error.message}</p>}
                      <div className="flex items-center gap-3">
                        <Button type="submit" size="sm" disabled={updatePosting.isPending}>
                          {updatePosting.isPending ? "Saving…" : "Save"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingPosting(null)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{jp.title}</p>
                        <p className="text-sm text-slate-500">{jp.company}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingPosting(jp.id);
                            setPostingTitle(jp.title);
                            setPostingCompany(jp.company);
                            setPostingDescription(jp.description);
                          }}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                          aria-label="Edit posting"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingPosting(jp.id)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete posting"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Resumes */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Resumes</h2>
          <span className="text-sm text-slate-500">{resumes.data?.length ?? 0} variants</span>
        </div>

        {resumes.isLoading && (
          <div className="flex items-center gap-3 py-8 text-sm text-slate-500">
            <Spinner /> Loading resumes…
          </div>
        )}
        {resumes.error && <p className="py-4 text-sm text-red-600">{resumes.error.message}</p>}

        {resumes.data && resumes.data.length === 0 && (
          <Card>
            <EmptyState
              icon={FileText}
              title="No resumes"
              description="Add resume variants to score them against job postings."
            />
          </Card>
        )}

        {resumes.data && resumes.data.length > 0 && (
          <div className="space-y-3">
            {resumes.data.map((r) => (
              <Card key={r.id}>
                <CardBody>
                  {editingResume === r.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        updateResume.mutate({ id: r.id, label: resumeLabel, text: resumeText });
                      }}
                      className="space-y-3"
                    >
                      <FieldWrapper label="Label">
                        <TextInput value={resumeLabel} onChange={(e) => setResumeLabel(e.target.value)} required />
                      </FieldWrapper>
                      <FieldWrapper label="Text">
                        <TextArea value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={4} required />
                      </FieldWrapper>
                      {updateResume.error && <p className="text-sm text-red-600">{updateResume.error.message}</p>}
                      <div className="flex items-center gap-3">
                        <Button type="submit" size="sm" disabled={updateResume.isPending}>
                          {updateResume.isPending ? "Saving…" : "Save"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingResume(null)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{r.label}</p>
                        <p className="text-sm text-slate-500">{r.text.length} characters</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingResume(r.id);
                            setResumeLabel(r.label);
                            setResumeText(r.text);
                          }}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                          aria-label="Edit resume"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingResume(r.id)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete resume"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Delete modals */}
      <ConfirmDeleteModal
        open={!!deletingPosting}
        onClose={() => setDeletingPosting(null)}
        title="Delete job posting"
        description={
          <>
            {postingImpact.isLoading && "Checking what this affects…"}
            {postingImpact.data && (
              <>
                {postingImpact.data.applicationCount > 0 ? (
                  <>
                    This will also permanently delete{" "}
                    <span className="font-medium text-slate-900">
                      {postingImpact.data.applicationCount} linked application
                      {postingImpact.data.applicationCount === 1 ? "" : "s"}
                    </span>{" "}
                    and their match scores. This cannot be undone.
                  </>
                ) : (
                  "No applications are linked to this posting — safe to delete."
                )}
              </>
            )}
          </>
        }
        isPending={deletePosting.isPending}
        error={deletePosting.error?.message}
        onConfirm={() => deletingPosting && deletePosting.mutate({ id: deletingPosting })}
      />

      <ConfirmDeleteModal
        open={!!deletingResume}
        onClose={() => setDeletingResume(null)}
        title="Delete resume"
        description={
          <>
            {resumeImpact.isLoading && "Checking what this affects…"}
            {resumeImpact.data && (
              <>
                {resumeImpact.data.applicationCount > 0 && (
                  <p>
                    {resumeImpact.data.applicationCount} linked application
                    {resumeImpact.data.applicationCount === 1 ? " will stay" : "s will stay"}, just unlinked from this resume.
                  </p>
                )}
                {resumeImpact.data.matchResultCount > 0 && (
                  <p className="mt-1">
                    {resumeImpact.data.matchResultCount} match score
                    {resumeImpact.data.matchResultCount === 1 ? " will be" : "s will be"} permanently deleted.
                  </p>
                )}
                {resumeImpact.data.applicationCount === 0 && resumeImpact.data.matchResultCount === 0 && (
                  <p>No applications or match scores are linked to this resume — safe to delete.</p>
                )}
              </>
            )}
          </>
        }
        isPending={deleteResume.isPending}
        error={deleteResume.error?.message}
        onConfirm={() => deletingResume && deleteResume.mutate({ id: deletingResume })}
      />
    </div>
  );
}