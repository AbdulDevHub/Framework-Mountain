import { expect, test, describe } from "bun:test";
import { add, isEven } from "./math";

describe("add", () => {
  test("adds two positive numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  test("handles negative numbers", () => {
    expect(add(-1, 1)).toBe(0);
  });
});

describe("isEven", () => {
  test("returns true for even numbers", () => {
    expect(isEven(4)).toBe(true);
  });

  test("returns false for odd numbers", () => {
    expect(isEven(7)).toBe(false);
  });
});