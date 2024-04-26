import assert from "assert"

interface Obj {
  [ key: string ]: any
}

/**
 * Asserts that two objects(or class and object) share the same properties(deep assertion). This ignores the fact that the classes may be different classes.
 * #properties of classes and class methods are ignored.
 * Useful for testing constructors.
 * @param actual what the class/object is.
 * @param expected what the class/object should be(properties).
 * @param className name of the class `actual`.
 */
export function AssertDeepStrictProperties (actual: Obj, expected: Obj, className: string) {
  // Make sure all the expected properties are on actual.
  for (const key of Object.keys(expected)) {
    assert.deepStrictEqual(actual[key], expected[key], `${className}.${key} doesn't match with expected.`)
  }

  const expectedKeys = new Set(Object.keys(expected))

  // Check for extra properties in `actual` that shouldn't be there.
  for (const key of Object.keys(actual)) {
    if (expectedKeys.has(key)) {
      continue
    }

    // Not shared keys.
    assert.deepStrictEqual(actual[key], expected[key], `${className} has extra property ${key}`)
  }
}