import assert from "assert"
import { TimeAllocation } from "../../../src/structs/TimeAllocation"
import { AssertDeepStrictProperties } from "../helper/AssertMatchingProperties"

suite("TimeAllocation Class Test Suite", () => {
  const defaultInstance = new TimeAllocation({
    activeTime: 0,
    totalTime: 0
  })

  test("Test constructor with non default properties", () => {
    const timeAllocation = {
      activeTime: 40109,
      totalTime: 56001
    }

    const actual = new TimeAllocation(timeAllocation)

    AssertDeepStrictProperties(actual, timeAllocation, "TimeAllocation")
  })

  test("Test default properties on undefined", () => {
    assert.deepStrictEqual(new TimeAllocation(), defaultInstance)
  })

  test("Test default properties on empty object", () => {
    assert.deepStrictEqual(new TimeAllocation({}), defaultInstance)
  })

  test("Test default properties on object missing property", () => {
    assert.deepStrictEqual(new TimeAllocation({
      activeTime: 0
    }), defaultInstance)
  })

  test("Combining", () => {
    const timeAllocation = new TimeAllocation({
      totalTime: 61000,
      activeTime: 55000
    })

    const toAdd = new TimeAllocation({
      totalTime: 40000,
      activeTime: 25000
    })

    const expected = new TimeAllocation({
      totalTime: 101000,
      activeTime: 80000
    })

    timeAllocation.combine(toAdd)

    assert.deepStrictEqual(timeAllocation, expected)
  })
})