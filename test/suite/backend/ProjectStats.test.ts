import assert from "assert"
import { CodingLanguageCollection } from "../../../src/structs/CodingLanguageCollection"
import { Edits } from "../../../src/structs/Edits"
import { ProjectStats } from "../../../src/structs/ProjectStats"
import { TimeAllocation } from "../../../src/structs/TimeAllocation"
import { projects } from "./TestExamples"
import { AssertDeepStrictProperties } from "../helper/AssertMatchingProperties"

suite("ProjectStats Class Test Suite", () => {
  const defaultInstance = new ProjectStats({
    path: "/unknown",
    time: new TimeAllocation(),
    edits: new Edits(),
    languages: new CodingLanguageCollection()
  })

  // Combination of project[0] and project[1] This assumes the combine on the inner classes work.
  const combined = new ProjectStats({
    time: new TimeAllocation(projects[0].time),
    edits: new Edits(projects[0].edits),
    languages: new CodingLanguageCollection(projects[0].languages)
  })
  combined.time.combine(new TimeAllocation(projects[1].time))
  combined.edits.combine(new Edits(projects[1].edits))
  CodingLanguageCollection.combine(combined.languages, projects[1].languages)

  test("Test constructor with non default properties", () => {
    const project = projects[0]

    const actual = new ProjectStats(project)

    const expected = {
      path: project.path,
      time: new TimeAllocation(project.time),
      edits: new Edits(project.edits),
      languages: new CodingLanguageCollection(project.languages)
    }

    AssertDeepStrictProperties(actual, expected, "ProjectStats")
  })

  test("Test default properties on undefined", () => {
    assert.deepStrictEqual(new ProjectStats(), defaultInstance)
  })

  test("Test default properties on empty object", () => {
    assert.deepStrictEqual(new ProjectStats({}), defaultInstance)
  })

  test("Test default properties on object missing property", () => {
    assert.deepStrictEqual(new ProjectStats({
      time: new TimeAllocation(),
      edits: new Edits()
    }), defaultInstance)
  })

  test("Test constructor for backwards compatibility with v0.1.4 and below", () => {
    const input = {
      path: "/path/to/project",
      timeAllocation: {
        activeTime: 1,
        totalTime: 2
      },
      edits: {},
      languages: {}
    }
    const expected = {
      path: "/path/to/project",
      time: new TimeAllocation({
        activeTime: 1,
        totalTime: 2
      }),
      edits: new Edits(),
      languages: new CodingLanguageCollection()
    }
    const actual = new ProjectStats(input)

    AssertDeepStrictProperties(actual, expected, "ProjectStats")
  })

  test("Combine replace path", () => {
    const project = new ProjectStats(projects[0])
    const toAdd = new ProjectStats(projects[1])

    const expected = new ProjectStats(combined)
    expected.path = "C:\\project\\on\\windows"
    
    project.combine(toAdd, true)

    assert.deepStrictEqual(project, expected)
  })

  test("Combine keep path", () => {
    const project = new ProjectStats(projects[0])
    const toAdd = new ProjectStats(projects[1])

    const expected = new ProjectStats(combined)
    expected.path = "/path/to/project/"
    
    project.combine(toAdd, false)

    assert.deepStrictEqual(project, expected)
  })
})

suite("ProjectStats.FolderFromPath Test Suite", () => {
  test("Windows path no ending delim", () => {
    const actual = ProjectStats.FolderFromPath("C:\\path\\to\\folder")
    assert.strictEqual(actual, "folder")
  })

  test("Linux path no ending delim", () => {
    const actual = ProjectStats.FolderFromPath("/testing/code")
    assert.strictEqual(actual, "code")
  })

  test("Linux path containing \\ and no ending delim", () => {
    const actual = ProjectStats.FolderFromPath("/testing/weird\\names")
    assert.strictEqual(actual, "weird\\names")
  })

  test("Windows path ending delim", () => {
    const actual = ProjectStats.FolderFromPath("C:\\path\\to\\folder\\")
    assert.strictEqual(actual, "folder")
  })

  test("Linux path ending delim", () => {
    const actual = ProjectStats.FolderFromPath("/mnt/drive/<*>\\[#%{}!:$]\\/")
    assert.strictEqual(actual, "<*>\\[#%{}!:$]\\")
  })

  test("No starting delim", () => {
    const actual = ProjectStats.FolderFromPath("folder")
    assert.strictEqual(actual, "folder")
  })

  test("Relative path", () => {
    const actual = ProjectStats.FolderFromPath("./relative/path")
    assert.strictEqual(actual, "path")
  })

  test("Relative path windows", () => {
    const actual = ProjectStats.FolderFromPath(".\\relative\\path")
    assert.strictEqual(actual, "path")
  })

  test("No beginning delim", () => {
    const actual = ProjectStats.FolderFromPath("folder/subfolder")
    assert.strictEqual(actual, "subfolder")
  })

  test("No beginning delim windows", () => {
    const actual = ProjectStats.FolderFromPath("folder\\subfolder")
    assert.strictEqual(actual, "subfolder")
  })
})