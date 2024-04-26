import { CodingLanguageCollection } from "./CodingLanguageCollection"
import { Edits } from "./Edits"
import { ProjectStats } from "./ProjectStats"
import { ProjectStatsInfo } from "./ProjectStatsInfo"
import { TimeAllocation } from "./TimeAllocation"
import { TypingStats } from "./TypingStats"
import { DeepPartial } from "./structs"

/**
 * Partial for TimeRange that gets stored.
 */
export interface TimeRangeInterface {
  resets?: number
  codeTime?: DeepPartial<TimeAllocation>
  edits?: DeepPartial<Edits>
  languages?: DeepPartial<CodingLanguageCollection>
  typing?: Partial<TypingStats>
  projects?: DeepPartial<ProjectStats>[]

  // used exclusively for custom time ranges.
  startTime?: number 
}

/**
 * Stats for a certain interval of time.
 */
export class TimeRange {
  /**
   * When this TimeRange should reset.
   */
  resets: number
  codeTime: TimeAllocation
  edits: Edits
  languages: CodingLanguageCollection
  typing: TypingStats
  projects: ProjectStats[]

  constructor(constructionInput?: TimeRangeInterface, time: number = 86400000) {
    this.resets = constructionInput?.resets ?? Date.now() + time
    this.codeTime = new TimeAllocation(constructionInput?.codeTime)
    this.edits = new Edits(constructionInput?.edits)

    this.languages = new CodingLanguageCollection(constructionInput?.languages)

    this.typing = new TypingStats(constructionInput?.typing)

    this.projects = []
    // Add all the projects 
    if (constructionInput?.projects) {
      for (let project of constructionInput.projects) {
        this.projects.push(new ProjectStats(project))
      }
    }
  }
  
  /**
   * Adds another object instance to this one. Missing properties are ignored.
   * @param timeRangeObject other instance.
   */
  combine (timeRangeObject: TimeRangeInterface) {
    // Resets will be ignored since the main is probably more important. More emphasis that this is the correct object or the code will break.
    
    this.codeTime.combine(new TimeAllocation(timeRangeObject?.codeTime))
    this.edits.combine(new Edits(timeRangeObject?.edits))

    // combine the languages. 
    if (timeRangeObject.languages) {
      CodingLanguageCollection.combine(this.languages, timeRangeObject.languages)
    }

    // typing stats 
    this.typing.combine(new TypingStats(timeRangeObject?.typing))

    // combine the projects. 
    if (timeRangeObject?.projects) {
      for (let project of timeRangeObject.projects) {
        // find the project
        let preExistingProject = this.projects.find(p => p.path == project.path)

        if (preExistingProject) {
          preExistingProject.combine(new ProjectStats(project), false)
        } else {
          this.projects.push(new ProjectStats(project))
        }
      }
    }
  }

  /**
   * Checks that all the project stat infos exist. This should be called every time the all time is loaded to ensure backwards compatibility when loading json without the project stats thing. 
   */
  projectStatsInfoCheck (projectStatsInfo: Map<string, ProjectStatsInfo>) {
    for (let project of this.projects) {
      if (projectStatsInfo.has(project.path)) {
        continue
      }
      let projectInfo = new ProjectStatsInfo({
        path: project.path
      })
      
      projectStatsInfo.set(project.path, projectInfo)
    }
  }

  /**
   * Resets this time range to a new one. 
   * @param nextReset Date timestamp of next reset
   */
  reset (nextReset: number) {
    this.resets = nextReset
    this.codeTime = new TimeAllocation()
    this.edits = new Edits()
    this.languages = new CodingLanguageCollection()
    this.typing = new TypingStats()
    this.projects = []
  }
}

export class CustomTimeRange extends TimeRange {
  startTime: number

  constructor (constructionInput?: TimeRangeInterface, startTime?: number) {
    super(constructionInput)
    this.startTime = startTime || Date.now()
  }
}