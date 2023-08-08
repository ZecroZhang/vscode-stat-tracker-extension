import * as vscode from "vscode"
import { ProjectStats, TimeAllocation, UsageTime, TimeRangeNames } from "./Structures"

import { AllProjectInfo, BackendResponse, MergeProjectCommand, ScanLinesCommand, ServerCommand, UpdateIACommand, UpdateProjectNameCommand, UpdateUsageCommand } from "../shared/MessageTypes"
import { ErrorCode, GroupFileStats, LinesOfCode } from "./StatFinder"

export interface ProgressViewMessagePost {
  [ key: string ]: any

  id: number,
  date?: Date,
  html?: any, //It's supposed to be a string but, I can't get the multi-type function to work for this. 
  data?: any
}

/**
 * 
 * @param scriptLink 
 * @param stylesLinks Array order: styles.css, darkTheme.css, lightTheme.css
 */
export function WebpageHTML (scriptLink: vscode.Uri, stylesLinks: Array<vscode.Uri>, iconLink: vscode.Uri): string {
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
 * @param progressStorage 
 * @returns Array of tuples(language name, coding language). It may be sized `amount+1`, with the last item representing all other languages. **Only time is saved as of right now.**
 */
function TopLanguages (progressStorage: UsageTime, id: number, amount?: number) {
  //Currently for allTime and sorted by time. These will be modifiable later. 
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
  //Cut out the others. 
  sortedLanguages = sortedLanguages.slice(0, amount)

  let otherLanguage = null
  //Return the top `amount` languages + an other
  if (otherTime.totalTime > 0) {
    otherLanguage = {
      amount: otherLanguageCount, 
      time: otherTime
    }
  }

  return {
    id,
    data: sortedLanguages,
    otherLanguages: otherLanguage
  }
}

/**
 * Process an incoming message from the progress webview. 
 * @param message some message object 
 * @param panel vscode panel of the webview. 
 */
export function ProcessMessage <T extends ServerCommand> (message: T, panel: vscode.WebviewPanel, progressStorage: UsageTime) {
  //This is the message that is sent back to the client
  let response: BackendResponse
  let id = message.id //avoiding some redundant code. 

  /**
   * Makes sure the `type` property exists on the message and is one of the valid time ranges. 
   * @param message 
   * @returns message.type 
   */
  function GetMessageTimeType (message: any): TimeRangeNames {
    if (message.type != "allTime" && message.type != "weeklyTime" && message.type != "todayTime") {
      message.type = "allTime"
    }

    return message.type as TimeRangeNames
  }

  //Grab the data to post
  switch (message.command) {
    case "mostUsedLanguages":
      response = TopLanguages(progressStorage, id, message.amount)
      break
    case "extensionStartDate":
      response = {
        id, data: progressStorage.startTime
      }
      break
    case "statsJSONData":
      response = {
        id, data: JSON.stringify(progressStorage)
      }
      break
    case "updateUsageData":
      //This is like one where all the processing is done in the main extension instead of the webview.
      let progressTempBin = new UsageTime(null, (message as UpdateUsageCommand).json)

      progressStorage.combine(progressTempBin)
      progressStorage.save(true)
      
      response = { id, error: false }
      
      vscode.window.showInformationMessage("Combined and updated account stats. :)")
      break
    case "scanLines":
      let msg = message as ScanLinesCommand
      let codeData = LinesOfCode(msg.path, msg.allowedFileFolders, msg.ignoredFileFolders)

      if ((codeData as ErrorCode).error === true) {
        let errorCode = (codeData as ErrorCode).code
        let errorMessage: string 

        if (errorCode == 1) {
          errorMessage = "Invalid file path specified."
        } else { //Assuming error code of 0
          errorMessage = "An unknown error has occurred."
        }


        response = {
          id, error: true, errorMessage
        }
        break
      }

      response = {
        id, 
        ...(codeData as GroupFileStats)
      }
      break
    case "colourTheme":
      //Gives back the colour theme. 0 or 1 for black and white 
      let themeCode = vscode.window.activeColorTheme.kind % 2
      
      response = {
        id, data: themeCode
      }
      break
    case "progressObject": {
      let progressObject = progressStorage[message.type as TimeRangeNames]

      response = {
        id,
        data: progressObject,
        cps: progressObject.typing.cps()
      }
      break
    }
    case "currentProject":
      message.path = vscode.workspace.workspaceFolders?.[0]?.uri?.path
      //Was originally going to use a function but removing the break instead so they both have "almost" the same functionality :)
    case "getProject": {
      let timeRange = GetMessageTimeType(message)
      let projectPath = message.path

      let project = progressStorage.getProject(progressStorage[timeRange], projectPath)

      if (!projectPath || !project) {
        response = {
          id, error: true,
          errorMessage: "Invalid project path."
        }
        break
      }

      response = {
        id, project, 
        path: projectPath,
        info: progressStorage.getCurrentProjectInfo(projectPath)
      }
      break
    }
    case "projectPath": 
      //Sends over one project path. 
      var projectPaths = vscode.workspace.workspaceFolders

      if (!projectPaths) {
        response = {
          id, error: true,
          errorMessage: "There are currently no projects open."
        }
        break
      }

      response = {
        id, data: projectPaths[0].uri.fsPath 
      }
      break
    case "allProjectInfos": {
      //add the .type property for time. 
      let timeRange = GetMessageTimeType(message)

      response = {
        id, data: []
      }
      
      for (let project of progressStorage[timeRange].projects) {
        let projectInfo = progressStorage.getCurrentProjectInfo(project.path)

        ;(response as AllProjectInfo).data.push({
          name: projectInfo.name,
          path: projectInfo.path,
          time: project.timeAllocation.totalTime
        })
      }
      break
    }
    case "updateIANames": {//update ignore allow names
      let msg = message as UpdateIACommand

      let allowedFileFolders = msg.allowedFileFolders as string[]
      let ignoredFileFolders = msg.ignoredFileFolders as string[]

      //update the progressStorage      
      let projectPath = vscode.workspace.workspaceFolders?.[0]?.uri?.path

      if (!projectPath) {
        response = {
          id, error: true,
          errorMessage: "Failed to detect the current folder path."
        }
        break
      }

      let projectDetails = progressStorage.getCurrentProjectInfo(projectPath)
      
      projectDetails.search.allowedFileExtensions = allowedFileFolders
      projectDetails.search.ignoredFileFolderNames = ignoredFileFolders

      progressStorage.save()

      response = { id, error: false }
      break
    }
    case "updateProjectName": {
      let msg = message as UpdateProjectNameCommand
      let projectInfo = progressStorage.getCurrentProjectInfo(msg.path)
      
      if (!projectInfo) {
        response = {
          id, error: true,
          errorMessage: "Failed to detect project path."
        }
        break
      }

      projectInfo.name = msg.name.substring(0, 256)

      response = { id, error: false }
      break
    }
    case "mergeProjects": {
      let msg = message as MergeProjectCommand

      //The first project is the path that is kept.
      let firstProjectPath = msg.paths.shift()!
      let firstProjects: {
        [ key: string ]: ProjectStats | undefined
      } = {}

      progressStorage.forAllTimeRanges((range, identifier) => {
        firstProjects[identifier] = range.projects.find(item => item.path == firstProjectPath)
      })

      let errorMessage = ""
      for (let projectPath of msg.paths) {
        if (!progressStorage.getCurrentProjectInfo(projectPath, false)) {
          errorMessage = "The project path entered is invalid."
          break
        }

        progressStorage.forAllTimeRanges((range, identifier) => {
          let projectIndex = range.projects.findIndex(p => p.path == projectPath)
          let project = range.projects[projectIndex]

          //No project means nothing to merge with the first one, for this time range. 
          if (!project) {
            return
          }

          let firstProject = firstProjects[identifier]

          if (!firstProject) {
            //There isn't an original, so set this one as it. 
            project.path = firstProjectPath
            return
          } //otherwise, they both exist so combine.

          firstProject.combine(project, false)

          //Remove the project 
          range.projects.splice(projectIndex, 1)
        })

        progressStorage.projectInfo.delete(projectPath)
      }

      if (errorMessage) {
        response = { id, error: true, errorMessage }
      } else {
        response = { id, error: false }
      }
      break
    }
    //All cases should be exhausted. 
    // default: 
      // throw new Error(`Unknown command found from webview. ${message.command}`)
  }

  //Post the message
  panel.webview.postMessage(response)
}