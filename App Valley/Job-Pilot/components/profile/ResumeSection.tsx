"use client";

import { useRef, useState, useTransition } from "react";

import { extractProfile, uploadResume } from "@/actions/profile";
import type { ExtractedProfile } from "@/actions/profile";

type Props = {
  existingResumeUrl: string | null;
  onExtracted?: (data: ExtractedProfile) => void;
};

export function ResumeSection({ existingResumeUrl, onExtracted }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractSuccess, setExtractSuccess] = useState(false);
  const [isExtracting, startExtractTransition] = useTransition();
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState(false);
  const [isGenerating, startGenerateTransition] = useTransition();

  const hasResume = !!(existingResumeUrl || fileName);

  function handleExtract() {
    setExtractError(null);
    setExtractSuccess(false);
    startExtractTransition(async () => {
      const result = await extractProfile();
      if (result.success && result.data) {
        onExtracted?.(result.data);
        setExtractSuccess(true);
      } else {
        setExtractError(result.error ?? "Extraction failed");
      }
    });
  }

  function handleGenerate() {
    setGenerateError(null);
    setGenerateSuccess(false);
    startGenerateTransition(async () => {
      try {
        const res = await fetch("/api/resume/generate", { method: "POST" });
        const json = (await res.json()) as { success: boolean; error?: string };
        if (json.success) {
          setGenerateSuccess(true);
          window.open("/api/resume/download", "_blank");
        } else {
          setGenerateError(json.error ?? "Generation failed");
        }
      } catch {
        setGenerateError("Generation failed");
      }
    });
  }

  function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are accepted.");
      return;
    }
    setFileName(file.name);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append("resume", file);

    startTransition(async () => {
      const result = await uploadResume(formData);
      if (result.success) {
        setUploadSuccess(true);
      } else {
        setUploadError(result.error ?? "Upload failed");
      }
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  const showExistingLink = existingResumeUrl && !fileName;

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <h2 className="text-base font-semibold text-text-primary">Resume</h2>
      <p className="mt-0.5 text-sm text-text-secondary">
        Upload an existing resume to auto fill the profile, or generate a new
        detailed one from your details below.
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={[
          "mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 transition-colors",
          isDragging
            ? "border-accent bg-accent-muted"
            : "border-border bg-surface-secondary",
        ].join(" ")}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 3L10 13M10 3L7 6M10 3L13 6"
              stroke="var(--color-text-secondary)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 14V15C4 16.1046 4.89543 17 6 17H14C15.1046 17 16 16.1046 16 15V14"
              stroke="var(--color-text-secondary)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {fileName ? (
          <p className="text-sm font-medium text-text-primary">
            {isPending ? "Uploading..." : fileName}
          </p>
        ) : showExistingLink ? (
          <a
            href="/api/resume/download"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent hover:underline"
          >
            View current resume
          </a>
        ) : (
          <>
            <p className="text-sm font-medium text-text-primary">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-text-muted">
              PDF format only. Maximum file size 2MB.
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={handleChange}
        />

        <button
          type="button"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
          className="mt-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary disabled:opacity-60"
        >
          {isPending ? "Uploading..." : "Select Resume"}
        </button>
      </div>

      {uploadError && (
        <p className="mt-2 text-sm text-error">{uploadError}</p>
      )}
      {uploadSuccess && (
        <p className="mt-2 text-sm text-success">Resume uploaded successfully.</p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {hasResume && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-text-muted">
              Auto-fill the form fields below using AI to read your resume.
            </p>
            <button
              type="button"
              disabled={isExtracting}
              onClick={handleExtract}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M8 2L8 10M5 7L8 10L11 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 13H13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              {isExtracting ? "Extracting..." : "Extract Profile"}
            </button>
          </div>
        )}

        {extractError && (
          <p className="text-sm text-error">{extractError}</p>
        )}
        {extractSuccess && (
          <p className="text-sm text-success">
            Profile fields filled in. Review and save below.
          </p>
        )}

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            Need a fresh document based on the info fields below?
          </p>
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary disabled:opacity-60"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 8C2 4.68629 4.68629 2 8 2C9.6 2 11.05 2.65 12.1 3.7L13.5 5H11.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 8C14 11.3137 11.3137 14 8 14C6.4 14 4.95 13.35 3.9 12.3L2.5 11H4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {isGenerating ? "Generating..." : "Generate Resume from Profile"}
          </button>
        </div>

        {generateError && (
          <p className="text-sm text-error">{generateError}</p>
        )}
        {generateSuccess && (
          <p className="text-sm text-success">Resume generated and downloaded.</p>
        )}
      </div>
    </section>
  );
}
