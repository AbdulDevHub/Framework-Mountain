# OpenTelemetry — Observability Basics

Notes from instrumenting a small Hono service with OpenTelemetry (OTel) and
viewing the resulting trace in Jaeger. Kept here for future reference.

## What OpenTelemetry actually is

OTel is **not** a dashboard or a storage system. It's the standard + SDK for
*generating and shipping* telemetry data (traces, metrics, logs) out of an
app. It doesn't store or visualize anything itself.

```
your app (OTel SDK)  --exporter-->  backend (Jaeger, CloudWatch, Datadog...)
```

The backend is swappable — instrument your code once, point the exporter
wherever you want. That's the whole value proposition: vendor neutrality.

## Core concepts

- **Trace** — the full story of one request as it moves through a system
  (e.g. "checkout request").
- **Span** — one unit of work inside a trace (e.g. "call the DB"). Has a
  start time, duration, attributes, a status, and can have child spans.
- **Metric** — an aggregated number over time (request count, latency
  histogram). Not tied to any one request, unlike a trace.
- **Context propagation** — the mechanism that lets a trace span multiple
  processes. Every span carries a `trace_id` (shared across the whole
  request) and a `parent_span_id` (which span caused it). Across an HTTP
  call, this gets carried in the `traceparent` header (W3C Trace Context
  spec). We didn't cross a real process boundary in this demo — `dbQuery`
  and `redisGet` are just functions in the same process — but the same
  mechanism (an "active span" tracked per async context) is what
  automatically parented them under `API handler` without us manually
  wiring up any IDs.

### The building blocks in `tracing.ts`

- **TracerProvider** — the factory/registry for tracers in a process.
  Configure it once, register it globally; every `trace.getTracer(...)`
  call elsewhere in the app reads from this config.
- **Resource** — metadata describing *what* produced the telemetry (e.g.
  `service.name: checkout-service`), attached to every span so you can
  tell services apart once many of them feed the same backend.
- **SpanProcessor** — decides *when* finished spans get handed to the
  exporter.
  - `SimpleSpanProcessor` exports each span the instant it ends. Fine for
    `ConsoleSpanExporter` (printing is free), wasteful for network
    exporters.
  - `BatchSpanProcessor` queues spans and flushes periodically. What you'd
    use with any real backend (Jaeger, CloudWatch, etc).
- **Exporter** — converts spans to a wire format and ships them somewhere.
  We used two: `ConsoleSpanExporter` (prints JSON) then
  `OTLPTraceExporter` (POSTs to Jaeger's OTLP endpoint).

## Project structure

```
otel-hono-demo/
├── package.json
├── tsconfig.json
└── src/
    ├── tracing.ts   # registers the OTel SDK — must be imported first
    └── index.ts     # Hono app with manual spans: API handler → DB query, Redis get
```

## Running it

```bash
npm install
npm run dev
```

In another terminal:

```bash
curl http://localhost:3000/checkout/123
```

### Sending traces to Jaeger

1. Run Jaeger locally via Docker:

   ```bash
   docker run -d --name jaeger -p 16686:16686 -p 4317:4317 -p 4318:4318 jaegertracing/jaeger:2.20.0
   ```

2. `tracing.ts` uses `OTLPTraceExporter({ url: "http://localhost:4318/v1/traces" })`
   with `BatchSpanProcessor` (spans flush every few seconds, not instantly).
3. Curl the endpoint, wait a few seconds, open `http://localhost:16686`,
   pick `checkout-service` from the Service dropdown, click "Find Traces."

**Known snag:** `jaegertracing/jaeger:2.0.0` (the very first v2 release)
would accept the TCP connection on port 4318 but then reset it on every
request — both from `curl` and from the OTel exporter (`socket hang up` /
`ECONNRESET`). Upgrading the image tag to `2.20.0` fixed it immediately.
Lesson: with a young major-version rewrite, try a newer patch tag before
assuming your own config is wrong.

### Reading the Jaeger UI

- **Depth** — how many levels deep the deepest span is below the root
  (our trace has depth 2: API handler → DB query/Redis get).
- **Total Spans** — count of spans in the trace.
- Attributes like `db.system: postgresql` aren't just labels we made up —
  they're OTel's *semantic conventions*, standard attribute names. Using
  them is why Jaeger auto-renders those little `postgresql` / `redis`
  pills and icons for free.

## How this fits with things already in use

### Pino (logging)

Pino and OTel solve different problems and don't depend on each other.

- **Pino** writes structured JSON log lines to stdout. It knows nothing
  about traces or spans.
- **OTel** generates trace/span data, a separate pipeline entirely.
- They can be **correlated**: grab the current `trace_id`/`span_id` from
  the active OTel span and add them as fields on a pino log line. Then in
  a log viewer you can filter "every log for trace_id X" and cross-reference
  against the matching trace in Jaeger. Neither needs the other to work —
  this is a nice-to-have layered on top once both exist independently.

### Jaeger vs. CloudWatch

**Does CloudWatch need OpenTelemetry? No.** CloudWatch Logs just ingests
text/JSON lines (e.g. pino output tailed from stdout). That pipeline needs
no OTel involvement at all.

Notes below are from a parallel conversation with Gemini, kept as-is since
the explanation held up well:

> # Jaeger vs. CloudWatch: Quick Notes
>
> They are **not** the same. Jaeger is not a simplified version of
> CloudWatch; they do completely different jobs.
>
> ### 1. What "Single User Request" Means
>
> Jaeger supports millions of users and API calls at the same time.
>
> When a user clicks a button on a website, that creates a **single
> request**. That request might trigger 10 different internal API calls
> (e.g., check database, process payment, send email).
>
> - **Jaeger** links those 10 internal steps together into one visual
>   timeline. It shows you exactly which step slowed down that specific
>   click.
> - **CloudWatch** just lists every single error and log line
>   chronologically. It does not automatically link them together by
>   user action.
>
> ### 2. The Real Difference (The Highway Analogy)
>
> - **CloudWatch** is like a security camera watching a whole highway. It
>   tells you how many total cars passed by and if the road is broken.
> - **Jaeger** is like a GPS tracker inside one specific car. It shows you
>   the exact turn-by-turn route that one car took.

One addition worth keeping in mind: CloudWatch and Jaeger aren't
necessarily competitors either. OTel can export traces *to* CloudWatch
(X-Ray/CloudWatch supports OTLP too) — so "Jaeger vs. CloudWatch" is really
"which backend do you point the same OTel data at," not two incompatible
systems.

Not done in this project, but natural next steps:

- **Auto-instrumentation** — packages like
  `@opentelemetry/instrumentation-http` wrap `fetch`/`http` automatically,
  so you get spans without manually calling `startActiveSpan` everywhere.
- **Metrics** — everything above was traces only. The `MeterProvider` side
  of OTel (counters, histograms) is a separate, related setup.
- **Error spans** — throw inside a span, catch it, call
  `span.recordException(err)` and
  `span.setStatus({ code: SpanStatusCode.ERROR })`, see how it renders red
  in Jaeger.
- **Real service boundaries** — everything here ran in one process. The
  more realistic case is trace context propagating across an actual HTTP
  call between two separate services, which is where the `traceparent`
  header actually gets used over the wire.
