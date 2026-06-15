const Redis = require("ioredis");
const crypto = require("crypto"); // built-in Node module
const redis = new Redis();

// --- Session helpers ---

async function createSession(userData) {
  const sessionId = crypto.randomUUID(); // e.g. "a1b2c3d4-..."
  const key = `session:${sessionId}`;

  // Store the session as a JSON string, expires in 30 minutes
  await redis.set(key, JSON.stringify(userData), "EX", 1800);
  console.log(`  [SESSION] Created session for user ${userData.id}`);

  return sessionId; // this is what gets sent to the client (as a cookie)
}

async function getSession(sessionId) {
  const key = `session:${sessionId}`;
  const data = await redis.get(key);

  if (!data) {
    return null; // expired or never existed
  }

  // Sliding expiry — reset TTL on each active request
  await redis.expire(key, 1800);
  return JSON.parse(data);
}

async function destroySession(sessionId) {
  await redis.del(`session:${sessionId}`);
  console.log(`  [SESSION] Session ${sessionId} destroyed`);
}

// --- Simulate a login flow ---

async function main() {
  console.log("--- 1. User logs in ---");
  const sessionId = await createSession({
    id: 42,
    name: "Alice",
    role: "admin",
    loginTime: new Date().toISOString(),
  });
  console.log(`  Client receives sessionId: ${sessionId}\n`);

  console.log("--- 2. User makes an authenticated request ---");
  const session = await getSession(sessionId);
  if (session) {
    console.log(`  ✅ Valid session — welcome, ${session.name} (role: ${session.role})`);
    console.log(`  Session data:`, session);
  } else {
    console.log("  ❌ No session found");
  }

  console.log("\n--- 3. User logs out ---");
  await destroySession(sessionId);

  console.log("\n--- 4. Try to use the old sessionId ---");
  const dead = await getSession(sessionId);
  if (dead) {
    console.log("  ✅ Session still valid");
  } else {
    console.log("  ❌ Session not found — logout worked correctly");
  }

  redis.quit();
}

main();