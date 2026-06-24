// after-pretty.js — same as after.js, but with human-readable output for local dev
// In real projects you'd use an environment variable to switch between the two.
// e.g.  NODE_ENV=production -> raw JSON   (for CloudWatch/Datadog)
//        NODE_ENV=development -> pretty    (for your terminal)

import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const logger = pino({
  level: "info",
  // pino-pretty only loads in dev — it's slower and not meant for production
  transport: isDev
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
});

function getUser(userId) {
  logger.info({ userId }, "Fetching user");

  if (userId === 99) {
    logger.error({ userId }, "User not found");
    return null;
  }

  const user = { id: userId, name: "Alice", role: "admin" };
  logger.info({ user }, "User fetched successfully");
  return user;
}

function processOrder(userId, item) {
  logger.info({ userId, item }, "Processing order");

  const user = getUser(userId);

  if (!user) {
    logger.warn({ userId }, "Order attempted by non-existent user");
    return;
  }

  if (user.role !== "admin" && item === "premium") {
    logger.warn({ userId, role: user.role, item }, "Unauthorised premium access attempt");
    return;
  }

  logger.info({ userId, item, status: "success" }, "Order complete");
}

processOrder(1, "basic");
processOrder(2, "premium");
processOrder(99, "basic");
