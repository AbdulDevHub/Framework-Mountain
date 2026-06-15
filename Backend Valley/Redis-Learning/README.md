# Redis Learning Project

A hands-on intro to Redis covering core patterns, caching, rate limiting, and session storage using `ioredis`.

---

## Setup

```bash
mkdir redis-learning && cd redis-learning
npm init -y
npm install ioredis
```

### Start Redis locally

```bash
# Mac
brew install redis && brew services start redis

# Ubuntu/WSL
sudo apt install redis-server && sudo service redis-server start

# Docker
docker run -d -p 6379:6379 redis
```

Redis runs on `localhost:6379` by default. Connect with:

```js
const Redis = require("ioredis");
const redis = new Redis(); // defaults to localhost:6379
```

---

## Files

| File | What it covers |
|---|---|
| `basics.js` | Core commands: SET, GET, EXPIRE, TTL, DEL |
| `cache.js` | Caching a simulated DB query with TTL + cache invalidation |
| `rate-limiter.js` | Rate limiting with INCR + EXPIRE |
| `sessions.js` | Session storage: create, read, destroy, sliding expiry |

---

## Phase 1 — Core Commands & Caching

### Core commands (`basics.js`)

```js
await redis.set("name", "Alice");                          // SET
await redis.get("name");                                   // GET → "Alice"
await redis.set("key", "value", "EX", 10);                // SET with 10s TTL
await redis.ttl("key");                                    // seconds remaining (-2 = gone)
await redis.expire("key", 60);                            // add/reset TTL on existing key
await redis.del("key");                                    // delete immediately
```

### Caching pattern (`cache.js`)

Store expensive results in Redis with a TTL. Return the cache on repeat requests. Delete the key when the underlying data changes.

```js
async function getUser(userId) {
  const cacheKey = `user:${userId}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);            // cache HIT

  const user = await slowDbQuery(userId);           // cache MISS → hit DB
  await redis.set(cacheKey, JSON.stringify(user), "EX", 30);
  return user;
}

// Cache invalidation — call when the user's data changes
await redis.del("user:42");
```

**Why JSON.stringify/parse?** Redis stores everything as strings. Objects must be serialized on the way in and parsed on the way out.

### Request flow

```
Request
  │
  ▼
Check Redis ──── HIT ──→ Return instantly ✅
  │
 MISS
  │
  ▼
Query DB (slow)
  │
  ▼
Store in Redis with TTL
  │
  ▼
Return result
```

---

## Phase 2 — Rate Limiting & Sessions

### Rate limiting (`rate-limiter.js`)

Uses `INCR` (atomic increment) + `EXPIRE` to count requests within a rolling time window.

```js
async function rateLimiter(userId, limitPerMinute = 5) {
  const key = `rate:${userId}`;
  const current = await redis.incr(key);  // atomically increment

  if (current === 1) {
    await redis.expire(key, 60);          // start the 60s window on first request
  }

  if (current > limitPerMinute) {
    const ttl = await redis.ttl(key);
    return { allowed: false, retryAfter: ttl };
  }

  return { allowed: true, remaining: limitPerMinute - current };
}
```

**Why `INCR` instead of read → increment → write?**
`INCR` is atomic — Redis executes it as a single operation. Two simultaneous requests can't both read the same value and both think they're under the limit. A regular DB read/write would have this race condition.

**Why set `EXPIRE` only when `current === 1`?**
If you reset the TTL on every request, the window keeps sliding and the counter never resets. Setting it only on the first request means the window is fixed: it started when the first request came in, and expires 60 seconds later regardless of activity.

This is exactly how MFA/OTP rate limiting works — e.g. "max 3 attempts per 5-minute window":

```js
key    = `mfa:attempts:${userId}`
INCR   → count this attempt
if count === 1 → EXPIRE key 300   // 5-minute window
if count > 3   → block the request
```

### Session storage (`sessions.js`)

Store session data in Redis. Give the client only a session ID (as a cookie). Look up the session on every request.

```js
// On login
async function createSession(userData) {
  const sessionId = crypto.randomUUID();
  await redis.set(`session:${sessionId}`, JSON.stringify(userData), "EX", 1800);
  return sessionId; // send this to the client as a cookie
}

// On each authenticated request
async function getSession(sessionId) {
  const data = await redis.get(`session:${sessionId}`);
  if (!data) return null; // expired or invalid

  await redis.expire(`session:${sessionId}`, 1800); // sliding expiry: reset TTL on activity
  return JSON.parse(data);
}

// On logout
async function destroySession(sessionId) {
  await redis.del(`session:${sessionId}`); // instant invalidation
}
```

### Why Redis for sessions, not a DB or JWT?

| | JWT | DB Session | Redis Session |
|---|---|---|---|
| **Speed** | Fast (no lookup) | Slow (DB query) | Fast (in-memory) |
| **Revocable** | ❌ No | ✅ Yes | ✅ Yes |
| **Scales** | ✅ Stateless | ❌ DB bottleneck | ✅ Fast + shared |
| **Expiry** | Manual check | Manual cleanup | Automatic TTL |

The key tradeoff with JWTs: once issued, you **cannot** invalidate them before they expire. If an account is compromised, you can't force a logout. With Redis sessions, `DEL` the key and the session is dead instantly — everywhere.

---

## Key Concepts

**TTL (Time To Live)** — how long a key lives before Redis automatically deletes it. Set with `EX` on `SET`, or with `EXPIRE` separately. Check remaining time with `TTL` (returns `-2` if key is gone, `-1` if no expiry set).

**Cache invalidation** — manually deleting a cached key with `DEL` when the source data changes, so the next request fetches fresh data instead of returning stale cache.

**Atomic operations** — commands like `INCR` execute as a single indivisible step. No other command can run between the read and write, which makes them safe for concurrency (counters, rate limits).

**Sliding expiry** — resetting a key's TTL on each access, so it only expires after a period of *inactivity* rather than a fixed time from creation.

**Key naming convention** — use `type:identifier` prefixes to namespace keys and avoid collisions:
```
user:42
session:a1b2c3d4-...
rate:user_42
mfa:attempts:user_42
```