import { ProjectStats } from "./ProjectStats"
import { StatCounterSearch } from "./StatCounterSearch"
import { DeepPartial } from "./structs"
import { maxProjectNameLength } from "../../shared/constants"

/**
 * For individual project workspaces 
 */
export class ProjectStatsInfo {
  name: string
  /**
   * path will act as the id for the project.
   */
  path: string

  /**
   * This is for the "Stat Counter" section of the webview.
   * Saves the file types and stuff so the user doesn't have to type it each time.
   */
  search: StatCounterSearch

  constructor (project?: DeepPartial<ProjectStatsInfo>) {
    this.path = project?.path ?? "/unknown"
    this.name = project?.name ?? ProjectStats.FolderFromPath(this.path)

    if (this.name.length > maxProjectNameLength) {
      this.name = this.name.substring(0, maxProjectNameLength)
    }
    
    this.search = new StatCounterSearch(project?.search)
  }
}