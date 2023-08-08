//Classes and interfaces are stored here.

import { ExtensionContext } from "vscode"

/**
 * @todo this[item].combine(new NetAddRemove(usageTimeObject[item])) <- this causes a bug where line, character progress isn't loaded. Unable to reproduce tho.
 */

/**
 * `Partial` utility type but instead of affecting only the object properties, it affects all sub-properties of the object. 
 */
type DeepPartial<Type> = {
  [ Property in keyof Type ]?: Type[Property] extends object ? ( Type[Property] extends Array<any> ? Type[Property] : DeepPartial<Type[Property]> ) : Type[Property]
}

export type TimeRangeNames = "allTime" | "weeklyTime" | "todayTime"

/**
 * Generic class for keeping track of adding/deletion changes. For lines of code, characters, and characters w/o bulk. 
 */
export class NetAddRemove {
  /**
   * Amount added.
   */
  added: number
  /**
   * Amount removed. 
   */
  removed: number
  /**
   * The net change of the thing. Should be added - removed 
   */
  net: number

  constructor ( constructionValue?: DeepPartial<NetAddRemove> ) {
    this.added = constructionValue?.added || 0
    this.removed = constructionValue?.removed || 0
    this.net = constructionValue?.net || 0
  }

  //Removes stats from the object.
  remove ( removeInput?: DeepPartial<NetAddRemove>) {
    this.added -= removeInput?.added || 0
    this.removed -= removeInput?.removed || 0
    this.net -= removeInput?.net || 0
  }

  //Combines a second class instance of this class. 
  combine ( NARObject: DeepPartial<NetAddRemove> ) {
    const keys = [ "added", "removed", "net" ] as const

    for (var key of keys) {
      //Ignore the property if it's NaN(probably undefined). Using not null assertion because this is the isNaN function... 
      if (isNaN(NARObject[key]!)) continue

      //Add the key to ours... ours should never be undefined 
      this[key] += Number(NARObject[key])
    }
  }

  /**
   * Sets everything back to 0. 
   */
  clear () {
    this.added = 0
    this.removed = 0 
    this.net = 0 
  }
}

export class TimeAllocation {
  totalTime: number
  activeTime: number

  constructor (timeAllocation?: DeepPartial<TimeAllocation>) {
    this.totalTime = Number(timeAllocation?.totalTime) || 0
    this.activeTime = Number(timeAllocation?.activeTime) || 0
  }

  combine (timeAllocation: TimeAllocation) {
    this.totalTime += Number(timeAllocation.totalTime) || 0
    this.activeTime += Number(timeAllocation.activeTime) || 0
  }
}

//net add removes
const netAddRemoveKeys = [ "characters", "lines", "charactersWB" ] as const
/**
 * Edits. A class for 3 NetAddRemove, lines, characters and characters without bulk 
 */
export class Edits {
  //The following be defined in the loop. 
  /**
   * Lines modified. 
   */
  lines!: NetAddRemove
  /**
   * Characters modified. 
   */
  characters!: NetAddRemove
  /**
   * Characters modified without counting bulk modification, such as copy and paste or autofill. 
   */
  charactersWB!: NetAddRemove

  constructor (editInput?: DeepPartial<Edits>) {
    for (var item of netAddRemoveKeys) {
      this[item] = new NetAddRemove(editInput?.[item])
    }
  }

  /**
   * Combines the values for this classes lines characters and characters without bulk with another classes. 
   * @param edits Another Edits class.
   */
  combine (edits: Edits) {
    for (var item of netAddRemoveKeys) {
      this[item].combine(edits[item])
    }
  }

  /**
   * Resets all stats. 
   */
  clear () {
    this.lines.clear()
    this.characters.clear()
    this.charactersWB.clear()
  }
}

export class TypingStats {
  /**
   * Samples for delta times between key strokes. This can contain duplicates and is only used for the first 100 characters when samplesReady is still false. 
   */
  samples: Array<number>
  /**
   * If there are more than 100 samples and it's ready to reject outliers. 
   */
  samplesReady: boolean
  /**
   * Total characters typed. Used only after samples are ready. 
   */
  totalChar: number
  /**
   * Total delta time between character typing. Used only after samples are ready. 
   */
  totalTime: number

  constructor (typingStats?: Partial<TypingStats>) {
    /**
     * Array of 100 timestamps between characters. If it's 15x off then it's considered an outlier. This is used to calculate the median since outliers are unknown. 
     */
    this.samples = typingStats?.samples || []

    this.totalChar = Number(typingStats?.totalChar) || -1
    this.totalTime = Number(typingStats?.totalTime) || -1

    //If the samples are ready the totalChar and time must be defined. 
    this.samplesReady = this.totalChar != -1 && this.totalTime != -1
  }

  combine (typingStats: TypingStats) {
    if (typingStats.samplesReady && this.samplesReady) { //both are ready. 
      this.totalChar += typingStats.totalChar
      this.totalTime += typingStats.totalTime
    } else if (!typingStats.samplesReady && !this.samplesReady) { //both are not ready
      this.samples = this.samples.concat(typingStats.samples)

      //Get samples ready if we have 100. 
      if (this.samples.length > 100) {
        this.completeSamples()
      }
    } else {//one is ready. 
      //The one with the samples ready
      var readySamples: TypingStats
      //The one without samples ready. this will be added to the other one. 
      var notReadySamples: TypingStats

      if (this.samplesReady) {
        readySamples = this
        notReadySamples = typingStats
      } else {
        readySamples = typingStats
        notReadySamples = this
      }

      //The average time between two characters. Then multiplied by 15 because anything below will be added. 
      var adjustedAverage = readySamples.totalTime / readySamples.totalChar * 15 
      
      for (var c = 0; c < notReadySamples.samples.length; c++) {
        if (notReadySamples.samples[c] < adjustedAverage) {
          readySamples.totalTime += notReadySamples.samples[c]
          readySamples.totalChar ++
        }
      }

      //If this class isn't the ready sample, we take all their data. 
      if (!this.samplesReady) {
        this.samples = []
        this.samplesReady = true
        this.totalChar = readySamples.totalChar
        this.totalTime = readySamples.totalTime
      }
    }
  }

  /**
   * Adds a typed character to the wpm. 
   * @param delta Time in ms since the last character was typed.
   */
  typedCharacter (delta: number) {
    if (this.samplesReady) {
      //Check if it's within the allowed average. 
      var adjustedAverage = this.totalTime / this.totalChar * 15 

      if (delta > adjustedAverage) {
        return
      }

      this.totalTime += delta
      this.totalChar ++
    } else {
      this.samples.push(delta)

      if (this.samples.length > 100) {
        this.completeSamples()
      }
    }
  }

  completeSamples () {
    var median = TypingStats.CalculateMedian(this.samples)
    var { totalTime, totalChar } = TypingStats.CalculateTotalCharTime(this.samples, median)
    
    this.totalTime = totalTime
    this.totalChar = totalChar

    //No samples needed 
    this.samplesReady = true 
    this.samples = []
  }

  /**
   * Calculates the wpm for the typing stats assuming enough samples. This assumes here are 5 characters in a word. 
   * @returns words per minute
   */
  wpm (): "unknown" | number {
    if (!this.samplesReady) return "unknown"
    //60000 / Time per char * 5 
    return 60000 / ((this.totalTime / this.totalChar) * 5)
  }
  
  /**
   * Calculates the amount of characters per second. 
   */
  cps (): "unknown" | number {
    if (!this.samplesReady) return "unknown"

    return 1000 / (this.totalTime / this.totalChar)
  }

  static CalculateMedian (data: Array<number>): number {
    //Could use optimizing 
    data = data.sort((a, b) => a-b)

    if (data.length%2 == 0) {
      return (data[data.length/2-1] + data[data.length/2])/2
    } else {
      return data[Math.floor(data.length/2)]
    }
  }

  /**
   * Calculates the totalChar and totalTime
   * @param median 
   */
  static CalculateTotalCharTime (data: Array<number>, median: number) {
    var totalTime = 0
    var totalChar = 0

    for (var c = 0; c < data.length; c++) {

      //Add if it's not 15x longer than 
      if (data[c] < median*15) {
        totalTime += data[c]
        totalChar ++
      }
    }

    return { totalTime, totalChar }
  }
}

//Coding Languages 
export class CodingLanguage {
  time: TimeAllocation
  edits: Edits

  constructor (constructionInput?: DeepPartial<CodingLanguage>) {
    this.time = new TimeAllocation(constructionInput?.time)
    this.edits = new Edits(constructionInput?.edits)
  }
  /**
   * Combines this class with another class.
   * @param codingLanguageObject Another codingLanguage class
   */
  combine (codingLanguageObject?: DeepPartial<CodingLanguage>) {
    this.time.combine(new TimeAllocation(codingLanguageObject?.time))
    this.edits.combine(new Edits(codingLanguageObject?.edits))
  }
}

export class CodingLanguageCollection {
  [ key: string ]: CodingLanguage

  constructor (codingLanguageCollection?: DeepPartial<CodingLanguageCollection>) {
    if (!codingLanguageCollection) return

    var languageKeys = Array.from(Object.keys(codingLanguageCollection))

    for (var language of languageKeys) {
      this[language] = new CodingLanguage(codingLanguageCollection[language])
    }
  }
} 

export class StatCounterSearch {
  path: string
  allowedFileExtensions: string[]
  ignoredFileFolderNames: string[]

  constructor (statCounterSearch?: DeepPartial<StatCounterSearch>) {
    this.path = statCounterSearch?.path || ""
    this.allowedFileExtensions = statCounterSearch?.allowedFileExtensions || []
    this.ignoredFileFolderNames = statCounterSearch?.ignoredFileFolderNames || []
  }
}

//For individual project workspaces 
export class ProjectStatsInfo {
  name: string
  path: string //path will act as the id. 

  //This is for the "Stat Counter" section of the webview. Saves the file types and stuff. 
  search: StatCounterSearch

  constructor (project?: DeepPartial<ProjectStatsInfo>) {
    this.path = project?.path || "/unknown"
    this.name = project?.name || ProjectStats.FolderFromPath(this.path)
    
    this.search = new StatCounterSearch(project?.search)
  }
}

export class ProjectStats {
  path: string
  timeAllocation: TimeAllocation
  edits: Edits
  languages: CodingLanguageCollection

  constructor (project?: DeepPartial<ProjectStats>) {
    this.path = project?.path || "/unknown"

    this.timeAllocation = new TimeAllocation(project?.timeAllocation)
    this.edits = new Edits(project?.edits)

    this.languages = new CodingLanguageCollection(project?.languages)
  }

  /**
   * Combine two projects. 
   * @param project other project. 
   * @param replacePath If the path of this one should be replaced with the path of the other project. 
   */
  combine (project: ProjectStats, replacePath: boolean) {
    //Idk how to even combine a title. 

    if (replacePath) {
      this.path = project.path
    }

    this.timeAllocation.combine(project.timeAllocation)
    this.edits.combine(project.edits)
  }

  static FolderFromPath (path: string): string {
    return path.substring(path.lastIndexOf("/")+1)
  }
}

//Time range 
interface TimeRangeInterface {
  //WB stands for without bulk.
  resets?: number
  codeTime?: TimeAllocation
  edits?: DeepPartial<Edits>
  languages?: DeepPartial<CodingLanguageCollection>
  typing?: Partial<TypingStats>
  projects?: Array<DeepPartial<ProjectStats>>

  //used exclusively for custom time ranges.
  startTime?: number 
}
export class TimeRange {
  resets?: number
  codeTime: TimeAllocation
  edits: Edits
  languages: CodingLanguageCollection
  typing: TypingStats
  projects: Array<ProjectStats>

  constructor(constructionInput?: TimeRangeInterface, time: number = 86400000) {
    this.resets = constructionInput?.resets || Date.now() + time
    this.codeTime = new TimeAllocation(constructionInput?.codeTime)
    this.edits = new Edits(constructionInput?.edits)

    this.languages = {}
    //Add all the languages
    if (constructionInput?.languages) {
      var keys = Array.from(Object.keys(constructionInput.languages))
      for (var languageKey of keys) {
        this.languages[languageKey] = new CodingLanguage(constructionInput.languages[languageKey])
      }
    }

    this.typing = new TypingStats(constructionInput?.typing)

    this.projects = []
    //Add all the projects 
    if (constructionInput?.projects) {
      for (var project of constructionInput.projects) {
        this.projects.push(new ProjectStats(project))
      }
    }
  }
  
  combine (timeRangeObject?: TimeRangeInterface) {
    //Resets will be ignored since the main is probably more important. More emphasis that this is the correct object or the code will break.
    this.codeTime.combine(new TimeAllocation(timeRangeObject?.codeTime))
    this.edits.combine(new Edits(timeRangeObject?.edits))

    //combine the languages. 
    if (timeRangeObject?.languages) {
      let languageNames = Array.from(Object.keys(timeRangeObject.languages))

      for (let language of languageNames) {
        if (this.languages[language]) { //if exists, merge
          this.languages[language].combine(new CodingLanguage(timeRangeObject.languages[language]))
        } else { //doesn't exist, add new. 
          this.languages[language] = new CodingLanguage(timeRangeObject.languages[language])
        }
      }
    }

    //typing stats 
    this.typing.combine(new TypingStats(timeRangeObject?.typing))

    //combine the projects. 
    if (timeRangeObject?.projects) {
      for (let project of timeRangeObject.projects) {
        //find the project
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
    this.languages = {}
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

//Usage time. Total everything. Main element that goes into storage. 
export interface UsageTimeInterface {
  startTime?: number
  allTime?: TimeRangeInterface
  weeklyTime?: TimeRangeInterface
  todayTime?: TimeRangeInterface
  customTime?: Array<TimeRangeInterface>

  projectInfo?: ProjectStatsInfo[]
}

/**
 * Time required to wait before saving again. This makes it easier on my usb which has a write speed of 0mb/s 
 */
const saveTimer = 15000

export class UsageTime {
  startTime: number
  allTime: TimeRange
  weeklyTime: TimeRange
  todayTime: TimeRange
  customTime: Array<CustomTimeRange>

  /**
   * Fast look up for project info when given the path to the project. 
   */
  projectInfo: Map<string, ProjectStatsInfo>
  
  //All properties below are not saved when converted to JSON. 

  /**
   * Reference for the other time ranges so they can be looped over. 
   */
  timeRangeRef: Array<TimeRange>
  lastSave: number
  context: ExtensionContext | null

  constructor (extensionContext: ExtensionContext | null, constructionInput?: UsageTimeInterface) {
    this.startTime = constructionInput?.startTime || Date.now()

    this.allTime = new TimeRange(constructionInput?.allTime)
    this.weeklyTime = new TimeRange(constructionInput?.weeklyTime, 604800000)
    this.todayTime = new TimeRange(constructionInput?.todayTime, 86400000)

    //for use later
    this.customTime = []

    //load the project infos. 
    this.projectInfo = new Map()

    if (constructionInput?.projectInfo) {
      for (let projectInfo of constructionInput.projectInfo) {
        this.projectInfo.set(projectInfo.path, new ProjectStatsInfo(projectInfo))
      }
    }

    // this is just to make sure all the projects that exist have their associated ProjectStatInfo object(for loading older JSON). 
    this.allTime.projectStatsInfoCheck(this.projectInfo)

    //Will not include the ones in custom time. 
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
    for (var customTime of usageTimeObject.customTime) {
      this.customTime.push(customTime)
    }

    //combine the global project stats - they don't need to be combined.
    for (let [ key, projectInfo ] of usageTimeObject.projectInfo) {
      if (this.projectInfo.has(projectInfo.path)) {
        continue
      }

      //add it if it doesn't exist. I have no idea how to name these properties. 
      this.projectInfo.set(projectInfo.path, new ProjectStatsInfo(projectInfo))
    }

    //I don't think this is useful but consistency check? 
    this.allTime.projectStatsInfoCheck(this.projectInfo)
  }

  /**
   * Deletes all the language data for all time ranges and projects. 
   */
  deleteAllLanguageData () {
    //Clear the range of all the time range refs 
    for (var range of [ ...this.timeRangeRef, ...this.customTime ]) {
      range.languages = new CodingLanguageCollection()
      
      //delete it from all projects 
      for (var project of range.projects) {
        project.languages = new CodingLanguageCollection()
      }
    }
  }

  updateCodeTime (deltaTime: number, language: string, isActive: boolean, projectPath?: string) {
    //Add the code time to everyone. 
    for (let range of [ ...this.timeRangeRef, ...this.customTime ]) {
      //Add to the time range
      range.codeTime.totalTime += deltaTime
      if (isActive) range.codeTime.activeTime += deltaTime

      //Add to the languages. 
      this.updateLanguageCodeTime(range.languages, language, deltaTime, isActive)

      //Add to current project. 
      if (projectPath) {
        let currentProject = this.getCurrentProject(range, projectPath)

        currentProject.timeAllocation.totalTime += deltaTime
        if (isActive) currentProject.timeAllocation.activeTime += deltaTime
        //for the language in the project 
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
    //Add it to every range
    for (var range of [ ...this.timeRangeRef, ...this.customTime ]) {
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
    for (var range of [ ...this.timeRangeRef, ...this.customTime ]) {
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
  getCurrentProject(timeRange: TimeRange, projectPath: string): ProjectStats //Exclude<string, ""> doesn't work which is annoying.
  getCurrentProject (timeRange: TimeRange, projectPath: string | undefined): ProjectStats | null {
    if (!projectPath) {
      return null
    }

    //find the project
    var projectIndex = timeRange.projects.findIndex(item => item.path == projectPath)

    if (projectIndex == -1) {
      //if not exist, then create a new one.
      let project = new ProjectStats({ path: projectPath })

      timeRange.projects.unshift(project)
    }

    //move the project to the front so it's faster to access in the future. 
    if (projectIndex !== 0) {
      let projects = timeRange.projects.splice(projectIndex, 1)
      timeRange.projects.unshift(projects[0])
    }

    //should always be at the front. 
    return timeRange.projects[0]
  }

  /**
   * Get the project based on a path, given a time range. 
   * @param timeRange 
   * @param projectPath 
   * @returns project stats or null if not found. 
   */
  getProject (timeRange: TimeRange, projectPath: string | undefined): ProjectStats | null {
    //similar to getCurrentProject but it doesn't create one if doesn't exist. 
    return timeRange.projects.find(item =>  item.path == projectPath) || null
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

    //if not exist, then create a new one, assuming it is allowed. 
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

    //prevents saving a bunch of times per second. 
    if (Date.now() < this.lastSave + saveTimer && !force) {
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
    
    //this ignored the time range ref 
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