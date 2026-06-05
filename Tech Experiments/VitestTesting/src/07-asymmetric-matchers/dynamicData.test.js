// ─────────────────────────────────────────────────────────────────────────────
// 07-asymmetric-matchers/dynamicData.test.js
//
// CONCEPT: Asymmetric Matchers — testing dynamic values you can't hardcode.
//
// Sometimes your functions return data you can't know in advance:
//   - Auto-generated IDs (random numbers, UUIDs)
//   - Timestamps (changes every millisecond)
//   - Partially-known objects (you care about some fields, not all)
//
// Trying to hardcode expected values for these will make your tests flaky.
// Asymmetric matchers let you assert the SHAPE and TYPE of the data
// without needing to know the exact value.
//
// KEY MATCHERS:
//   expect.any(Constructor)      — value is an instance of that type
//   expect.stringContaining(str) — string includes the given substring
//   expect.arrayContaining(arr)  — array includes at least these elements
//   expect.objectContaining(obj) — object has at least these key-value pairs
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { createUser, createOrder, paginatedResponse } from './dynamicData.js';

describe('Asymmetric Matchers', () => {

  // ─── expect.any() ────────────────────────────────────────────────────────
  // Checks that a value is an INSTANCE of the given constructor.
  // Perfect for IDs (Number), timestamps (String), etc.
  // ─────────────────────────────────────────────────────────────────────────
  describe('expect.any() — type checking without exact values', () => {

    it('createUser returns an object with an id that is a number', () => {
      const user = createUser('Alice', 'alice@example.com');

      // We don't know the exact id — it's random!
      // But we know it should be a number.
      expect(user.id).toEqual(expect.any(Number));
    });

    it('createUser returns an object with a createdAt that is a string', () => {
      const user = createUser('Alice', 'alice@example.com');

      // ISO timestamp strings are strings — we just check the type
      expect(user.createdAt).toEqual(expect.any(String));
    });
  });

  // ─── expect.stringContaining() ───────────────────────────────────────────
  // Checks that a string includes a given substring.
  // The full string might have extra content you don't care about.
  // ─────────────────────────────────────────────────────────────────────────
  describe('expect.stringContaining() — partial string matching', () => {

    it('order number starts with ORD-', () => {
      const order = createOrder(['Keyboard'], 79.99);

      // The order number is random (e.g. "ORD-48231")
      // We just verify it follows the expected prefix format
      expect(order.orderNumber).toEqual(expect.stringContaining('ORD-'));
    });

    it('user email contains the @ symbol', () => {
      const user = createUser('Bob', 'bob@example.com');
      expect(user.email).toEqual(expect.stringContaining('@'));
    });
  });

  // ─── expect.arrayContaining() ────────────────────────────────────────────
  // Checks that an array includes at least the listed elements.
  // The array may have MORE items — that's fine.
  // Order does NOT matter.
  // ─────────────────────────────────────────────────────────────────────────
  describe('expect.arrayContaining() — partial array matching', () => {

    it('order items contain all the items we passed in', () => {
      const order = createOrder(['Keyboard', 'Mouse', 'Monitor'], 469.97);

      // We check that all our items are present — the array might have others
      expect(order.items).toEqual(expect.arrayContaining(['Keyboard', 'Mouse']));
    });
  });

  // ─── expect.objectContaining() ───────────────────────────────────────────
  // Checks that an object contains at least the specified key-value pairs.
  // The object may have MORE properties — that's fine.
  // This is the most useful asymmetric matcher for API responses.
  // ─────────────────────────────────────────────────────────────────────────
  describe('expect.objectContaining() — partial object matching', () => {

    it('createUser returns an object with the known fields', () => {
      const user = createUser('Alice', 'alice@example.com');

      // We know name, email, and role — we don't know id or createdAt
      expect(user).toEqual(expect.objectContaining({
        name: 'Alice',
        email: 'alice@example.com',
        role: 'user',
      }));
    });

    it('createOrder returns an object with the known fields', () => {
      const order = createOrder(['Keyboard'], 79.99);

      expect(order).toEqual(expect.objectContaining({
        total: 79.99,
        currency: 'USD',
        status: 'pending',
      }));
    });
  });

  // ─── COMBINING MATCHERS ───────────────────────────────────────────────────
  // You can mix asymmetric matchers inside toEqual for complex structures.
  // ─────────────────────────────────────────────────────────────────────────
  describe('combining multiple asymmetric matchers', () => {

    it('createUser returns a fully valid user object shape', () => {
      const user = createUser('Carol', 'carol@example.com');

      // This single assertion checks the ENTIRE structure:
      // - id is some number (random)
      // - name, email, role are exact
      // - createdAt is some string (ISO timestamp)
      expect(user).toEqual({
        id: expect.any(Number),
        name: 'Carol',
        email: 'carol@example.com',
        createdAt: expect.any(String),
        role: 'user',
      });
    });

    it('paginatedResponse has the correct meta structure', () => {
      const response = paginatedResponse([{ id: 1 }, { id: 2 }], 1, 10);

      expect(response).toEqual({
        data: expect.arrayContaining([{ id: 1 }]),
        meta: expect.objectContaining({
          page: 1,
          total: 10,
          pageSize: 2,
          generatedAt: expect.any(String),
        }),
      });
    });
  });
});
