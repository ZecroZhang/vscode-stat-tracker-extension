import { AssertionError } from "assert"
import { AssertDeepStrictProperties } from "./AssertMatchingProperties"

suite("AssertDeepStrictProperties Test Suite", () => {
  test("Class and object same properties", () => {
    class Class {
      amount: number

      constructor () {
        this.amount = 1
      }
    }

    const expected = {
      amount: 1
    }

    AssertDeepStrictProperties(new Class(), expected, "Class")
  })

  test("Class and object same properties, but class has methods", () => {
    class Animal {
      size: number
      previousSizes: number[]

      constructor () {
        this.size = 50
        this.previousSizes = [ 4, 5, 6, 43 ]
      }

      makeNoise () {
        if (this.size > 40) {
          console.log("Animal noises")
        }
      }
    }

    const expected = {
      size: 50,
      previousSizes: [ 4, 5, 6, 43 ]
    }

    AssertDeepStrictProperties(new Animal(), expected, "Animal")
  })

  test("Class and object different properties", () => {
    class Rectangle {      
      constructor (public width: number, public height: number, public xy: [ number, number ]) {}
    }

    const different = new Rectangle(44, 50, [1, 2])

    const expected = {
      width: 44,
      height: 50,
      xy: [2, 1]
    }

    try {
      AssertDeepStrictProperties(different, expected, "Rectangle")
    } catch (err) {
      if (err instanceof AssertionError) {
        return
      }

      throw new Error(`AssertDeepStrictProperties gave incorrect error message when properties weren't matching.`)
    }

    throw new Error(`AssertDeepStrictProperties did not error on different objects.`)
  })

  test("Class missing property", () => {
    class AlmostEverything {
      hasEverything: boolean

      constructor () {
        this.hasEverything = false
      }
    }

    const expected = {
      hasEverything: false,
      missingProperty: []
    }

    try {
      AssertDeepStrictProperties(new AlmostEverything(), expected, "AlmostEverything")
    } catch (err) {
      if (err instanceof AssertionError && err.message.includes("doesn't match")) {
        return
      }

      throw new Error(`AssertDeepStrictProperties gives incorrect error when the class has missing properties.`)
    }

    throw new Error(`AssertDeepStrictProperties does not error when the class has missing properties.`)
  })

  test("Class extra properties", () => {
    class Snake {
      length: number
      legs: string[]

      constructor () {
        this.length = 40
        this.legs = [
          "frontLeg",
          "backLeg"
        ]
      }
    }

    const expected = {
      length: 40
    }

    try {
      AssertDeepStrictProperties(new Snake(), expected, "Snake")
    } catch (err) {
      if (err instanceof AssertionError && err.message.includes("extra property")) {
        return
      }

      throw new Error(`AssertDeepStrictProperties gives incorrect error when the class has extra properties.`)
    }

    throw new Error(`AssertDeepStrictProperties does not error when the class has extra properties.`)
  })

  test("Class with private properties", () => {
    class Student {
      name: string
      #grade: number

      constructor () {
        this.name = "Zecro"
        this.#grade = 49
      }
    }

    const expected = {
      name: "Zecro"
    }

    AssertDeepStrictProperties(new Student(), expected, "Student")
  })
})