import { CodingLanguageCollection } from "./CodingLanguageCollection"
import { Edits } from "./Edits"
import { TimeAllocation } from "./TimeAllocation"
import { DeepPartial } from "./structs"

/**
 * For keeping track of a project(folder) over time.
 */
export class ProjectStats {
  /**
   * Path on the disk. Absolute path recommended. Defaults to "/unknown"
   */
  path: string
  time: TimeAllocation
  edits: Edits
  languages: CodingLanguageCollection

  constructor (project?: DeepPartial<ProjectStats>) {
    this.path = project?.path || "/unknown"

    // @ts-ignore For backwards compatibility with v0.1.4
    let timePartial = project?.time || project?.timeAllocation
    this.time = new TimeAllocation(timePartial)

    this.edits = new Edits(project?.edits)

    this.languages = new CodingLanguageCollection(project?.languages)
  }

  /**
   * Combine two projects. Missing properties are ignored. Name of original is not replaced.
   * @param project other project. 
   * @param replacePath If the path of this one should be replaced with the path of the other project. 
   */
  combine (project: ProjectStats, replacePath: boolean) {
    if (replacePath) {
      this.path = project.path
    }

    this.time.combine(project.time)
    this.edits.combine(project.edits)
    
    // Combine languages
    CodingLanguageCollection.combine(this.languages, project.languages)
  }

  /**
   * Gives the name of the folder based on the path to it. 
   * @param path Path to the folder. This can be absolute path or relative path. The folder can only end in at most one `/` or `\`. Ex: `/path/to/folder` or `c:\path\to\folder\`
   * @returns name of folder. 
   */
  static FolderFromPath (path: string): string {
    // If the forward slash exists then we're on a linux filesystem since they're not allowed on windows. Linux allows \ to be apart of file names.
    const delim = path.indexOf("/") == -1 ? "\\" : "/"

    // Remove the trailing / from folder names.
    if (path.endsWith(delim)) {
      path = path.substring(0, path.length - 1)
    }

    return path.substring(path.lastIndexOf(delim) + 1)
  }
}
