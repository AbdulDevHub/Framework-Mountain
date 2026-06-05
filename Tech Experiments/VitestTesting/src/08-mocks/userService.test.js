// ─────────────────────────────────────────────────────────────────────────────
// 08-mocks/userService.test.js
//
// CONCEPT: Mocking with vi.fn() and vi.mock()
//
// A "mock" is a fake replacement for a dependency that:
//   - Never runs the real implementation
//   - Records every call made to it (arguments, times called, etc.)
//   - Returns values you control
//
// WHY MOCK?
//   - You don't want tests hitting a real database or API
//   - You want to test your code's logic in isolation
//   - You want to simulate error conditions that are hard to reproduce
//
// KEY APIs:
//   vi.mock('./path')         — Replace an entire module with auto-mocked fakes
//   vi.fn()                   — Create a single mock function
//   mockFn.mockResolvedValue  — Make it return a resolved Promise
//   mockFn.mockRejectedValue  — Make it return a rejected Promise
//   mockFn.mockReturnValue    — Make it return a synchronous value
//   expect(fn).toHaveBeenCalled()
//   expect(fn).toHaveBeenCalledTimes(n)
//   expect(fn).toHaveBeenCalledWith(args)
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUser, createUser, removeUser } from './userService.js';

// ─── vi.mock() ────────────────────────────────────────────────────────────────
// This call replaces the ENTIRE db.js module with auto-mocked versions.
// Every exported function in db.js becomes a vi.fn() that returns undefined.
// We then use .mockResolvedValue() etc. to control what they return per test.
//
// IMPORTANT: vi.mock() calls are hoisted to the top of the file by Vitest —
// they run before any imports. This is why the path is relative to THIS file.
// ─────────────────────────────────────────────────────────────────────────────
vi.mock('./db.js');

// Now import the mocked functions so we can control them in tests
import { findUserById, saveUser, deleteUser } from './db.js';

describe('userService', () => {

  // Reset all mocks between tests so they don't leak state
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getUser()
  // ─────────────────────────────────────────────────────────────────────────
  describe('getUser()', () => {

    // ── Controlling the return value ────────────────────────────────────────
    // mockResolvedValue makes the mock return a resolved Promise.
    // This simulates a real database finding the record.
    it('returns the user when found in the database', async () => {
      const fakeUser = { id: 1, name: 'Alice', email: 'alice@example.com' };

      // Tell the mock what to return for this test
      findUserById.mockResolvedValue(fakeUser);

      const result = await getUser(1);

      expect(result).toEqual(fakeUser);
    });

    // ── Verifying the mock was called ───────────────────────────────────────
    // We can assert HOW our code called the dependency.
    it('calls findUserById with the correct id', async () => {
      findUserById.mockResolvedValue({ id: 42, name: 'Test' });

      await getUser(42);

      // Was findUserById called at all?
      expect(findUserById).toHaveBeenCalled();

      // Was it called exactly once?
      expect(findUserById).toHaveBeenCalledTimes(1);

      // Was it called with the right argument?
      expect(findUserById).toHaveBeenCalledWith(42);
    });

    // ── Simulating a "not found" result ─────────────────────────────────────
    // When the DB returns null, the service should throw an error.
    it('throws an error when the user is not found', async () => {
      // Simulate the DB returning nothing
      findUserById.mockResolvedValue(null);

      await expect(getUser(999)).rejects.toThrow('User 999 not found');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // createUser()
  // ─────────────────────────────────────────────────────────────────────────
  describe('createUser()', () => {

    it('calls saveUser with the user data and returns the saved user', async () => {
      const input = { name: 'Bob', email: 'bob@example.com' };
      const savedUser = { id: 2, ...input };

      saveUser.mockResolvedValue(savedUser);

      const result = await createUser(input);

      // Check the returned value
      expect(result).toEqual(savedUser);

      // Check that saveUser was called with our input
      expect(saveUser).toHaveBeenCalledWith(input);
    });

    // ── Testing validation logic — no DB call needed ─────────────────────────
    // The mock ensures we test the service's own logic, not the DB's.
    it('throws an error when name is missing', async () => {
      await expect(createUser({ name: '', email: 'test@test.com' }))
        .rejects.toThrow('Name is required');

      // saveUser should NOT have been called — validation failed first
      expect(saveUser).not.toHaveBeenCalled();
    });

    it('throws an error when email is invalid', async () => {
      await expect(createUser({ name: 'Alice', email: 'not-an-email' }))
        .rejects.toThrow('Valid email is required');

      expect(saveUser).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // removeUser()
  // ─────────────────────────────────────────────────────────────────────────
  describe('removeUser()', () => {

    it('returns true when the user was successfully deleted', async () => {
      deleteUser.mockResolvedValue(true);

      const result = await removeUser(1);

      expect(result).toBe(true);
      expect(deleteUser).toHaveBeenCalledWith(1);
    });

    it('returns false when the user was not found', async () => {
      deleteUser.mockResolvedValue(false);

      const result = await removeUser(999);

      expect(result).toBe(false);
    });

    // ── Simulating a database error ──────────────────────────────────────────
    // mockRejectedValue simulates the DB throwing an exception.
    it('propagates an error if the database operation fails', async () => {
      deleteUser.mockRejectedValue(new Error('DB connection lost'));

      await expect(removeUser(1)).rejects.toThrow('DB connection lost');
    });
  });
});
