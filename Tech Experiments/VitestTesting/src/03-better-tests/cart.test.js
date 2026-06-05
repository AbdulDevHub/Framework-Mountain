// ─────────────────────────────────────────────────────────────────────────────
// 03-better-tests/cart.test.js
//
// CONCEPT: Writing tests that are clear, readable, and maintainable.
//
// A test is code too — it needs to be readable. When a test fails at 2am,
// the name and structure of the test should tell you EXACTLY what broke
// and why it matters.
//
// KEY PRINCIPLES DEMONSTRATED HERE:
//  1. Intention-revealing test names  — describe the BEHAVIOUR, not the code
//  2. Nested describe blocks         — mirror the structure of the feature
//  3. One assertion per concept      — keep tests focused
//  4. Avoid redundancy               — don't repeat setup logic; isolate state
//  5. Arrange / Act / Assert (AAA)   — a clear structure inside each test
//
// WHY THIS MATTERS:
//   Good tests are documentation. A new developer should be able to read this
//   file and understand exactly how the cart is supposed to behave.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { createCart } from './cart.js';

// ─── TOP-LEVEL GROUP ──────────────────────────────────────────────────────────
// Group all cart tests under a single describe block.
// ─────────────────────────────────────────────────────────────────────────────
describe('Shopping Cart', () => {

  // ─── SHARED SETUP ──────────────────────────────────────────────────────────
  // Create a fresh cart before each test so tests don't share state.
  // This prevents one test from accidentally affecting another.
  // (See 10-setup-teardown for a deep dive on hooks.)
  // ─────────────────────────────────────────────────────────────────────────
  let cart;
  beforeEach(() => {
    cart = createCart();
  });

  // ─── INITIAL STATE ─────────────────────────────────────────────────────────
  // Test what a cart looks like before anything happens.
  // Good tests include the "zero state" as a foundation.
  // ─────────────────────────────────────────────────────────────────────────
  describe('initial state', () => {
    it('starts with no items', () => {
      // ARRANGE: done in beforeEach
      // ACT: nothing — we're testing the initial state
      // ASSERT: items list should be empty
      expect(cart.items).toHaveLength(0);
    });

    it('starts with a total of 0', () => {
      expect(cart.getTotal()).toBe(0);
    });
  });

  // ─── ADDING ITEMS ──────────────────────────────────────────────────────────
  describe('addItem()', () => {

    // Good test name: describes WHAT the cart should DO, not what code runs
    it('adds an item to the cart', () => {
      // ARRANGE
      const item = { name: 'Apple', price: 1.50, quantity: 2 };

      // ACT
      cart.addItem(item);

      // ASSERT
      expect(cart.items).toHaveLength(1);
    });

    it('stores the item with the correct properties', () => {
      cart.addItem({ name: 'Apple', price: 1.50, quantity: 2 });

      // toEqual checks deep equality — right for objects
      expect(cart.items[0]).toEqual({ name: 'Apple', price: 1.50, quantity: 2 });
    });

    it('increases the quantity when the same item is added again', () => {
      cart.addItem({ name: 'Apple', price: 1.50, quantity: 2 });
      cart.addItem({ name: 'Apple', price: 1.50, quantity: 3 });

      // Should still be 1 item, but with quantity 5
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5);
    });

    it('keeps both items when two different items are added', () => {
      cart.addItem({ name: 'Apple', price: 1.50, quantity: 1 });
      cart.addItem({ name: 'Banana', price: 0.75, quantity: 3 });

      expect(cart.items).toHaveLength(2);
    });
  });

  // ─── REMOVING ITEMS ────────────────────────────────────────────────────────
  describe('removeItem()', () => {

    it('removes an item from the cart by name', () => {
      cart.addItem({ name: 'Apple', price: 1.50, quantity: 2 });
      cart.removeItem('Apple');

      expect(cart.items).toHaveLength(0);
    });

    it('does nothing if the item does not exist in the cart', () => {
      cart.addItem({ name: 'Apple', price: 1.50, quantity: 2 });
      cart.removeItem('Banana'); // 'Banana' was never added

      // Cart should be unchanged
      expect(cart.items).toHaveLength(1);
    });

    it('removes only the specified item, leaving others intact', () => {
      cart.addItem({ name: 'Apple', price: 1.50, quantity: 1 });
      cart.addItem({ name: 'Banana', price: 0.75, quantity: 3 });

      cart.removeItem('Apple');

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].name).toBe('Banana');
    });
  });

  // ─── CALCULATING TOTAL ─────────────────────────────────────────────────────
  describe('getTotal()', () => {

    it('returns 0 for an empty cart', () => {
      expect(cart.getTotal()).toBe(0);
    });

    it('calculates the total for a single item', () => {
      // $2.00 × 3 = $6.00
      cart.addItem({ name: 'Apple', price: 2.00, quantity: 3 });
      expect(cart.getTotal()).toBe(6.00);
    });

    it('calculates the total across multiple items', () => {
      // $2.00 × 2 = $4.00
      cart.addItem({ name: 'Apple', price: 2.00, quantity: 2 });
      // $1.50 × 4 = $6.00
      cart.addItem({ name: 'Banana', price: 1.50, quantity: 4 });
      // Total: $10.00

      expect(cart.getTotal()).toBe(10.00);
    });

    it('updates the total after removing an item', () => {
      cart.addItem({ name: 'Apple', price: 2.00, quantity: 2 });  // +$4
      cart.addItem({ name: 'Banana', price: 1.50, quantity: 4 }); // +$6 → total $10
      cart.removeItem('Banana');                                    // -$6 → total $4

      expect(cart.getTotal()).toBe(4.00);
    });
  });
});
