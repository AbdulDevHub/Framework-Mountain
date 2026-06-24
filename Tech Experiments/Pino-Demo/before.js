// before.js — the OLD way: plain console.log
// This is what most beginners write. It works locally, but falls apart in production.

function getUser(userId) {
  console.log("Fetching user...", userId);

  // Simulate finding a user
  if (userId === 99) {
    console.error("User not found! ID:", userId);
    return null;
  }

  const user = { id: userId, name: "Alice", role: "admin" };
  console.log("Found user:", user);
  return user;
}

function processOrder(userId, item) {
  console.log("Processing order for user", userId, "item:", item);

  const user = getUser(userId);

  if (!user) {
    console.warn("Attempted order by non-existent user", userId);
    return;
  }

  if (user.role !== "admin" && item === "premium") {
    console.warn("Unauthorised premium access attempt");
    return;
  }

  console.log("Order complete!", { userId, item, status: "success" });
}

// --- Run it ---
processOrder(1, "basic");
processOrder(2, "premium");
processOrder(99, "basic"); // this user doesn't exist
