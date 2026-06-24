# Pino-Demo

A reference project for replacing `console.log` with structured logging using [pino](https://getpino.io).

## Why structured logging?

`console.log` outputs plain text — readable to a human in a terminal, but useless to production tools like AWS CloudWatch or Datadog, which need to search and filter logs by field.

Pino outputs JSON instead:

```json
{"level":50,"time":1719177600000,"userId":99,"msg":"User not found"}
```

Every field is searchable. You can ask CloudWatch: *"Show all logs where `userId` is 99 and `level` is error."* You can't do that with a string.

## Project files

| File | Purpose |
|---|---|
| `before.js` | The old way — `console.log` throughout |
| `after.js` | The new way — pino with raw JSON output (for production) |
| `after-pretty.js` | Same as `after.js`, but with readable coloured output (for local dev) |

## Setup

```bash
npm install
```

## Running the examples

```bash
node before.js        # plain text — hard to search
node after.js         # raw JSON — production style
node after-pretty.js  # coloured, readable — local dev style
```

## The one pattern to remember

```js
// ❌ Old way
console.log("User logged in", userId)

// ✅ New way — context object first, message string second
logger.info({ userId }, "User logged in")
```

The object becomes searchable JSON fields. The string becomes the `msg` field.

## Log levels

Use these to express severity:

| Method | Level number | When to use |
|---|---|---|
| `logger.info(...)` | 30 | Normal expected events |
| `logger.warn(...)` | 40 | Unexpected but not fatal |
| `logger.error(...)` | 50 | Something broke, needs attention |

You can filter by level in production — e.g. only show `warn` and above to cut noise.

## Dev vs production

```js
const logger = pino({
  level: "info",
  transport: isDev
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,  // raw JSON in production
});
```

`pino-pretty` is only for local development. It's slower and not meant for production use.

## Dependencies

- [`pino`](https://www.npmjs.com/package/pino) — the logger
- [`pino-pretty`](https://www.npmjs.com/package/pino-pretty) — human-readable formatting for local dev only