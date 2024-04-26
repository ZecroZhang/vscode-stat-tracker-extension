import assert from "assert"
import { CodingLanguage } from "../../../src/structs/CodingLanguage"
import { TimeAllocation } from "../../../src/structs/TimeAllocation"
import { Edits } from "../../../src/structs/Edits"
import { NetAddRemove } from "../../../src/structs/NetAddRemove"
import { languages } from "./TestExamples"
import { AssertDeepStrictProperties } from "../helper/AssertMatchingProperties"

suite("CodingLanguage Class Test Suite", () => {
  const defaultInstance = new CodingLanguage({
    time: new TimeAllocation(),
    edits: new Edits()
  })

  test("Test constructor with non default properties", () => {
    const expected = {
      time: new TimeAllocation(languages[0].time),
      edits: new Edits(languages[0].edits)
    }

    AssertDeepStrictProperties(new CodingLanguage(languages[0]), expected, "CodingLanguage")
  })

  test("Test default properties on undefined", () => {
    assert.deepStrictEqual(new CodingLanguage(), defaultInstance)
  })

  test("Test default properties on empty object", () => {
    assert.deepStrictEqual(new CodingLanguage({}), defaultInstance)
  })

  test("Test default properties on object missing property", () => {
    assert.deepStrictEqual(new CodingLanguage({
      time: new TimeAllocation()
    }), defaultInstance)
  })

  test("Combining", () => {
    const language = new CodingLanguage({
      edits: {
        characters: new NetAddRemove({
          added: 6
        }),
        lines: new NetAddRemove({
          added: 32,
          removed: 12
        }),
        charactersWB: new NetAddRemove({
          removed: 1
        })
      }, 
      time: {
        activeTime: 16000,
        totalTime: 20000
      }
    })

    const toAdd = new CodingLanguage({
      edits: {
        characters: new NetAddRemove({
          added: 436,
          remove: 0
        }),
        lines: new NetAddRemove({
          added: 102,
          removed: 31
        }),
        charactersWB: new NetAddRemove({
          added: 44,
          removed: 5
        })
      }, 
      time: {
        activeTime: 44000,
        totalTime: 380000
      }
    })

    const expected = new CodingLanguage({
      edits: {
        characters: new NetAddRemove({
          added: 442
        }),
        lines: new NetAddRemove({
          added: 134,
          removed: 43
        }),
        charactersWB: new NetAddRemove({
          added: 44,
          removed: 6
        })
      }, 
      time: {
        activeTime: 60000,
        totalTime: 400000
      }
    })

    language.combine(toAdd)

    assert.deepStrictEqual(language, expected)
  })
})