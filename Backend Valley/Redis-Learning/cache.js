const Redis = require("ioredis");
const redis = new Redis();

// Simulate a slow database query (takes 2 seconds)
async function slowDbQuery(userId) {
  console.log("  [DB] Running expensive query...");
  await new Promise((res) => setTimeout(res, 2000));
  return { id: userId, name: "Alice", role: "admin", score: 9001 };
}

// Get user — with Redis cache
async function getUser(userId) {
  const cacheKey = `user:${userId}`;

  // 1. Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("  [CACHE] Cache HIT — returning cached data");
    return JSON.parse(cached); // Redis stores strings, so parse it back
  }

  // 2. Cache miss — go to DB
  console.log("  [CACHE] Cache MISS — querying DB");
  const user = await slowDbQuery(userId);

  // 3. Store in Redis with a 30-second TTL
  await redis.set(cacheKey, JSON.stringify(user), "EX", 30);
  console.log("  [CACHE] Stored in cache for 30s");

  return user;
}

async function main() {
  console.log("\n--- Request 1 (cold cache) ---");
  console.time("request1");
  const user1 = await getUser(42);
  console.timeEnd("request1");
  console.log("Result:", user1);

  console.log("\n--- Request 2 (warm cache) ---");
  console.time("request2");
  const user2 = await getUser(42);
  console.timeEnd("request2");
  console.log("Result:", user2);

  // Cache invalidation — when user data changes, delete the cache
  console.log("\n--- User updated — invalidating cache ---");
  await redis.del("user:42");
  console.log("Cache cleared for user:42");

  console.log("\n--- Request 3 (cache invalidated) ---");
  console.time("request3");
  const user3 = await getUser(42);
  console.timeEnd("request3");

  redis.quit();
}

main();