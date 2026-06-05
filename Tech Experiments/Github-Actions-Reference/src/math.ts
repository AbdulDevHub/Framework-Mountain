/**
 * src/math.ts
 *
 * A tiny math utility module. The actual logic here is intentionally simple —
 * the real purpose of this file is to give TypeScript something to type-check
 * and Vitest something to test, so our CI pipeline has real work to do.
 */

/**
 * Adds two numbers together.
 * @param a - First operand
 * @param b - Second operand
 * @returns The sum of a and b
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * Subtracts b from a.
 */
export function subtract(a: number, b: number): number {
  return a - b;
}

/**
 * Returns true if a number is even.
 * The % operator gives the remainder after division.
 * If the remainder when dividing by 2 is 0, the number is even.
 */
export function isEven(n: number): boolean {
  return n % 2 === 0;
}
