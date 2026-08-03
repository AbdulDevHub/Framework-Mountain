import "./env"; // validated first, same reasoning as instrumentation.ts
import { startOtel } from "./otel";

// Why this is its own tiny file instead of just calling startOtel()
// directly at the top of reminderWorker.ts: OpenTelemetry's
// auto-instrumentation (getNodeAutoInstrumentations, in otel.ts) works
// by patching modules like `ioredis` and `http` when they're first
// require()'d. For that patching to actually take effect, sdk.start()
// has to run BEFORE those modules are imported anywhere else in the
// process. Node hoists all `import` statements to the top of a file
// before running any code, so "call startOtel() as the first line of
// reminderWorker.ts" would NOT actually run before the `import { Worker }
// from "bullmq"` line above it — imports always execute first,
// regardless of source order.
//
// The standard fix is exactly what's happening here: give the SDK
// bootstrap its own module, and import THAT module first. Its own
// imports (just @opentelemetry packages) don't touch ioredis/bullmq, so
// by the time control returns to reminderWorker.ts and ITS other
// imports run, sdk.start() has already patched the modules they're
// about to pull in.
startOtel("job-tracker-worker");
