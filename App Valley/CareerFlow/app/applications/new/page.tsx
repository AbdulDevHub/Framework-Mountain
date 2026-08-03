"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Check } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { MatchScoreCard } from "@/app/components/MatchScoreCard";
import { Button } from "@/app/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/app/components/ui/Card";
import { FieldWrapper, TextInput, TextArea, Select } from "@/app/components/ui/FormFields";
import { Spinner } from "@/app/components/ui/Spinner";

export default function NewApplicationPage() {
  const utils = trpc.useUtils();

  // ── Job posting: pick an existing one, or create one inline ──
  const jobPostings = trpc.jobPosting.list.useQuery();
  const [jobPostingMode, setJobPostingMode] = useState<"select" | "create">("select");
  const [selectedJobPostingId, setSelectedJobPostingId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const createJobPosting = trpc.jobPosting.create.useMutation({
    onSuccess: async (created) => {
      await utils.jobPosting.list.invalidate();
      setSelectedJobPostingId(created.id);
      setJobPostingMode("select");
      setNewTitle("");
      setNewCompany("");
      setNewDescription("");
    },
  });

  // ── Resume: same pattern ──
  const resumes = trpc.resume.list.useQuery();
  const [resumeMode, setResumeMode] = useState<"select" | "create">("select");
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newText, setNewText] = useState("");

  const createResume = trpc.resume.create.useMutation({
    onSuccess: async (created) => {
      await utils.resume.list.invalidate();
      setSelectedResumeId(created.id);
      setResumeMode("select");
      setNewLabel("");
      setNewText("");
    },
  });

  // ── The application itself ──
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");

  const createApplication = trpc.application.create.useMutation({
    onSuccess: async () => {
      await utils.application.list.invalidate();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createApplication.mutate({
      company,
      role,
      notes: notes || undefined,
      jobPostingId: selectedJobPostingId || undefined,
      resumeId: selectedResumeId || undefined,
    });
  }

  // Once the application is logged, if it's linked to BOTH a posting
  // and a resume, MatchScoreCard takes over — the "seeing the match
  // score" half of this flow. If only one (or neither) is linked,
  // there's nothing meaningful to score yet, and the UI says so
  // instead of silently doing nothing.
  const created = createApplication.data;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Log an application</h1>
      <p className="mt-1 text-sm text-slate-500">Track a new application and optionally link a posting and resume.</p>

      {!created && (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* ── Job posting section ── */}
          <Card>
            <CardHeader
              title="Job posting"
              description="Optional — link to a saved posting"
              action={
                jobPostingMode === "select" ? (
                  <Button variant="secondary" size="sm" type="button" onClick={() => setJobPostingMode("create")}>
                    <Plus className="h-4 w-4" /> New posting
                  </Button>
                ) : undefined
              }
            />
            <CardBody>
              {jobPostings.isLoading && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Spinner /> Loading your postings…
                </div>
              )}
              {jobPostings.error && <p className="text-sm text-red-600">{jobPostings.error.message}</p>}

              {jobPostingMode === "select" && (
                <Select value={selectedJobPostingId} onChange={(e) => setSelectedJobPostingId(e.target.value)}>
                  <option value="">— None —</option>
                  {jobPostings.data?.map((jp) => (
                    <option key={jp.id} value={jp.id}>
                      {jp.title} — {jp.company}
                    </option>
                  ))}
                </Select>
              )}

              {jobPostingMode === "create" && (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldWrapper label="Title">
                      <TextInput placeholder="Senior Frontend Engineer" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                    </FieldWrapper>
                    <FieldWrapper label="Company">
                      <TextInput placeholder="Acme Inc." value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
                    </FieldWrapper>
                  </div>
                  <FieldWrapper label="Description" hint="Paste the posting text">
                    <TextArea placeholder="Paste the job description…" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={4} />
                  </FieldWrapper>
                  {createJobPosting.error && <p className="text-sm text-red-600">{createJobPosting.error.message}</p>}
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      size="sm"
                      disabled={!newTitle || !newCompany || !newDescription || createJobPosting.isPending}
                      onClick={() =>
                        createJobPosting.mutate({
                          title: newTitle,
                          company: newCompany,
                          description: newDescription,
                        })
                      }
                    >
                      {createJobPosting.isPending ? "Saving…" : "Save posting"}
                    </Button>
                    <Button variant="ghost" size="sm" type="button" onClick={() => setJobPostingMode("select")}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* ── Resume section ── */}
          <Card>
            <CardHeader
              title="Resume"
              description="Optional — link a resume variant"
              action={
                resumeMode === "select" ? (
                  <Button variant="secondary" size="sm" type="button" onClick={() => setResumeMode("create")}>
                    <Plus className="h-4 w-4" /> New resume
                  </Button>
                ) : undefined
              }
            />
            <CardBody>
              {resumes.isLoading && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Spinner /> Loading your resumes…
                </div>
              )}
              {resumes.error && <p className="text-sm text-red-600">{resumes.error.message}</p>}

              {resumeMode === "select" && (
                <Select value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)}>
                  <option value="">— None —</option>
                  {resumes.data?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              )}

              {resumeMode === "create" && (
                <div className="space-y-3">
                  <FieldWrapper label="Label" hint="e.g. 'Backend-focused'">
                    <TextInput placeholder="Backend-focused" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
                  </FieldWrapper>
                  <FieldWrapper label="Resume text">
                    <TextArea placeholder="Paste your resume text…" value={newText} onChange={(e) => setNewText(e.target.value)} rows={6} />
                  </FieldWrapper>
                  {createResume.error && <p className="text-sm text-red-600">{createResume.error.message}</p>}
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      size="sm"
                      disabled={!newLabel || !newText || createResume.isPending}
                      onClick={() => createResume.mutate({ label: newLabel, text: newText })}
                    >
                      {createResume.isPending ? "Saving…" : "Save resume"}
                    </Button>
                    <Button variant="ghost" size="sm" type="button" onClick={() => setResumeMode("select")}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* ── Application details ── */}
          <Card>
            <CardHeader title="Application" description="The role you're applying for" />
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldWrapper label="Company">
                  <TextInput placeholder="Acme Inc." value={company} onChange={(e) => setCompany(e.target.value)} required />
                </FieldWrapper>
                <FieldWrapper label="Role">
                  <TextInput placeholder="Senior Frontend Engineer" value={role} onChange={(e) => setRole(e.target.value)} required />
                </FieldWrapper>
              </div>
              <FieldWrapper label="Notes" hint="Optional">
                <TextArea placeholder="Any notes about this application…" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </FieldWrapper>
            </CardBody>
          </Card>

          {createApplication.error && <p className="text-sm text-red-600">{createApplication.error.message}</p>}

          <Button type="submit" disabled={createApplication.isPending || !company || !role} className="w-full">
            {createApplication.isPending ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <Check className="h-4 w-4" />}
            {createApplication.isPending ? "Logging…" : "Log application"}
          </Button>
        </form>
      )}

      {created && (
        <div className="mt-8 space-y-6">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                  <Check className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    Logged <span className="text-brand-600">{created.role}</span> at{" "}
                    <span className="text-brand-600">{created.company}</span>
                  </p>
                  <p className="text-sm text-slate-500">Your application has been saved.</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {created.jobPostingId && created.resumeId ? (
            <MatchScoreCard resumeId={created.resumeId} jobPostingId={created.jobPostingId} />
          ) : (
            <Card>
              <CardBody className="text-sm text-slate-500">
                Link both a job posting and a resume to this application to see a match score.
              </CardBody>
            </Card>
          )}

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="secondary">Back to dashboard</Button>
            </Link>
            <Link href="/applications/new">
              <Button>Log another</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}