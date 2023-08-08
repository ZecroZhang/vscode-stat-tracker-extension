//Types of messages to be passed between the webview and the backend. 

import { CodingLanguage, ProjectStats, ProjectStatsInfo, TimeAllocation, TimeRange } from "../src/Structures"

//Type for removing the methods on a class. Since these objects are passed between client and backend as JSON. 
type UnClass<T> = {
  [ K in keyof T ]: T[K] extends Function ? undefined : ( //remove function 
    T[K] extends object ? UnClass<T[K]> : T[K] //remove any sub functions 
  )
}

//All Commands which the client can send the backend for a response. 
export type BackendCommands = "mostUsedLanguages" | "extensionStartDate" | "statsJSONData" | "projectPath" | "updateUsageData" | "colourTheme" | "currentProject" | "progressObject" | "getProject" | "allProjectInfos" | "scanLines" | "updateIANames" | "updateProjectName" | "mergeProjects"

export interface BaseMessage {
  id: number
}

//Message featuring a command for the backend to process. 
export interface BaseCommandMessage {
  command: BackendCommands

  type?: string
  amount?: number
  path?: string
  data?: string
}


/* Below are client requests. */
export interface UpdateIACommand extends BaseCommandMessage {
  command: "updateIANames"
  allowedFileFolders: string[]
  ignoredFileFolders: string[]
}

export interface ScanLinesCommand extends Omit<UpdateIACommand, "command"> {
  command: "scanLines"
  error?: boolean
  path: string
}

export interface UpdateUsageCommand extends BaseCommandMessage {
  command: "updateUsageData"
  json: object
}

export interface UpdateProjectNameCommand extends BaseCommandMessage {
  command: "updateProjectName"
  path: string
  name: string
}
export interface MergeProjectCommand extends BaseCommandMessage {
  command: "mergeProjects"
  //Only the first path is kept.
  paths: string[]
}

//The command that is passed into `AwaitMessage` because the Id is only generated there. 
export type ServerCommandConstruct = BaseCommandMessage | UpdateIACommand | ScanLinesCommand | UpdateUsageCommand | UpdateProjectNameCommand | MergeProjectCommand

export type ServerCommand = ServerCommandConstruct & BaseMessage

/* Below are server responses */

interface SuccessResponse extends BaseMessage {
  error: false
}
export interface ErrorResponse extends BaseMessage {
  error: true
  errorMessage: string
}
/**
 * Basically a BaseMessage response but it also contains a possibility for error. 
 */
export type SimpleResponse = SuccessResponse | ErrorResponse

export interface MostUsedLanguagesResponse extends BaseMessage {
  //Don't use the class methods since this is converted to/from json. 
  data: [ string, CodingLanguage ][]
  otherLanguages: null | {
    amount: number
    time: TimeAllocation
  }
}

export interface ProgressObjectResponse extends BaseMessage {
  data: TimeRange
  cps: number | "unknown"
}

export interface ProjectResponse extends BaseMessage {
  path: string
  project: ProjectStats
  info: ProjectStatsInfo 
}

export interface AllProjectInfo extends BaseMessage {
  data: {
    name: string
    path: string
    time: number
  }[]
}

export interface FileStatsInfo extends BaseMessage {
  lines: number
  characters: number 
  files: number
  folders: number
}

//date or number
export interface NumberResponse extends BaseMessage {
  data: number
}

export interface JSONResponse extends BaseMessage {
  data: string
}

export type BackendResponse = MostUsedLanguagesResponse | ProgressObjectResponse | ProjectResponse | AllProjectInfo | NumberResponse | JSONResponse | FileStatsInfo | SimpleResponse 