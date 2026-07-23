"use client";

import { useState } from "react";

interface ConnectedAccountsProps {
  linkedinConnected: boolean;
  linkedinContextId: string | null;
}

export function ConnectedAccounts({
  linkedinConnected,
  linkedinContextId: _linkedinContextId,
}: ConnectedAccountsProps) {
  const [isConnected, setIsConnected] = useState(linkedinConnected);
  const [pendingContextId, setPendingContextId] = useState<string | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setIsConnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/linkedin/connect", { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      window.open(json.data.liveViewUrl, "_blank");
      setPendingContextId(json.data.contextId);
      setPendingSessionId(json.data.sessionId);
    } catch {
      setError("Failed to open LinkedIn. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleSaveContext() {
    if (!pendingContextId) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/linkedin/save-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contextId: pendingContextId, sessionId: pendingSessionId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setIsConnected(true);
      setPendingContextId(null);
      setPendingSessionId(null);
    } catch {
      setError("Failed to save connection. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const statusText = isConnected
    ? "Connected"
    : pendingContextId
      ? "Waiting for login…"
      : "Not connected";

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <h2 className="text-base font-semibold text-text-primary">
        Connected Accounts
      </h2>
      <p className="mt-0.5 text-sm text-text-secondary">
        Connect your LinkedIn to let the agent handle manual apply with LinkedIn
        workflows.
      </p>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-linkedin-light">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-label="LinkedIn"
            >
              <rect width="20" height="20" rx="4" fill="#0A66C2" />
              <path
                d="M5.5 8H7.5V14.5H5.5V8ZM6.5 7C5.95 7 5.5 6.55 5.5 6C5.5 5.45 5.95 5 6.5 5C7.05 5 7.5 5.45 7.5 6C7.5 6.55 7.05 7 6.5 7Z"
                fill="white"
              />
              <path
                d="M9 8H10.9V8.9C11.2 8.35 11.95 7.85 13 7.85C14.75 7.85 15.5 8.85 15.5 10.6V14.5H13.5V10.9C13.5 10.05 13.2 9.5 12.4 9.5C11.55 9.5 11 10.1 11 10.9V14.5H9V8Z"
                fill="white"
              />
            </svg>
          </div>

          <div>
            <p className="text-sm font-medium text-text-primary">LinkedIn</p>
            <p className="text-xs text-text-muted">{statusText}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <button
              type="button"
              className="text-xs text-text-muted underline underline-offset-2 hover:text-text-secondary"
            >
              Disconnect
            </button>
          ) : pendingContextId ? (
            <button
              type="button"
              onClick={handleSaveContext}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "I'm Connected"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex items-center gap-2 rounded-lg bg-linkedin px-4 py-2 text-sm font-medium text-linkedin-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isConnecting ? "Opening…" : "Connect LinkedIn"}
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </section>
  );
}
