// after.js — the NEW way: structured logging with pino
// Exact same logic as before.js, but every log is now searchable JSON.

import pino from "pino";

// 1. Create ONE logger for your whole app.
//    The "level" controls the minimum severity to show.
//    Try changing it to "warn" — info logs disappear!
const logger = pino({
  level: "info",
});

function getUser(userId) {
  // 2. Pass context as the FIRST argument (an object), message as SECOND.
  //    Everything in that object becomes a searchable JSON field.
  logger.info({ userId }, "Fetching user");

  if (userId === 99) {
    // 3. logger.error() for things that are broken and need fixing.
    logger.error({ userId }, "User not found");
    return null;
  }

  const user = { id: userId, name: "Alice", role: "admin" };

  // 4. You can log rich objects — they serialize cleanly to JSON.
  logger.info({ user }, "User fetched successfully");
  return user;
}

function processOrder(userId, item) {
  logger.info({ userId, item }, "Processing order");

  const user = getUser(userId);

  if (!user) {
    // 5. logger.warn() for "unexpected but not fatal" situations.
    logger.warn({ userId }, "Order attempted by non-existent user");
    return;
  }

  if (user.role !== "admin" && item === "premium") {
    logger.warn({ userId, role: user.role, item }, "Unauthorised premium access attempt");
    return;
  }

  logger.info({ userId, item, status: "success" }, "Order complete");
}

// --- Run it ---
processOrder(1, "basic");
processOrder(2, "premium");
processOrder(99, "basic"); // this user doesn't exist
