import fs from "fs"
import vscode from "vscode"
import { BackendResponseMapping, BaseRequest, CommandRequestMappings, CompleteBackendResponse, ProgressWebviewCommands, ProjectInfo, ProjectResponse } from "../shared/MessageTypes"
import { ErrorCode, GroupFileStats, LinesOfCode } from "./StatFinder"
import { UsageTime } from "./structs/UsageTime"
import { TimeAllocation } from "./structs/TimeAllocation"
import { TimeRangeNames } from "./structs/structs"
import { ProjectStats } from "./structs/ProjectStats"
import { GetConfig, GetDefaultIANames, GetStatCounterConfig } from "./helper/GetConfig"
import { TimeRange } from "./structs/TimeRange"
import { CodingLanguage } from "./structs/CodingLanguage"

export interface ProgressViewMessagePost {
  [ key: string ]: any

  id: number,
  date?: Date,
  html?: any, // It's supposed to be a string but, I can't get the multi-type function to work for this. 
  data?: any
}

/**
 * Generates the html for the progress webview page.
 * It only contains the scripts and stylesheets in the header.
 * The body's empty.
 * @param scriptLink uri link to the script.
 * @param stylesLinks Array order: styles.css, darkTheme.css, lightTheme.css
 * @returns html
 */
export function WebpageHTML (scriptLink: vscode.Uri, stylesLinks: vscode.Uri[], iconLink: vscode.Uri): string {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <!-- Compiled function script -->
    <script src="${scriptLink}" defer></script>

    <link rel="icon" href=${iconLink} />

    <link rel="stylesheet" href="${stylesLinks[0]}" />
    <link id="darkThemeStyleSheet" rel="stylesheet" href="${stylesLinks[1]}" disabled />
    <link id="lightThemeStyleSheet" rel="stylesheet" href="${stylesLinks[2]}" disabled />
  <head>
  <body></body>`
}

/**
 * Gets the top `amount` languages sorted based on totalTime. 
 * @param amount amount of top languages. This will not exceed the amount of total languages. 
 * @param progressStorage user data.
 * @returns Array of tuples(language name, coding language). It may be sized `amount+1`, with the last item representing all other languages. **Only time is saved as of right now.**
 */
function TopLanguages (progressStorage: UsageTime, amount?: number) {
  // Currently for allTime and sorted by time. These will be modifiable later. 
  let sortedLanguages = Array.from(Object.entries(progressStorage.allTime.languages)).sort((a, b) => b[1].time.totalTime - a[1].time.totalTime)

  if (amount === undefined) {
    amount = sortedLanguages.length
  }

  let otherTime = new TimeAllocation()
  for (let i = amount; i < sortedLanguages.length; i++) {
    let language = sortedLanguages[i][1]

    otherTime.combine(language.time)
  }

  let otherLanguageCount = sortedLanguages.length - amount
  // Cut out the others. 
  sortedLanguages = sortedLanguages.slice(0, amount)

  let otherLanguage = null
  // Return the top `amount` languages + an other
  if (otherTime.totalTime > 0) {
    otherLanguage = {
      amount: otherLanguageCount, 
      time: otherTime
    }
  }

  return {
    top: sortedLanguages,
    other: otherLanguage
  }
}

/**
 * Gets project data on a project requested by the progress webview.
 * @param projectPath path to project.
 * @param timeRange time range to get stats on.
 * @param progressStorage all stats.
 * @returns message to send back to the webview.
 */
function GetProject (projectPath: string, timeRange: TimeRangeNames, progressStorage: UsageTime): ProjectResponse {
  let project = UsageTime.getProject(progressStorage[timeRange], projectPath)

  if (!projectPath || !project) {
    return {
      error: true,
      errorMessage: "Invalid project path."
    }
  }

  return {
    error: false,
    path: projectPath,
    project,
    info: progressStorage.getCurrentProjectInfo(projectPath)
  }
}

/**
 * An object with command and the extra properties of the command(as specified by `CommandRequestMappings`). 
 * C stands for command.
 */
type ClientRequestMessage<C extends ProgressWebviewCommands> = C extends keyof CommandRequestMappings ? BaseRequest<C> & CommandRequestMappings[C] : BaseRequest<C>

const successMessage = { error: false }

/**
 * Takes in a message and responds with the appropriate backend response.
 * @param message check comments for `ClientRequestMessage` and `CommandRequestMappings`
 * @returns response as dictated by `BackendResponseMapping`
 */
export function GetMessageResponse<C extends ProgressWebviewCommands> (message: ClientRequestMessage<C>, progressStorage: UsageTime): CompleteBackendResponse<C> {
  // It will first be the incomplete response. Since the only difference is the id, it will be added at the end.
  let response: BackendResponseMapping[C] | CompleteBackendResponse<C>

  // Result, idk why I need to typecast on everyone
  type R = BackendResponseMapping[C] 

  switch (message.command) {
    case "extensionStartDate":
      response = {
        date: progressStorage.startTime
      } as R

      break
    case "colourTheme":
      let theme = vscode.window.activeColorTheme.kind

      let isDark = [
        vscode.ColorThemeKind.Dark,
        vscode.ColorThemeKind.HighContrast
      ].includes(theme)

      response = {
        isDark
      } as R

      break
    case "statsJSONData":
      response = {
        json: JSON.stringify(progressStorage)
      } as R

      break
    case "progressObject": {
      let progressObject = progressStorage[message.timeRange]

      response = {
        progress: progressObject,
        cps: progressObject.typing.cps()
      } as R

      break
    }
    case "currentProject":
      let path = vscode.workspace.workspaceFolders?.[0]?.uri?.path

      if (path) {
        response = GetProject(path, message.timeRange, progressStorage) as R 
      } else {
        response = {
          error: true,
          errorMessage: "Failed to find current project path."
        } as R
      }

      break
    case "getProject": {
      response = GetProject(message.path, message.timeRange, progressStorage) as R 
      break
    }
    case "projectPath":
      // Sends over one project path. 
      let projectPaths = vscode.workspace.workspaceFolders

      if (!projectPaths) {
        response = {
          error: true,
          errorMessage: "There are currently no projects open."
        } as R
        break
      }

      response = {
        error: false,
        path: projectPaths[0].uri.fsPath
      } as R
      break
    case "allProjectInfo": {
      let projects: ProjectInfo[] = []
      
      for (let project of progressStorage[message.timeRange].projects) {
        let projectInfo = progressStorage.getCurrentProjectInfo(project.path)

        projects.push({
          name: projectInfo.name,
          path: projectInfo.path,
          time: project.time.totalTime
        })
      }

      response = {
        projects        
      } as R
      break
    }
    case "mostUsedLanguages":
      response = TopLanguages(progressStorage, message.amount) as R
      break
    case "getGraphData": {
      let timeRange = progressStorage[message.timeRange]

      let dataPoints: {
        name: string
        amount: number
      }[] = []
      let total = 0

      const maxValues = 10 // Most amount of slices.
      const { type, subtype } = message

      /**
       * Gets the value of the property on the object as specified by the message.
       * @param data either a project or a coding language.
       * @returns value of property.
       */
      const GetProperty = (data: ProjectStats | CodingLanguage) => {
        let amount: number

        if (type == "time") {
          if (subtype == "active") {
            amount = data.time.activeTime
          } else { // subtype == "total"
            amount = data.time.totalTime
          }
        } else {
          amount = data.edits[type][subtype as "added" | "net" | "removed"]
        }

        return amount
      }

      /**
       * Adds a data point to `dataPoints` for the pie chart. Also increments the total.
       * @param data either a project or a language to extract some property from.
       * @param name name that will be given to the pie chart slice.
       */
      const AddValue = (data: ProjectStats | CodingLanguage, name: string) => {
        let amount = GetProperty(data)
        total += amount

        if (dataPoints.length >= maxValues) {
          dataPoints[9].name = "Other"
          dataPoints[9].amount += amount
        } else {
          dataPoints.push({
            name,
            amount
          })
        }
      }

      // Rank the projects themselves based on the type. 
      if (message.rank == "projects") {
        let sortedProjects = [ ...timeRange.projects ]
        sortedProjects.sort((a, b) => GetProperty(b) - GetProperty(a))
        
        for (let project of sortedProjects) {
          // All projects have project info, so should be defined.
          AddValue(project, progressStorage.getCurrentProjectInfo(project.path)!.name)
        }
      } else { // Ranking languages.
        // Where we will be pulling the stats from.
        let data: TimeRange | ProjectStats = timeRange

        if (message.rank != "languages") {
          let project = UsageTime.getProject(timeRange, message.rank)

          if (project == null) {
            response = { error: true, errorMessage: "The project does not exist or was not worked on during the time interval." } as R
            break
          }
  
          data = project
        }

        const sortedLanguages = Array.from(Object.entries(data.languages)).sort((a, b) => GetProperty(b[1]) - GetProperty(a[1]))

        for (let [ name, language ] of sortedLanguages) {
          AddValue(language, name)
        }
      }

      response = {
        error: false,
        data: dataPoints,
        totalAmount: total
      } as R
      break
    }
    case "getDefaultIA": {
      response = GetDefaultIANames() as R
      break
    }
    case "getSearchIgnores":
      response = GetStatCounterConfig() as R
      break
    case "updateIANames": { // update ignore allow names
      let projectPath = vscode.workspace.workspaceFolders?.[0]?.uri?.path

      if (!projectPath) {
        response = {
          error: true,
          errorMessage: "Failed to detect the current folder path."
        } as R
        break
      }

      let projectDetails = progressStorage.getCurrentProjectInfo(projectPath)
      const search = projectDetails.search

      search.allowedFileExtensions = message.allowedFileFolders
      search.ignoredFileFolderNames = message.ignoredFileFolders
      search.isDefaultIA = false

      progressStorage.save()

      response = successMessage as R
      break
    }
    case "updateUsageData":
      let progressTempBin = new UsageTime(null, message.data)

      progressStorage.combine(progressTempBin)
      progressStorage.save(true)
      
      response = successMessage as R
      
      vscode.window.showInformationMessage("Combined and updated account stats. :)")
      break
    case "updateProjectName": {
      let projectInfo = progressStorage.getCurrentProjectInfo(message.path)
      
      if (!projectInfo) {
        response = {
          error: true,
          errorMessage: "Failed to detect project path."
        } as R
        break
      }

      projectInfo.name = message.name.substring(0, 256)
      progressStorage.save()

      response = successMessage as R
      break
    }
    case "mergeProjects": {
      // The first project is the path that is kept.
      let firstProjectPath = message.paths.shift()!

      let firstProjects: {
        [ key: string ]: ProjectStats | undefined
      } = {}

      progressStorage.forAllTimeRanges((range, identifier) => {
        firstProjects[identifier] = range.projects.find(item => item.path == firstProjectPath)
      })

      let errorMessage = ""
      for (let projectPath of message.paths) {
        if (!progressStorage.getCurrentProjectInfo(projectPath, false)) {
          errorMessage = "The project path entered is invalid."
          break
        }

        progressStorage.forAllTimeRanges((range, identifier) => {
          let projectIndex = range.projects.findIndex(p => p.path == projectPath)
          let project = range.projects[projectIndex]

          // No project means nothing to merge with the first one, for this time range. 
          if (!project) {
            return
          }

          let firstProject = firstProjects[identifier]

          if (!firstProject) {
            // There isn't an original, so set this one as it. 
            project.path = firstProjectPath
            return
          } // otherwise, they both exist so combine.

          firstProject.combine(project, false)

          // Remove the project 
          range.projects.splice(projectIndex, 1)
        })

        progressStorage.projectInfo.delete(projectPath)
      }

      if (errorMessage) {
        response = { error: true, errorMessage } as R
      } else {
        response = successMessage as R
      }
      break
    }
    case "scanLines": {
      // Check if we need to ignore the gitignore or vscodeignore
      let { ignoredGitignore, ignoreVscodeIgnore } = GetStatCounterConfig()

      let path = message.path
      if (!path.endsWith("/") && !path.endsWith("\\")) {
        path += "/"
      }

      /**
       * Gets the ignored file globs from a gitignore or a vscodeignore file.
       * @param filePath path to gitignore or vscodeignore
       * @returns list of globs
       */
      function GetIgnoreGlobs (filePath: string) {
        if (!fs.existsSync(filePath)) {
          return []
        }

        return fs.readFileSync(filePath).toString().split("\n").filter(item => item.length > 0)
      }

      let ignoredFileFolders: string[] = [ ...message.ignoredFileFolders ]
      // Check for the ignore files.
      if (ignoredGitignore) {
        ignoredFileFolders.push(...GetIgnoreGlobs(`${path}.gitignore`))
      }

      if (ignoreVscodeIgnore) {
        ignoredFileFolders.push(...GetIgnoreGlobs(`${path}.vscodeignore`))
      }

      // This is case insensitive.
      ignoredFileFolders = ignoredFileFolders.map(item => item.toLowerCase())

      let codeData = LinesOfCode(path, message.allowedFileFolders, ignoredFileFolders)

      if ((codeData as ErrorCode).error === true) {
        let errorCode = (codeData as ErrorCode).code
        let errorMessage: string 

        if (errorCode == 1) {
          errorMessage = "Invalid file path specified."
        } else { // Assuming error code of 0
          errorMessage = "An unknown error has occurred."
        }

        response = {
          error: true, errorMessage
        } as R
        break
      }

      response = {
        error: false,
        ...(codeData as GroupFileStats)
      } as R
      break
    }
  }

  ;(response as CompleteBackendResponse<C>).id = message.id

  return response as CompleteBackendResponse<C>
}