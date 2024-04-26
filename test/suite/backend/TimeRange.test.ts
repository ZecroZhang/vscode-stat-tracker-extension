import assert from "assert"
import { Edits } from "../../../src/structs/Edits"
import { TimeRange } from "../../../src/structs/TimeRange"
import { TimeAllocation } from "../../../src/structs/TimeAllocation"
import { CodingLanguageCollection } from "../../../src/structs/CodingLanguageCollection"
import { TypingStats } from "../../../src/structs/TypingStats"
import { edits, languages, projects, testTimeRange1, testTimeRange2 } from "./TestExamples"
import { CodingLanguage } from "../../../src/structs/CodingLanguage"
import { ProjectStats } from "../../../src/structs/ProjectStats"
import { AssertDeepStrictProperties } from "../helper/AssertMatchingProperties"

suite("TimeRange Class Test Suite", () => {
  // The `resets` property is not going to be tested since it's based on the current date.

  const defaultInstance = new TimeRange({
    resets: 0,
    codeTime: new TimeAllocation(),
    edits: new Edits(),
    languages: new CodingLanguageCollection(),
    typing: new TypingStats(),
    projects: []
  })

  test("Test constructor with non default properties", () => {
    const timeRange = testTimeRange1

    const actual = new TimeRange(timeRange)

    const expected = {
      resets: timeRange.resets,
      codeTime: new TimeAllocation(timeRange.codeTime),
      edits: new Edits(timeRange.edits),
      languages: new CodingLanguageCollection(timeRange.languages),
      typing: new TypingStats(timeRange.typing),
      projects: timeRange.projects.map(item => new ProjectStats(item))
    }

    AssertDeepStrictProperties(actual, expected, "TimeRange")
  })

  test("Test default properties on undefined", () => {
    const actual = new TimeRange()
    actual.resets = 0

    assert.deepStrictEqual(actual, defaultInstance)
  })

  test("Test default properties on empty object", () => {
    const actual = new TimeRange({})
    actual.resets = 0

    assert.deepStrictEqual(actual, defaultInstance)
  })

  test("Test default properties on object missing property", () => {
    const actual = new TimeRange({
      projects: []
    })
    actual.resets = 0

    assert.deepStrictEqual(actual, defaultInstance)
  })

  test("Combining", () => {
    const timeRange = new TimeRange(testTimeRange1)
    const toAdd = new TimeRange(testTimeRange2)

    const combinedLanguage = new CodingLanguage(languages[0])
    combinedLanguage.combine(languages[1])

    const combinedEdits = new Edits(edits[0])
    combinedEdits.combine(new Edits(edits[1]))

    const combinedTimeRange = new TimeRange({
      resets: 1703623720270, // should be that of the first.
      codeTime: {
        totalTime: 70435,
        activeTime: 55441,
      },
      edits: combinedEdits,
      languages: {
        "javascript": combinedLanguage,
        "typescript": languages[1],
        "rust": languages[0]
      },
      typing: new TypingStats(),
      projects
    })

    // combine
    timeRange.combine(toAdd)

    assert.deepStrictEqual(timeRange, combinedTimeRange)
  })

  test("Resetting", () => {
    const timeRange = new TimeRange(testTimeRange1)
    const nextResetTime = 0

    assert.notDeepStrictEqual(timeRange, defaultInstance)

    timeRange.reset(nextResetTime)

    assert.deepStrictEqual(timeRange, defaultInstance)
  })
})