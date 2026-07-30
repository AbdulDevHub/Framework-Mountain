// Importing tracing.ts first registers the OTel SDK before any spans are created.
import "./tracing.js"

import { trace } from "@opentelemetry/api"
import { Hono } from "hono"
import { serve } from "@hono/node-server"

const tracer = trace.getTracer("checkout-service")

// Fake DB call -- becomes a child span of whatever span is "active" when it's called.
async function dbQuery(orderId: string) {
  return tracer.startActiveSpan("DB query", async (span) => {
    span.setAttribute("db.system", "postgresql")
    span.setAttribute("db.statement", "select * from orders where id = $1")
    await new Promise((r) => setTimeout(r, 30)) // pretend latency
    span.setAttribute("order.id", orderId)
    span.end() // always end spans, or they never get exported
    return { orderId, total: 42.5 }
  })
}

// Fake Redis call -- created after dbQuery's span ends, so it's sequential
// in the waterfall, not overlapping.
async function redisGet(key: string) {
  return tracer.startActiveSpan("Redis get", async (span) => {
    span.setAttribute("db.system", "redis")
    span.setAttribute("db.statement", `GET ${key}`)
    await new Promise((r) => setTimeout(r, 10))
    span.end()
    return { cached: false }
  })
}

const app = new Hono()

app.get("/checkout/:orderId", async (c) => {
  const orderId = c.req.param("orderId")

  // Parent span for the whole request. Because dbQuery/redisGet call
  // tracer.startActiveSpan from inside this callback, OTel automatically
  // makes them children of "API handler" -- that's context propagation.
  return tracer.startActiveSpan("API handler", async (span) => {
    span.setAttribute("http.route", "/checkout/:orderId")

    const order = await dbQuery(orderId)
    const cache = await redisGet(`session:${orderId}`)

    span.end()
    return c.json({ order, cache })
  })
})

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Listening on http://localhost:${info.port}`)
  console.log(`Try: curl http://localhost:${info.port}/checkout/123`)
})
