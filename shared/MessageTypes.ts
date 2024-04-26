// Types of messages to be passed between the webview and the backend. 
import { GroupFileStats } from "../src/StatFinder"
import { CodingLanguage } from "../src/structs/CodingLanguage"
import { ProjectStats } from "../src/structs/ProjectStats"
import { ProjectStatsInfo } from "../src/structs/ProjectStatsInfo"
import { TimeAllocation } from "../src/structs/TimeAllocation"
import { TimeRange } from "../src/structs/TimeRange"
import { TypingSpeed } from "../src/structs/TypingStats"
import { TimeRangeNames } from "../src/structs/structs"

// Type for removing the methods on a class. Since these objects are passed between client and backend as JSON. 
type UnClass<T> = {
  [ K in keyof T ]: T[K] extends Function ? undefined : ( // remove function 
    T[K] extends object ? UnClass<T[K]> : T[K] // remove any sub functions 
  )
}

// Backend response types.

export interface BaseMessage {
  id: number
}

interface SuccessResponse {
  error: false
}
interface ErrorResponse {
  error: true
  errorMessage: string
}

/**
 * Response for a basic task. Either it's successful or there was an error.
 */
type TaskResponse = SuccessResponse | ErrorResponse

export type ProjectResponse = {
  path: string
  project: ProjectStats
  info: ProjectStatsInfo 
} & SuccessResponse | ErrorResponse

export interface ProjectInfo {
  name: string
  path: string
  time: number
}

// This maps the command to the response that the backend sends back.
/**
 * Maps the commands to their response data(ignoring `BaseMessage`). All these values will be added to `BaseMessage`
 */
export type BackendResponseMapping = {
  extensionStartDate: {
    date: number
  }
  colourTheme: {
    isDark: boolean
  }
  statsJSONData: {
    json: string
  }
  progressObject: {
    progress: TimeRange
    cps: TypingSpeed
  }
  currentProject: ProjectResponse
  getProject: ProjectResponse
  projectPath: { path: string } & SuccessResponse | ErrorResponse
  allProjectInfo: {
    projects: ProjectInfo[]
  }
  mostUsedLanguages: {
    top: [ string, CodingLanguage ][]
    other: null | {
      amount: number
      time: TimeAllocation
    }
  }
  getGraphData: {
    error: false
    data: {
      name: string
      amount: number
    }[]
    totalAmount: number
  } | ErrorResponse
  getSearchIgnores: {
    ignoredGitignore: boolean
    ignoreVscodeIgnore: boolean
  }
  getDefaultIA: {
    allowed: string[]
    ignored: string[]
  }

  updateIANames: TaskResponse
  updateUsageData: SuccessResponse
  updateProjectName: TaskResponse
  mergeProjects: TaskResponse
  scanLines: GroupFileStats & SuccessResponse | ErrorResponse
}

/**
 * All the commands the progress webview can send to the backend.
 */
export type ProgressWebviewCommands = keyof BackendResponseMapping

// Client request types

export interface BaseRequest<C extends ProgressWebviewCommands> {
  command: C
  id: number
}

interface TimeRangeCommandArgument {
  timeRange: TimeRangeNames
}

export type GraphTypes = "lines" | "characters" | "charactersWB" | "time"
export type GraphSubTypes = "net" | "added" | "removed" | "active" | "total"

/**
 * These are the mappings for the client command to the data it needs to be included, excluding the id and the command itself. These properties will be added back later.
 * **Note**: since most commands are simple requests with command only, only commands which require extra data to be passed in are included here.
 */
export type CommandRequestMappings = {
  progressObject: TimeRangeCommandArgument
  currentProject: TimeRangeCommandArgument
  getProject: TimeRangeCommandArgument & {
    path: string
  }
  allProjectInfo: TimeRangeCommandArgument
  mostUsedLanguages: {
    amount?: number
  }
  getGraphData: {
    timeRange: TimeRangeNames
    /**
     * What to be ranked. Either "project" for all projects, "language" for languages of the time range, or path to project for that project's languages.
     */
    rank: string
    type: GraphTypes
    /**
     * active and total are only for time, the rest are for `type` other than time
     */
    subtype: GraphSubTypes
  }
  updateIANames: {
    allowedFileFolders: string[]
    ignoredFileFolders: string[]
  }
  updateUsageData: {
    // Should be a UsageTimeInterface object
    data: object
  }
  updateProjectName: {
    path: string
    name: string
  }
  mergeProjects: {
    paths: [ string, string, ...string[] ]
  }
  scanLines: {
    path: string
    allowedFileFolders: string[]
    ignoredFileFolders: string[]
  }
}

// Helper types for the arguments of the message passing functions

export type CompleteBackendResponse<C extends ProgressWebviewCommands> = BackendResponseMapping[C] & BaseMessage