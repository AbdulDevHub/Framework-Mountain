import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { trace, context, propagation } from "@opentelemetry/api";
import { env } from "./env";

// ─────────────────────────────────────────────
// Why this is one shared file, called from two different places
// ─────────────────────────────────────────────
// The Next.js API process and the BullMQ worker process are two
// separate Node processes — they don't share memory, so a trace can't
// just "continue" from one into the other the way a normal function
// call would. What makes them show up as ONE trace instead of two
// unrelated ones is:
//   1. Both processes call startOtel() (this file) so both are emitting
//      spans to the same collector.
//   2. The API process, when it enqueues a BullMQ job, serializes its
//      current trace context into the job payload (see reminder.ts).
//   3. The worker, when it picks up the job, deserializes that context
//      and starts its span as a CHILD of it (see reminderWorker.ts).
// That handoff — inject on one side, extract on the other — is what
// stitches "API request enqueued a reminder" and "worker sent the
// reminder 3 days later" into a single trace you can view end to end.

let started = false;

export function startOtel(serviceName: string) {
  if (started) return; // guard against double-init on hot reload
  started = true;

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
    traceExporter: new OTLPTraceExporter({
      // Defaults to a local collector — swap for your actual OTel
      // collector / Honeycomb / etc. endpoint via env var in prod.
      url: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318/v1/traces",
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Auto-instrumenting fs floods traces with noise (every file
        // read Next.js does internally) without adding useful signal.
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  sdk.start();

  process.on("SIGTERM", () => {
    sdk.shutdown().finally(() => process.exit(0));
  });
}

export const tracer = trace.getTracer("job-tracker");

// Helpers for the inject/extract handoff described above.
export function injectTraceContext(): Record<string, string> {
  const carrier: Record<string, string> = {};
  propagation.inject(context.active(), carrier);
  return carrier;
}

export function extractTraceContext(carrier: Record<string, string> | undefined) {
  if (!carrier) return context.active();
  return propagation.extract(context.active(), carrier);
}
