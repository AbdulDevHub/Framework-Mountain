// fetchUser.js
// Simulates async data fetching — like calling a real API — but using
// a local in-memory store instead. This keeps the example self-contained
// and runnable without any network access.

// ─── Simulated "database" of users ───────────────────────────────────────────
const USER_DB = {
  1: { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
  2: { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' },
  3: { id: 3, name: 'Carol', email: 'carol@example.com', role: 'user' },
};

/**
 * Simulates fetching a user by ID from a remote API.
 *
 * Returns a Promise that:
 *   - Resolves with the user object if the ID exists
 *   - Rejects with an Error if the ID is not found
 *
 * The artificial delay (50ms) simulates real-world network latency.
 *
 * @param {number} id - The user's ID
 * @returns {Promise<{ id: number, name: string, email: string, role: string }>}
 */
export function fetchUser(id) {
  return new Promise((resolve, reject) => {
    // Simulate a short network delay
    setTimeout(() => {
      const user = USER_DB[id];
      if (user) {
        resolve(user);
      } else {
        reject(new Error(`User with id ${id} not found`));
      }
    }, 50);
  });
}

/**
 * Simulates fetching all users.
 * Always resolves with an array.
 *
 * @returns {Promise<Array>}
 */
export function fetchAllUsers() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Object.values(USER_DB));
    }, 50);
  });
}
