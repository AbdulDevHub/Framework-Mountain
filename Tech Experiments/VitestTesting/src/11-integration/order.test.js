// ─────────────────────────────────────────────────────────────────────────────
// 11-integration/order.test.js
//
// CONCEPT: Integration Testing — testing multiple modules working together.
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  UNIT TEST vs INTEGRATION TEST                                          │
// │                                                                         │
// │  UNIT TEST:                                                             │
// │    - Tests ONE function or module in isolation                          │
// │    - All external dependencies are MOCKED                               │
// │    - Fast, deterministic, pinpoints exactly what broke                  │
// │    - Example: "does userService.createUser() validate the email?"       │
// │                                                                         │
// │  INTEGRATION TEST:                                                      │
// │    - Tests how MULTIPLE modules interact with each other                │
// │    - NO mocking — real implementations are used                         │
// │    - Catches bugs at the "seams" between modules                        │
// │    - Example: "does placeOrder() correctly reduce stock AND charge?"    │
// └─────────────────────────────────────────────────────────────────────────┘
//
// In this file, orderService, productService, and paymentService all run
// with their real implementations. We're testing the FLOW, not the units.
//
// Notice: there are NO vi.mock() calls here. That's intentional.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { placeOrder } from './orderService.js';
import { getProduct, resetStock } from './productService.js';
import { isSupportedMethod } from './paymentService.js';

describe('Order Integration Tests', () => {

  // Reset product stock before each test so tests don't affect each other
  beforeEach(() => {
    resetStock();
  });

  // ─── HAPPY PATH ─────────────────────────────────────────────────────────
  // The full flow: valid products, valid payment → successful order
  // ─────────────────────────────────────────────────────────────────────────
  describe('successful order placement', () => {

    it('places an order and returns a receipt with all required fields', () => {
      const result = placeOrder(
        [{ productId: 1, quantity: 2 }], // 2x Keyboard @ $79.99 = $159.98
        'credit_card'
      );

      // The receipt should contain all the key information
      expect(result).toMatchObject({
        items: expect.arrayContaining([
          expect.objectContaining({
            name: 'Keyboard',
            quantity: 2,
            unitPrice: 79.99,
            lineTotal: 159.98,
          }),
        ]),
        total: 159.98,
        payment: expect.objectContaining({
          status: 'success',
          method: 'credit_card',
          amount: 159.98,
        }),
      });
    });

    it('calculates the correct total for a multi-item order', () => {
      const result = placeOrder(
        [
          { productId: 1, quantity: 1 }, // Keyboard: $79.99
          { productId: 2, quantity: 2 }, // 2x Mouse:  $79.98
        ],
        'paypal'
      );

      // $79.99 + $79.98 = $159.97
      expect(result.total).toBeCloseTo(159.97, 2);
    });

    it('generates an orderId that follows the expected format', () => {
      const order = placeOrder([{ productId: 2, quantity: 1 }], 'credit_card');

      // Every order should have an ID that starts with 'ORD-'
      expect(order.orderId).toBeDefined();
      expect(order.orderId).toEqual(expect.stringContaining('ORD-'));
      expect(typeof order.orderId).toBe('string');
    });
  });

  // ─── STOCK MANAGEMENT (cross-module interaction) ─────────────────────────
  // This is where integration tests shine: we verify that orderService
  // correctly affects productService's state after an order.
  // ─────────────────────────────────────────────────────────────────────────
  describe('stock is reduced after a successful order', () => {

    it('reduces the stock of the ordered product', () => {
      const before = getProduct(1).stock; // Keyboard starts at 10

      placeOrder([{ productId: 1, quantity: 3 }], 'credit_card');

      const after = getProduct(1).stock;
      expect(after).toBe(before - 3); // Should now be 7
    });

    it('reduces stock for all items in a multi-item order', () => {
      placeOrder(
        [
          { productId: 1, quantity: 2 }, // Keyboard: 10 → 8
          { productId: 2, quantity: 1 }, // Mouse:     5 → 4
        ],
        'debit_card'
      );

      expect(getProduct(1).stock).toBe(8);
      expect(getProduct(2).stock).toBe(4);
    });
  });

  // ─── ERROR CASES ────────────────────────────────────────────────────────
  // Integration tests should also verify that failure states are handled
  // correctly across module boundaries.
  // ─────────────────────────────────────────────────────────────────────────
  describe('error handling across modules', () => {

    it('throws when the product does not exist', () => {
      expect(() =>
        placeOrder([{ productId: 9999, quantity: 1 }], 'credit_card')
      ).toThrow('does not exist');
    });

    it('throws when there is insufficient stock', () => {
      // Monitor only has 2 in stock
      expect(() =>
        placeOrder([{ productId: 3, quantity: 5 }], 'credit_card')
      ).toThrow('Insufficient stock');
    });

    it('throws when the payment method is unsupported', () => {
      expect(() =>
        placeOrder([{ productId: 1, quantity: 1 }], 'bitcoin')
      ).toThrow('Unsupported payment method');
    });

    it('does NOT reduce stock if payment fails', () => {
      const stockBefore = getProduct(1).stock;

      // 'bitcoin' is an unsupported payment method — this will throw
      try {
        placeOrder([{ productId: 1, quantity: 1 }], 'bitcoin');
      } catch {
        // Expected to throw
      }

      // Stock should be unchanged — payment failure happened before stock reduction
      expect(getProduct(1).stock).toBe(stockBefore);
    });

    it('throws when the order has no items', () => {
      expect(() => placeOrder([], 'credit_card')).toThrow('at least one item');
    });
  });

  // ─── PAYMENT SERVICE INTEGRATION ─────────────────────────────────────────
  describe('payment method validation', () => {

    it('accepts all supported payment methods', () => {
      const supportedMethods = ['credit_card', 'debit_card', 'paypal'];

      for (const method of supportedMethods) {
        // Verify paymentService accepts this method
        expect(isSupportedMethod(method)).toBe(true);

        // Verify a full order can be placed with this method
        resetStock();
        expect(() =>
          placeOrder([{ productId: 2, quantity: 1 }], method)
        ).not.toThrow();
      }
    });
  });
});
