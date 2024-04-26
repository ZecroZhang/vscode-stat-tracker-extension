import assert from "assert"
import { TypingStats } from "../../../src/structs/TypingStats"
import { AssertDeepStrictProperties } from "../helper/AssertMatchingProperties"
import { AssertWithinDistance } from "../helper/AssertWithinDistance"

suite("TypingStats Basic Class Test Suite", () => {
  const defaultInstance = new TypingStats({
    samples: [],
    samplesReady: false,
    totalChar: -1,
    totalTime: -1
  })

  test("Test constructor with unready samples", () => {
    const samples = [ 100, 150, 60, 10, 500, 32 ]

    const expected = {
      samples,
      samplesReady: false,
      totalChar: -1,
      totalTime: -1
    }
    const actual = new TypingStats(expected)

    AssertDeepStrictProperties(actual, expected, "TypingStats")
  })

  test("Test constructor with ready samples", () => {
    const samples: number[] = []

    const expected = {
      samples,
      samplesReady: true,
      totalChar: 55,
      totalTime: 5635
    }
    const actual = new TypingStats(expected)

    AssertDeepStrictProperties(actual, expected, "TypingStats")
  })

  test("Test default properties on undefined", () => {
    const actual = new TypingStats()

    assert.deepStrictEqual(actual, defaultInstance)
  })

  test("Test default properties on empty object", () => {
    const actual = new TypingStats({})

    assert.deepStrictEqual(actual, defaultInstance)
  })

  test("Test default properties on object missing property", () => {
    const actual = new TypingStats({
      samples: []
    })

    assert.deepStrictEqual(actual, defaultInstance)
  })

  test("Combining both ready", () => {
    const typingStats = new TypingStats({
      totalChar: 348,
      totalTime: 29829
    })

    const toAdd = new TypingStats({
      totalChar: 44,
      totalTime: 5280
    })

    const expected = new TypingStats({
      totalChar: 392,
      totalTime: 35109
    })

    typingStats.combine(toAdd)

    assert.deepStrictEqual(typingStats, expected)
  })

  const readyStats = {
    totalChar: 501,
    totalTime: 100200
  }

  const unreadyStats = {
    samples: [ 50, 67, 18, 99, 340, 32, 100, 13, 4560 ],
    totalChar: -1,
    totalTime: -1
  }

  const combined = {
    samples: [],
    totalChar: 509,
    totalTime: 100919 // only the 4560 gets rejected. 
  }

  test("Combining(ready) with unready", () => {
    const ready = new TypingStats(readyStats)
    const unready = new TypingStats(unreadyStats)

    ready.combine(unready)

    const expected = new TypingStats(combined)

    assert.deepStrictEqual(ready, expected)
  })

  test("Combining(unready) with ready", () => {
    const ready = new TypingStats(readyStats)
    const unready = new TypingStats(unreadyStats)

    unready.combine(ready)

    const expected = new TypingStats(combined)

    assert.deepStrictEqual(unready, expected)
  })

  test("Combining none ready, and remains unready", () => {
    const samples1 = [ 101, 321, 542, 331 ]
    const samples2 = [ 421, 332, 871 ]

    const unready1 = new TypingStats({
      samples: samples1,
    })

    const unready2 = new TypingStats({
      samples: samples2
    })

    unready1.combine(unready2)

    const expected = new TypingStats({
      samples: [ ...samples1, ...samples2 ]
    })

    assert.deepStrictEqual(unready1, expected)
  })

  test("Combining none ready, gets ready", () => {
    // Generates 88 samples: from [112, 199]
    const samples1 = Array.from({ length: 88 }, (_, i) => i + 112)
    // 13 samples to get just over 100.
    const samples2 = [
      1001, 5661, 201, 321, 104,
      566, 2415, 2414, 3201, 401,
      14051, 451, 267
    ]

    // The median of the two is 161. so anything 2415 and larger is going to get rejected.
    // This is 5661, 2415, 3201 and 14051
    
    // sum of all is 44738
    // so w/o outliers is 19410, 97 numbers
    
    const actual = new TypingStats({
      samples: samples1
    })

    const toAdd = new TypingStats({
      samples: samples2
    })
    
    actual.combine(toAdd)

    const expected = new TypingStats({
      totalChar: 97,
      totalTime: 19410
    })

    assert.deepStrictEqual(actual, expected)
  })
})

suite("TypingStats.typedCharacter Test Suite", () => {
  test("Not ready, stays unready", () => {
    const actual = new TypingStats({
      samples: [ 1, 2 ]
    })

    actual.typedCharacter(6)

    assert.deepStrictEqual(actual, new TypingStats({
      samples: [ 1, 2, 6 ]
    }))
  })

  test("Not ready, gets ready", () => {
    // 100 unready samples. [201, 300] sum = 25050
    const unreadySamples = Array.from({ length: 100 }, (_, i) => i + 201)

    const actual = new TypingStats({
      samples: unreadySamples
    })

    actual.typedCharacter(401)

    const expected = new TypingStats({
      totalChar: 101,
      totalTime: 25451
    })

    assert.deepStrictEqual(actual, expected)
  })

  test("Ready, accepted", () => {
    const actual = new TypingStats({
      totalChar: 67,
      totalTime: 29102
    })

    actual.typedCharacter(567)

    assert.deepStrictEqual(actual, new TypingStats({
      totalChar: 68,
      totalTime: 29669
    }))
  })

  test("Ready, outlier rejected", () => {
    const typingData = {
      totalChar: 231,
      totalTime: 66297
    }

    const actual = new TypingStats(typingData)

    // Exactly on the 15x reject threshold.
    actual.typedCharacter(4305)

    const expected = new TypingStats(typingData)
    
    assert.deepStrictEqual(actual, expected)
  })
})

suite("TypingStats Speed Calc Test Suite", () => {
  test("Unready sample(cps)", () => {
    assert.strictEqual(new TypingStats().cps(), "unknown")
  })

  test("Ready sample(cps)", () => {
    const actual = new TypingStats({
      totalChar: 55,
      totalTime: 6105
    }).cps()

    const expected = 9.009
    const epsilon = 0.01
    const difference = Math.abs((actual as number) - expected)

    assert.strictEqual(difference && difference < epsilon, true)
  })

  test("Unready sample(wpm)", () => {
    assert.strictEqual(new TypingStats().wpm(), "unknown")
  })

  test("Ready sample(wpm)", () => {
    const actual = new TypingStats({
      totalChar: 55,
      totalTime: 6105
    }).wpm()

    AssertWithinDistance(actual, 108.108, 0.01)
  })
})

suite("TypingStats.CalculateMedian Test Suite", () => {
  test("Single item array", () => {
    const actual = TypingStats.CalculateMedian([1])
    
    assert.strictEqual(actual, 1)
  })

  test("Large even array", () => {
    const actual = TypingStats.CalculateMedian([4, 5, 1, 0])
    
    assert.strictEqual(actual, 2.5)
  })

  test("Large odd array", () => {
    const actual = TypingStats.CalculateMedian([9, 1, 3, 7, 8])
    
    assert.strictEqual(actual, 7)
  })
})