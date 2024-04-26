import assert from "assert"
import { Edits } from "../../../src/structs/Edits"
import { NetAddRemove } from "../../../src/structs/NetAddRemove"
import { edits } from "./TestExamples"
import { AssertDeepStrictProperties } from "../helper/AssertMatchingProperties"

suite("Edits Class Test Suite", () => {
  const defaultInstance = new Edits({
    lines: new NetAddRemove(),
    characters: new NetAddRemove(),
    charactersWB: new NetAddRemove()
  })

  test("Test constructor with non default properties", () => {
    const editsObj = edits[3]

    const expected = {
      lines: new NetAddRemove(editsObj.lines),
      characters: new NetAddRemove(editsObj.characters),
      charactersWB: new NetAddRemove(editsObj.charactersWB)
    }
    const actual = new Edits(editsObj)

    AssertDeepStrictProperties(actual, expected, "Edits")
  })

  test("Test default properties on undefined", () => {
    assert.deepStrictEqual(new Edits(), defaultInstance)
  })

  test("Test default properties on empty object", () => {
    assert.deepStrictEqual(new Edits({}), defaultInstance)
  })

  test("Test default properties on object missing property", () => {
    assert.deepStrictEqual(new Edits({
      characters: new NetAddRemove()
    }), defaultInstance)
  })

  test("Combining", () => {
    const edits = new Edits({
      lines: {
        added: 1320,
        removed: 401
      },
      characters: {
        added: 291031,
        removed: 1100
      }
    })

    const toAdd = new Edits({
      lines: {
        added: 0,
        removed: 400
      },
      characters: {
        added: 32,
        removed: 5012
      },
      charactersWB: {
        added: 124727,
        removed: 46
      }
    })

    const expected = new Edits({
      lines: {
        added: 1320,
        removed: 801
      },
      characters: {
        added: 291063,
        removed: 6112
      },
      charactersWB: {
        added: 124727,
        removed: 46
      }
    })

    edits.combine(toAdd)

    assert.deepStrictEqual(edits, expected)
  })

  test("Clearing", () => {
    const blankInstance = new Edits({
      lines: {
        added: 0,
        removed: 0,
        net: 0
      },
      characters: {
        added: 0,
        removed: 0,
        net: 0
      },
      charactersWB: {
        added: 0,
        removed: 0,
        net: 0
      }
    })


    const edits = new Edits({
      lines: {
        added: 5,
        removed: 1,
        net: 4
      },
      characters: {
        added: 1,
        removed: 4,
        net: -3
      },
      charactersWB: {
        added: 32,
        removed: 31,
        net: 1
      }
    })

    assert.notDeepStrictEqual(edits, blankInstance)

    edits.clear()

    assert.deepStrictEqual(edits, blankInstance)
  })
})