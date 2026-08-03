// Next.js convention: this file, at the project root, has its
// register() function called automatically on server startup — before
// any route handlers run. This is the documented place to initialize
// OpenTelemetry for a Next.js app (see nextjs.org/docs/app/building-your-application/optimizing/open-telemetry).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Validated first, on purpose — if .env is missing something,
    // fail here with a clear message rather than starting OTel
    // successfully and then failing confusingly later.
    await import("./lib/env");
    const { startOtel } = await import("./lib/otel");
    startOtel("job-tracker-api");
  }
}
