// ─────────────────────────────────────────────────────────────────────────────
// 05-async/fetchUser.test.js
//
// CONCEPT: Testing asynchronous code with Vitest.
//
// Async code (Promises, async/await) needs special handling in tests.
// If you forget to await a Promise, the test finishes before the assertion
// runs — and it will pass even if the code is broken!
//
// Vitest supports three styles for testing async code:
//   1. async/await    — most modern and readable (recommended)
//   2. returning a Promise — classic style, still works perfectly
//   3. resolves/rejects matchers — declarative, all-in-one
//
// This file demonstrates all three.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { fetchUser, fetchAllUsers } from './fetchUser.js';

describe('fetchUser()', () => {

  // ─── STYLE 1: async / await ──────────────────────────────────────────────
  // Mark the test callback as `async` and `await` the function under test.
  // This is the most readable and recommended style.
  // ─────────────────────────────────────────────────────────────────────────
  describe('async/await style', () => {

    it('resolves with the correct user object when given a valid id', async () => {
      // Await the promise directly. If it rejects, Vitest will catch the error
      // and fail the test automatically.
      const user = await fetchUser(1);

      expect(user).toEqual({
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        role: 'admin',
      });
    });

    it('resolves with a different user when given id 2', async () => {
      const user = await fetchUser(2);
      expect(user.name).toBe('Bob');
      expect(user.role).toBe('user');
    });

    // Testing that an async function REJECTS (throws an error):
    // Wrap the awaited call in a try/catch, OR use expect().rejects (see below).
    it('throws an error when the user id does not exist', async () => {
      // rejectsWith approach using try/catch
      await expect(fetchUser(999)).rejects.toThrow('User with id 999 not found');
    });
  });

  // ─── STYLE 2: returning a Promise ────────────────────────────────────────
  // Return the promise from the test function. Vitest will wait for it.
  // If you forget the `return`, the test ends immediately and passes vacuously.
  // This style is more common in older codebases.
  // ─────────────────────────────────────────────────────────────────────────
  describe('Promise-return style', () => {

    it('resolves with user data (promise return style)', () => {
      // Notice: no `async` keyword, just returning the chain
      return fetchUser(3).then((user) => {
        expect(user.name).toBe('Carol');
      });
    });

    it('rejects with an error for missing user (promise return style)', () => {
      // When testing rejection with .then/.catch, return the whole chain
      return fetchUser(999).catch((error) => {
        expect(error.message).toContain('not found');
      });
    });
  });

  // ─── STYLE 3: .resolves / .rejects matchers ──────────────────────────────
  // Vitest provides special matchers that unwrap promises for you.
  // You MUST await these matchers — they return a Promise too.
  // This is a clean, declarative style that reads like natural language.
  // ─────────────────────────────────────────────────────────────────────────
  describe('.resolves / .rejects matchers style', () => {

    it('resolves with the correct user', async () => {
      // expect(promise).resolves.matcher(value)
      await expect(fetchUser(1)).resolves.toMatchObject({ name: 'Alice' });
    });

    it('rejects when the user is not found', async () => {
      // expect(promise).rejects.matcher(value)
      await expect(fetchUser(42)).rejects.toThrow('not found');
    });

    it('resolves with a property we can check', async () => {
      await expect(fetchUser(2)).resolves.toHaveProperty('email', 'bob@example.com');
    });
  });
});

// ─── fetchAllUsers() ──────────────────────────────────────────────────────────
describe('fetchAllUsers()', () => {

  it('resolves with an array of all users', async () => {
    const users = await fetchAllUsers();

    // We have 3 users in the mock database
    expect(users).toHaveLength(3);
  });

  it('resolves with an array (not null or undefined)', async () => {
    const users = await fetchAllUsers();
    expect(Array.isArray(users)).toBe(true);
  });

  it('each user has the expected shape', async () => {
    const users = await fetchAllUsers();

    // Check every user has the required fields
    for (const user of users) {
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
    }
  });
});
