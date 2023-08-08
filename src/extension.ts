"use strict"

import path = require("path")
//Imports
import * as vscode from "vscode"
import { DocumentEdit, SetUpStopwatch, UpdateDateTimeAndSave, UpdateStopwatchLanguage } from "./BackgroundWorker"
import { UsageTime } from "./Structures"
import { ProcessMessage, WebpageHTML } from "./WebviewHandler"
import { ChangeDocumentShowHideTextCount, InitWordCounter, UpdateDocumentTypeChangeWordCount, UpdateSelectionWordCount } from "./WordCounter"

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
    progressStorage = new UsageTime(context, context.globalState.get("progressStorage"))
    console.log("Congratulations, your extension \"zecrosUtility\" is activating.")

    //Register the commands. 
    context.subscriptions.push(vscode.commands.registerCommand("zecrosUtility.deleteProgress", () => {
      //Deletes everything. 
      progressStorage = new UsageTime(context)
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
    const scriptLink = vscode.Uri.file(path.join(context.extensionPath, "out", `webview.js`))

    const stylesLinks = [
      vscode.Uri.file(path.join(context.extensionPath, "src", "../ProgressWebview/styles.css")),
      vscode.Uri.file(path.join(context.extensionPath, "src", "../ProgressWebview/darkTheme.css")),
      vscode.Uri.file(path.join(context.extensionPath, "src", "../ProgressWebview/lightTheme.css")),
    ]

    const iconLink = vscode.Uri.file(path.join(context.extensionPath, "src", "log.png"))
    context.subscriptions.push(vscode.commands.registerCommand("zecrosUtility.viewProgress", () => {
      vscode.window.showInformationMessage("Opening Window...")
      
      //Creates the panel 
      const panel = vscode.window.createWebviewPanel("viewProgress", "View Progress", vscode.ViewColumn.One, { enableScripts: true, localResourceRoots: [ vscode.Uri.joinPath(context.extensionUri, "ProgressWebview"), vscode.Uri.joinPath(context.extensionUri, "out") ] })
      panel.webview.html = WebpageHTML(
        panel.webview.asWebviewUri(scriptLink),
        stylesLinks.map(stylesLink => panel.webview.asWebviewUri(stylesLink)),
        panel.webview.asWebviewUri(iconLink)  
      )
       
      panel.webview.onDidReceiveMessage(message => {
        ProcessMessage(message, panel, progressStorage)
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

export function deactivate () {
  //make sure stats are saved before closing. 
  progressStorage.save(true)
}