"use strict"

import path = require("path")
//Imports
import * as vscode from "vscode"
import { DocumentEdit, SetUpStopwatch, UpdateDateTimeAndSave, UpdateStopwatchLanguage } from "./BackgroundWorker"
import { UsageTime } from "./Structures"
import { FindAndReturnTopLanguages, ProgressObject, ProgressViewMessagePost, WebpageHTML } from "./ViewProgressHandler"
import { ChangeDocumentShowHideTextCount, InitWordCounter, UpdateDocumentTypeChangeWordCount, UpdateSelectionWordCount } from "./WordCounter"
import { LinesOfCode } from "./StatFinder"
import { MsToTime } from "./functions"

export const debugging = true

//This might be undefined, but shouldn't by the time we use it. They get defined the moment the extension is activated...
export var globalContext: vscode.ExtensionContext
var progressStorage: UsageTime

var currentLanguage: string

//export default globalContext, sessionStartTime, lastSaveTime, progressStorage, currentLanguage

export function activate (context: vscode.ExtensionContext) {
  try {
    //Set up the globals...
    currentLanguage = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.languageId : "none"
    globalContext = context
    progressStorage = new UsageTime(context.globalState.get("progressStorage"))
    console.log("Congratulations, your extension \"zecrosUtility\" is activating.")

    //Register the commands. 
    context.subscriptions.push(vscode.commands.registerCommand("zecrosUtility.deleteProgress", () => {
      //Deletes everything. 
      progressStorage = new UsageTime()
      progressStorage.save(true)
      
      vscode.window.showInformationMessage("Progress Deleted.")
    }))

    context.subscriptions.push(vscode.commands.registerCommand("zecrosUtility.deleteCLData", () => {
      //Clears coding language data 
      progressStorage.deleteAllLanguageData()
      progressStorage.save(true)

      vscode.window.showInformationMessage("Language Stat Data Deleted.")
    }))

    //Webview for progress link.
    const scriptLinks = [
      "functions",
      "messageHandler",
      "HTMLBuilder",
      "progressWebview",
      "pieChart",
      "statsCounter"
    ].map(item => vscode.Uri.file(path.join(context.extensionPath, "src", `../ProgressWebview/${item}.js`)))

    const stylesLinks = [
      vscode.Uri.file(path.join(context.extensionPath, "src", "../ProgressWebview/styles.css")),
      vscode.Uri.file(path.join(context.extensionPath, "src", "../ProgressWebview/darkTheme.css")),
      vscode.Uri.file(path.join(context.extensionPath, "src", "../ProgressWebview/lightTheme.css")),
    ]
    context.subscriptions.push(vscode.commands.registerCommand("zecrosUtility.viewProgress", () => {
      vscode.window.showInformationMessage("Opening Window...")
      
      //Creates the panel 
      const panel = vscode.window.createWebviewPanel("viewProgress", "View Progress", vscode.ViewColumn.One, { enableScripts: true, localResourceRoots: [ vscode.Uri.joinPath(context.extensionUri, "src",  "../ProgressWebview") ] })
      
      panel.webview.html = WebpageHTML(scriptLinks.map(scriptLink => panel.webview.asWebviewUri(scriptLink)), stylesLinks.map(stylesLink => panel.webview.asWebviewUri(stylesLink)))
       
      panel.webview.onDidReceiveMessage(message => {
        ProcessMesssage(message, panel)
      })
    }))

    var stopwatch = vscode.window.createStatusBarItem("stopwatch", 2, 0)
    SetUpStopwatch(stopwatch, currentLanguage)

    //Set up the word counter
    InitWordCounter(vscode.window.activeTextEditor?.document?.languageId || "none", vscode.window.activeTextEditor?.document)

    //Did change states
    vscode.window.onDidChangeWindowState(window => {
      UpdateDateTimeAndSave(window.focused, currentLanguage, progressStorage, globalContext)
    })

    //when the editor changes. 
    vscode.window.onDidChangeActiveTextEditor(editor => {
      //Update it before changing the language so that it doesn't assign the new language instead of the old one. 
      UpdateDateTimeAndSave(true, currentLanguage, progressStorage, globalContext)

      currentLanguage = editor ? editor.document.languageId : "none"

      UpdateStopwatchLanguage(currentLanguage)
      if (editor) {
        ChangeDocumentShowHideTextCount(currentLanguage, editor.document)
      }

    })

    //When new characters get typed. 
    vscode.workspace.onDidChangeTextDocument(editor => {

      UpdateDocumentTypeChangeWordCount(editor.document)
      DocumentEdit(editor, progressStorage)
      
    })

    vscode.window.onDidChangeTextEditorSelection(async editor => {
      UpdateSelectionWordCount(currentLanguage, editor)
    })


  } catch (err) {
    console.error(err)
    vscode.window.showErrorMessage(`The extension stopped working.\n${err}`)
  }
}

/**
 * Process an incoming message from the progress webview. 
 * @param message some message object 
 * @param panel vscode panel of the webview. 
 */
function ProcessMesssage (message: any, panel: vscode.WebviewPanel) {
  var messageToPost: ProgressViewMessagePost = {
    id: message.id
  }
  
  /**
   * Makes sure the `type` property exists on the message and is one of the valid timeranges. 
   * @param message 
   * @returns message.type 
   */
  function GetMessageTimeType (message: any): "allTime" | "weeklyTime" | "todayTime" {
    if (message.type != "allTime" && message.type != "weeklyTime" && message.type != "todayTime") {
      message.type = "allTime"
    } 

    return message.type
  }

  //Grab the data to post
  switch (message.command) {
    case "mostUsedLanguages":
      messageToPost.html = FindAndReturnTopLanguages(message.amount, false, progressStorage)
      break
    case "mostUsedLanguagesJSON":
      messageToPost.data = FindAndReturnTopLanguages(message.amount, true, progressStorage)
      break
    case "progressObject":
      {
        //set it to all time if it's not. 
        let timeRange = GetMessageTimeType(message)

        //modifies the message to post object and adds the stats. 
        ProgressObject(messageToPost, progressStorage[timeRange])
      }
      break
    case "extensionStartDate":
      messageToPost.date = new Date(progressStorage.startTime)
      break
    case "statsJSONData":
      messageToPost.data = progressStorage
      break
    case "updateUsageData":
      //This is like one where all the processing is done in the main extension instead of the webview.
      var progressTempBin = new UsageTime(message.data)

      progressStorage.combine(progressTempBin)
      progressStorage.save(true)
      messageToPost.complete = true
      
      vscode.window.showInformationMessage("Combined and updated account stats. :)")
      break
    case "scanLines": 
      messageToPost.data = LinesOfCode(message.path, message.allowed, message.ignored)
      break
    case "colourTheme":
      //Gives back the colour theme. 0 or 1 for black and white 
      var themeCode = vscode.window.activeColorTheme.kind % 2

      messageToPost.data = themeCode
      break
    case "currentProject":
      message.path = vscode.workspace.workspaceFolders?.[0]?.uri?.path
      //Was originally going to use a function but removing the break instead so they both have "almost" the same functionality :)
    case "getProject": 
      {
        let timeRange = GetMessageTimeType(message)

        let projectPath = message.path
        let project = progressStorage.getProject(progressStorage[timeRange], projectPath)

        if (projectPath && project) {
          messageToPost.data = project

          messageToPost.activeTime = MsToTime(project.timeAllocation.activeTime)
          messageToPost.totalTime = MsToTime(project.timeAllocation.totalTime)
          
          messageToPost.stats = progressStorage.getCurrentProjectInfo(projectPath)
        } else {
          messageToPost.data = null
        }
      }
      break
    case "projectPath": 
      //Sends over one project path. 
      var projectPaths = vscode.workspace.workspaceFolders

      messageToPost.data = projectPaths ? projectPaths[0].uri.fsPath : null 
      break
    case "allProjectInfos":
      {
        //add the .type property for time. 
        let timeRange = GetMessageTimeType(message)
        
        messageToPost.data = []
        
        for (let project of progressStorage[timeRange].projects) {
          let projectInfo = progressStorage.getCurrentProjectInfo(project.path)

          messageToPost.data.push({
            name: projectInfo.name,
            path: projectInfo.path,
            time: project.timeAllocation.totalTime
          })
        }
      }
      break
    case "updateIANames": //update ignore allow names
      let allowedFileFolders = message.allowedFileFolders as string[]
      let ignoredFileFolders = message.ignoredFileFolders as string[]

      //update the progressStorage
      {
        let projectPath = vscode.workspace.workspaceFolders?.[0]?.uri?.path

        if (projectPath) {
          let projectDetails = progressStorage.getCurrentProjectInfo(projectPath)
          
          projectDetails.search.allowedFileExtensions = allowedFileFolders
          projectDetails.search.ignoredFileFolderNames = ignoredFileFolders

          progressStorage.save()
        }
      }

      messageToPost.data = true
      break
    default: 
      messageToPost.error = "unknownCommand"
  }
  //Post the message
  panel.webview.postMessage(messageToPost)
}

export function deactivate () {
  //make sure stats are saved before closing. 
  progressStorage.save(true)
}