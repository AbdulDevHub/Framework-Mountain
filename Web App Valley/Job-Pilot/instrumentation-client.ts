import { initPostHog } from "@/lib/posthog-client";

try {
  initPostHog();
} catch (error) {
  console.error("[instrumentation-client]", error);
}
