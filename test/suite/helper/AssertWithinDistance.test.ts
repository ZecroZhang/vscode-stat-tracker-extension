import { AssertionError } from "assert"
import { AssertWithinDistance } from "./AssertWithinDistance"

suite("AssertWithinDistance Test Suite", () => {
  test("Within distance", () => {
    AssertWithinDistance(9.8001, 9.8, 0.1)
  })

  test("Exactly on distance", () => {
    AssertWithinDistance(9.5, 9.5, 0)
  })

  test("Not within distance", () => {
    try {
      AssertWithinDistance(9.499, 9.511) // 0.01 default
    } catch (err) {
      if (err instanceof AssertionError && err.message.includes("is not within distance")) {
        return 
      }

      throw new Error(`Wrong error message from AssertWithinDistance when actual's not within distance.`)
    }

    throw new Error(`No error message from AssertWithinDistance when actual's not within distance.`)
  })

  test("NaN actual", () => {
    try {
      AssertWithinDistance("hello world", 9.511, 0.01)
    } catch (err) {
      if (err instanceof AssertionError && err.message.includes("is NaN")) {
        return 
      }

      throw new Error(`Wrong error message from AssertWithinDistance with NaN input.`)
    }

    throw new Error(`No error message from AssertWithinDistance with NaN input.`)
  })
})