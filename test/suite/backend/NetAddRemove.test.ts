import assert from "assert"
import { NetAddRemove } from "../../../src/structs/NetAddRemove"
import { AssertDeepStrictProperties } from "../helper/AssertMatchingProperties"

suite("NetAddRemove Class Test Suite", () => {
  const defaultInstance = new NetAddRemove({
    added: 0,
    removed: 0,
    net: 0
  })

  const exampleNAR = new NetAddRemove({
    added: 10, 
    removed: 2,
    net: 8
  })

  test("Test constructor with non default properties", () => {
    const netAddRemove = new NetAddRemove({
      added: 4,
      removed: 5
    })

    AssertDeepStrictProperties(netAddRemove, {
      added: 4,
      removed: 5,
      net: -1
    }, "NetAddRemove")
  })

  test("Test default properties on undefined", () => {
    assert.deepStrictEqual(new NetAddRemove(), defaultInstance)
  })

  test("Test default properties on empty object", () => {
    assert.deepStrictEqual(new NetAddRemove({}), defaultInstance)
  })

  test("Test default properties on object missing property", () => {
    assert.deepStrictEqual(new NetAddRemove({
      removed: 0
    }), defaultInstance)
  })

  // The other properties are kinda undefined behavior and exist for easier times loading older JSON.
  test("Test constructor missing net property", () => {
    assert.deepStrictEqual(new NetAddRemove({
      added: 5,
      removed: 6
    }), new NetAddRemove({
      added: 5,
      removed: 6,
      net: -1
    }))
  })

  test("Combining class instance", () => {
    const netAddRemove = new NetAddRemove(exampleNAR)

    const toAdd = new NetAddRemove({
      added: 4,
      removed: 1,
      net: 3
    })

    const expected = new NetAddRemove({
      added: 14,
      removed: 3,
      net: 11
    })
    
    assert.notDeepStrictEqual(netAddRemove, expected)

    netAddRemove.combine(toAdd)

    assert.deepStrictEqual(netAddRemove, expected)
  })

  test("Combining object with missing properties", () => {
    const netAddRemove = new NetAddRemove(exampleNAR)

    const toAdd = {
      added: 4,
      net: 4
    }

    const expected = new NetAddRemove({
      added: 14,
      removed: 2,
      net: 12
    })
    
    assert.notDeepStrictEqual(netAddRemove, expected)

    netAddRemove.combine(toAdd)

    assert.deepStrictEqual(netAddRemove, expected)
  })

  test("Removing class instance", () => {
    const netAddRemove = new NetAddRemove(exampleNAR)

    const toRemove = new NetAddRemove({
      added: 4,
      removed: 1,
      net: 3
    })

    const expected = new NetAddRemove({
      added: 6,
      removed: 1,
      net: 5
    })
    
    assert.notDeepStrictEqual(netAddRemove, expected)

    netAddRemove.remove(toRemove)

    assert.deepStrictEqual(netAddRemove, expected)
  })

  test("Removing with object missing properties", () => {
    const netAddRemove = new NetAddRemove(exampleNAR)

    const toRemove = {
      added: 4,
      net: 4
    }

    const expected = new NetAddRemove({
      added: 6,
      removed: 2,
      net: 4
    })
    
    assert.notDeepStrictEqual(netAddRemove, expected)

    netAddRemove.remove(toRemove)

    assert.deepStrictEqual(netAddRemove, expected)
  })

  test("Clear", () => {
    const netAddRemove = new NetAddRemove(exampleNAR)

    const empty = new NetAddRemove({
      added: 0,
      removed: 0,
      net: 0
    })

    netAddRemove.clear()
    
    assert.deepStrictEqual(netAddRemove, empty)
  })

})