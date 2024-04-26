import assert from "assert"
import { MsToTime, Plural } from "../../../shared/functions"

suite("MsToTime Test Suite", () => {
  test("No time", () => {
    assert.strictEqual(MsToTime(0), "0 seconds")
  })

  test("1 second", () => {
    assert.strictEqual(MsToTime(1000), "1 second")
  })

  test("x sec y min (plural)", () => {
    assert.strictEqual(MsToTime(3*60e3 + 42e3), "3 minutes, and 42 seconds")
  })

  test("x min y hr (single/plural)", () => {
    assert.strictEqual(MsToTime((2*60 + 1)*60e3), "2 hours, and 1 minute")
  })

  test("x sec z hr (rounding)", () => {
    assert.strictEqual(MsToTime(5*3600e3 + 42500), "5 hours, and 43 seconds")
  })

  test("Time with precision 0", () => {
    assert.strictEqual(MsToTime(103499.831, 0), "1 minute, and 43 seconds")
  })

  test("Time with precision 1", () => {
    assert.strictEqual(MsToTime(Math.PI*1000, 1), "3.1 seconds")
  })

  test("Time with precision 2", () => {
    assert.strictEqual(MsToTime(536.61, 2), "0.54 seconds")
  })
})

suite("Plural Test Suite", () => {
  test("Single item", () => {
    assert.strictEqual(Plural("word", 1), "word")
  })

  test("Plural > 1", () => {
    assert.strictEqual(Plural("word", 2), "words")
  })

  test("Plural [0, 1)", () => {
    assert.strictEqual(Plural("item", 0.25), "items")
  })

  test("Plural < 0", () => {
    assert.strictEqual(Plural("thing", -4), "things")
  })

  test("Type 0 - ends in 's'", () => {
    assert.strictEqual(Plural("line", 2, 0), "lines")
  })

  test("Type 1 - ends in 'es'", () => {
    assert.strictEqual(Plural("tax", 2, 1), "taxes")
  })

  test("Type 2 - ends in 'es' with last letter doubled", () => {
    assert.strictEqual(Plural("bus", 2, 2), "busses")
  })
})