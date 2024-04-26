import { ExtensionContext } from "vscode"
import { ProjectStatsInfo } from "./ProjectStatsInfo"
import { CustomTimeRange, TimeRange, TimeRangeInterface } from "./TimeRange"
import { CodingLanguageCollection } from "./CodingLanguageCollection"
import { CodingLanguage } from "./CodingLanguage"
import { Edits } from "./Edits"
import { ProjectStats } from "./ProjectStats"
import { TimeRangeNames } from "./structs"
import { GetConfig } from "../helper/GetConfig"

export interface UsageTimeInterface {
  startTime?: number
  allTime?: TimeRangeInterface
  weeklyTime?: TimeRangeInterface
  todayTime?: TimeRangeInterface
  customTime?: TimeRangeInterface[]

  projectInfo?: ProjectStatsInfo[]
}


/**
 * Gets the time, in milliseconds, required to wait before saving again.
 * @returns minimum time to wait before saving, or 0 if not saving.
 */
function GetSaveTimer () {
  let time = GetConfig<number>("statTracking.autoSaveInterval") ?? 15000

  if (time < 0) {
    time = 0
  }

  return time * 1000
}

export class UsageTime {
  startTime: number
  allTime: TimeRange
  weeklyTime: TimeRange
  todayTime: TimeRange
  customTime: CustomTimeRange[]

  /**
   * Fast look up for project info when given the path to the project. 
   */
  projectInfo: Map<string, ProjectStatsInfo>
  
  // All properties below are not saved when converted to JSON. 

  /**
   * Reference for the other time ranges so they can be looped over. 
   */
  timeRangeRef: TimeRange[]
  lastSave: number
  context: ExtensionContext | null

  constructor (extensionContext: ExtensionContext | null, constructionInput?: UsageTimeInterface) {
    this.startTime = constructionInput?.startTime || Date.now()

    this.allTime = new TimeRange(constructionInput?.allTime)
    this.weeklyTime = new TimeRange(constructionInput?.weeklyTime, 604800000)
    this.todayTime = new TimeRange(constructionInput?.todayTime, 86400000)

    // For a future implementation.
    this.customTime = []

    // Load the project infos. 
    this.projectInfo = new Map()

    if (constructionInput?.projectInfo) {
      for (let projectInfo of constructionInput.projectInfo) {
        this.projectInfo.set(projectInfo.path, new ProjectStatsInfo(projectInfo))
      }
    }

    // This is just to make sure all the projects that exist have their associated ProjectStatInfo object(for loading older JSON). 
    this.allTime.projectStatsInfoCheck(this.projectInfo)

    // Will not include the ones in custom time. 
    this.timeRangeRef = [
      this.allTime,
      this.weeklyTime,
      this.todayTime
    ]

    this.lastSave = Date.now()
    this.context = extensionContext
  }

  combine (usageTimeObject: UsageTime) {
    if (usageTimeObject.startTime < this.startTime) {
      this.startTime = usageTimeObject.startTime
    }

    this.allTime.combine(usageTimeObject.allTime)
    this.todayTime.combine(usageTimeObject.todayTime)
    this.weeklyTime.combine(usageTimeObject.weeklyTime)
    for (let customTime of usageTimeObject.customTime) {
      this.customTime.push(customTime)
    }

    // Combine the global project stats - they don't need to be combined.
    for (let [ _, projectInfo ] of usageTimeObject.projectInfo) {
      if (this.projectInfo.has(projectInfo.path)) {
        continue
      }

      // Add it if it doesn't exist. I have no idea how to name these properties. 
      this.projectInfo.set(projectInfo.path, new ProjectStatsInfo(projectInfo))
    }

    // I don't think this is useful but consistency check? 
    this.allTime.projectStatsInfoCheck(this.projectInfo)
  }

  /**
   * Deletes all the language data for all time ranges and projects. 
   */
  deleteAllLanguageData () {
    // Clear the range of all the time range refs.
    for (let range of [ ...this.timeRangeRef, ...this.customTime ]) {
      range.languages = new CodingLanguageCollection()
      
      // Delete the language stats from all projects.
      for (let project of range.projects) {
        project.languages = new CodingLanguageCollection()
      }
    }
  }

  updateCodeTime (deltaTime: number, language: string, isActive: boolean, projectPath?: string) {
    // Add the code time to everyone. 
    for (let range of [ ...this.timeRangeRef, ...this.customTime ]) {
      // Add to the time range
      range.codeTime.totalTime += deltaTime
      if (isActive) range.codeTime.activeTime += deltaTime

      // Add to the languages. 
      this.updateLanguageCodeTime(range.languages, language, deltaTime, isActive)

      // Add to current project. 
      if (projectPath) {
        let currentProject = this.getCurrentProject(range, projectPath)

        currentProject.time.totalTime += deltaTime
        if (isActive) currentProject.time.activeTime += deltaTime
        // For the language in the project.
        this.updateLanguageCodeTime(currentProject.languages, language, deltaTime, isActive)
      }
    }
  }

  private updateLanguageCodeTime (languageCollection: CodingLanguageCollection, language: string, deltaTime: number, isActive: boolean) {
    if (!languageCollection[language]) languageCollection[language] = new CodingLanguage()

    languageCollection[language].time.totalTime += deltaTime
    if (isActive) languageCollection[language].time.activeTime += deltaTime
  }

  updateEdits (edits: Edits, language: string, projectPath?: string) {
    // Add it to every range
    for (let range of [ ...this.timeRangeRef, ...this.customTime ]) {
      range.edits.combine(edits)
      this.updateLanguageEdits(range.languages, language, edits)
      
      if (projectPath) {
        let currentProject = this.getCurrentProject(range, projectPath)
        currentProject.edits.combine(edits)
        this.updateLanguageEdits(currentProject.languages, language, edits)
      }
    }
  }

  private updateLanguageEdits (languageCollection: CodingLanguageCollection, language: string, edits: Edits) {
    if (!languageCollection[language]) languageCollection[language] = new CodingLanguage()

    languageCollection[language].edits.combine(edits)
  }

  /**
   * Adds to all the inner wpm stats
   * @param delta Time in ms since last character. 
   */
  addToWPM (delta: number) {
    for (let range of [ ...this.timeRangeRef, ...this.customTime ]) {
      range.typing.typedCharacter(delta)
    }
  }

  /**
   * Gets the current project we're working on for this time range, and creates one if it doesn't exist. 
   * @param timeRange 
   * @param projectPath Path of the project... or none.
   * @returns `ProjectStats` project stats or null if the project path is invalid. 
   */
  getCurrentProject(timeRange: TimeRange, projectPath: "" | undefined): null
  getCurrentProject(timeRange: TimeRange, projectPath: string): ProjectStats // Exclude<string, ""> doesn't work which is annoying.
  getCurrentProject (timeRange: TimeRange, projectPath: string | undefined): ProjectStats | null {
    if (!projectPath) {
      return null
    }

    // find the project
    let projectIndex = timeRange.projects.findIndex(item => item.path == projectPath)

    if (projectIndex == -1) {
      // if not exist, then create a new one.
      let project = new ProjectStats({ path: projectPath })

      timeRange.projects.unshift(project)
    }

    // move the project to the front so it's faster to access in the future. 
    if (projectIndex !== 0) {
      let projects = timeRange.projects.splice(projectIndex, 1)
      timeRange.projects.unshift(projects[0])
    }

    // should always be at the front. 
    return timeRange.projects[0]
  }

  /**
   * Get the project based on a path, given a time range. 
   * @param timeRange 
   * @param projectPath 
   * @returns project stats or null if not found. 
   */
  static getProject (timeRange: TimeRange, projectPath: string | undefined): ProjectStats | null {
    // similar to getCurrentProject but it doesn't create one if doesn't exist. 
    return timeRange.projects.find(item =>  item.path == projectPath) ?? null
  }

  /**
   * Gets the additional info of the current project. If it doesn't exist and the path isn't empty, a new project will be created. 
   * @param projectPath path of the project. 
   * @param allowCreation if the function is allowed to create the project that doesn't exist. 
   * @returns ProjectStatsInfo or null if the path is empty. 
   */
  getCurrentProjectInfo(projectPath: "" | undefined, allowCreation?: boolean): null
  getCurrentProjectInfo(projectPath: string, allowCreation?: boolean): ProjectStatsInfo
  getCurrentProjectInfo(projectPath: string | undefined, allowCreation: boolean = true): ProjectStatsInfo | null {
    if (!projectPath) {
      return null
    }

    // if not exist, then create a new one, assuming it is allowed. 
    if (!this.projectInfo.has(projectPath) && allowCreation !== false) {
      let project = new ProjectStatsInfo({ path: projectPath })

      this.projectInfo.set(projectPath, project)
    }

    return this.projectInfo.get(projectPath) ?? null
  }

  /**
   * Iterates over all time ranges. 
   * @param callback Processing to do for each time range. 
   * 
   * @todo Add support for custom time ranges. 
   */
  forAllTimeRanges (callback: (range: TimeRange, identifier: TimeRangeNames) => void) {
    for (let timeRange of [ "todayTime", "weeklyTime", "allTime" ] as const) {
      callback(this[timeRange], timeRange)
    }
  }

  /**
   * Saves the progress
   * @param force If to force the write to disk. If set to false, writes may be skipped to save lag on HDDs and or USBs(this is probably only a me issue). 
   */
  save (force: boolean = false) {
    if (!this.context) {
      return
    }

    const minSaveTime = GetSaveTimer()

    // prevents saving a bunch of times per second. Ignored if this is a force save.
    if ((Date.now() < this.lastSave + minSaveTime || minSaveTime == 0) && !force) {
      return
    }
    
    this.context.globalState.update("progressStorage", this)
    this.lastSave = Date.now()
  }

  toJSON () {
    /**
     * Convert hashmap back to array for storage. 
     */
    let projectInfo: ProjectStatsInfo[] = []

    for (let [ path, project ] of this.projectInfo) {
      projectInfo.push(project)
    }
    
    // this ignored the time range ref 
    return {
      startTime: this.startTime,
      allTime: this.allTime,
      weeklyTime: this.weeklyTime,
      todayTime: this.todayTime,
      customTime: this.customTime,
      
      projectInfo
    }
  }
}