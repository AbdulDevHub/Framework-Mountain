"use client";

import posthog from "posthog-js";

function getPostHogKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_KEY ??
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  );
}

export function initPostHog(): void {
  const key = getPostHogKey();
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

  if (!key || typeof window === "undefined") {
    return;
  }

  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
}

export function identifyPostHogUser(userId: string): void {
  if (!getPostHogKey()) {
    return;
  }

  posthog.identify(userId, { userId });
}

export function resetPostHogUser(): void {
  if (!getPostHogKey()) {
    return;
  }

  posthog.reset();
}
