import assert, { AssertionError } from "assert"

/**
 * Asserts that actual is within and including distance epsilon of expected.
 * @param actual value output from the fn. If this is not a number, then an error is thrown.
 * @param expected expected value for the fn to output.
 * @param epsilon largest distance actual can be from expected and still pass.
 */
export function AssertWithinDistance (actual: unknown, expected: number, epsilon: number = 0.01) {
  if (isNaN(actual as number)) {
    throw new AssertionError({
      message: `${actual} is NaN`
    })
  }

  const distance = Math.abs((actual as number) - expected)

  assert.strictEqual(distance <= epsilon, true, `${actual} is not within distance ${epsilon} of ${expected}`)
}