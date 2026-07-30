// This file MUST be imported before anything else in the app (see index.ts).
// That's what lets trace.getTracer() elsewhere in the app find this
// configuration -- it reads from a global registry that provider.register() sets up.

import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api"
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)

import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node"
// import { SimpleSpanProcessor, ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions"

const provider = new NodeTracerProvider({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "checkout-service",
  }),
  // Example of using a simple span processor that logs spans to the console instead of exporting them to OTLP for Jaeger.
  // Uncomment the following lines to use the console exporter instead of the OTLP exporter.
  //   spanProcessors: [
  //     new SimpleSpanProcessor(new ConsoleSpanExporter()),
  //   ],
  spanProcessors: [
    new BatchSpanProcessor(
      new OTLPTraceExporter({ url: "http://localhost:4318/v1/traces" }),
    ),
  ],
})

provider.register()

console.log("[tracing] OpenTelemetry tracer provider registered")
