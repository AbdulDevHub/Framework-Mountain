const Redis = require("ioredis");
const redis = new Redis();

async function rateLimiter(userId, limitPerMinute = 5) {
  const key = `rate:${userId}`;          // e.g. "rate:user_42"
  const current = await redis.incr(key); // atomically increment

  if (current === 1) {
    // First request in this window — set the TTL
    // (we only do this on first increment, so the window doesn't keep resetting)
    await redis.expire(key, 60);
    console.log(`  [RATE] New window started for ${userId}`);
  }

  const ttl = await redis.ttl(key);
  console.log(`  [RATE] Request #${current} for ${userId} | Window resets in ${ttl}s`);

  if (current > limitPerMinute) {
    return {
      allowed: false,
      message: `Rate limit exceeded. Try again in ${ttl} seconds.`,
      count: current,
    };
  }

  return { allowed: true, count: current, remaining: limitPerMinute - current };
}

async function main() {
  const userId = "user_42";
  console.log("--- Simulating 7 rapid requests (limit is 5/min) ---\n");

  // Clean slate
  await redis.del(`rate:${userId}`);

  for (let i = 1; i <= 7; i++) {
    const result = await rateLimiter(userId, 5);
    if (result.allowed) {
      console.log(`  ✅ Request ${i} ALLOWED (${result.remaining} remaining)\n`);
    } else {
      console.log(`  ❌ Request ${i} BLOCKED — ${result.message}\n`);
    }
  }

  redis.quit();
}

main();