const Redis = require("ioredis");

// Connect to Redis (defaults to localhost:6379)
const redis = new Redis();

async function main() {
  // SET — store a key/value
  await redis.set("name", "Alice");
  console.log("SET name = Alice");

  // GET — retrieve it
  const name = await redis.get("name");
  console.log("GET name:", name); // "Alice"

  // SET with TTL (time-to-live) — expires in 10 seconds
  await redis.set("session:abc123", "user_42", "EX", 10);
  console.log("SET session with 10s TTL");

  // Check how long until it expires
  const ttl = await redis.ttl("session:abc123");
  console.log("TTL remaining:", ttl, "seconds");

  // GET it before expiry
  const session = await redis.get("session:abc123");
  console.log("GET session:", session);

  // DEL — manually remove a key
  await redis.del("name");
  const deleted = await redis.get("name");
  console.log("After DEL, name is:", deleted); // null

  redis.quit();
}

main();