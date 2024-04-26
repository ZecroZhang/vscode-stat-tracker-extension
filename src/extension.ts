import path from "path"
// Imports
import vscode from "vscode"
import { DocumentEdit, SetUpStopwatch, UpdateDateTimeAndSave, UpdateStopwatchLanguage } from "./BackgroundWorker"
import { GetMessageResponse, WebpageHTML } from "./WebviewHandler"
import { WordCountDocumentChange, CountWords, InitWordCounter, UpdateWordCount, UpdateSelectionWordCount } from "./WordCounter"
import { UsageTime } from "./structs/UsageTime"
import { ProjectStats } from "./structs/ProjectStats"
import { IsTrackingStats } from "./helper/GetConfig"

// This might be undefined, but shouldn't by the time we use it. They get defined the moment the extension is activated...
export let globalContext: vscode.ExtensionContext
let progressStorage: UsageTime

let currentLanguage: string

export function activate (context: vscode.ExtensionContext) {
  try {
    // Set up the globals...
    currentLanguage = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.languageId : "none"
    globalContext = context
    progressStorage = new UsageTime(context, context.globalState.get("progressStorage"))
    console.log("Congratulations, your extension \"zecrosUtility\" is activating.")

    // Register the commands. 
    context.subscriptions.push(vscode.commands.registerCommand("zecrosUtility.deleteProgress", () => {
      // Deletes everything. 
      progressStorage = new UsageTime(context)
      progressStorage.save(true)
      
      vscode.window.showInformationMessage("Progress Deleted.")
    }))

    context.subscriptions.push(vscode.commands.registerCommand("zecrosUtility.deleteCLData", () => {
      // Clears coding language data 
      progressStorage.deleteAllLanguageData()
      progressStorage.save(true)

      vscode.window.showInformationMessage("Language Stat Data Deleted.")
    }))

    context.subscriptions.push(vscode.commands.registerCommand("zecrosUtility.countStats", () => {
      const currentDocument = vscode.window.activeTextEditor?.document

      if (!currentDocument) {
        vscode.window.showInformationMessage("You need to have an text editor open to use this command.")
        return
      }

      // works on file names too :)
      const fileName = ProjectStats.FolderFromPath(currentDocument.fileName)

      const text = currentDocument.getText()
      const words = CountWords(text)
      const lines = text.match(/\n/g)?.length ?? 1 // I don't think you can have an editor with 0 lines. Since empty still shows 1 line.
      const charactersIgnoringWhitespace = text.match(/\S/g)?.length ?? 0

      vscode.window.showInformationMessage(`${fileName}:\nLines: ${lines}\nCharacters: ${text.length}\nCharacters(excluding whitespace): ${charactersIgnoringWhitespace}\nWords: ${words}`, { modal: true })
    }))

    // Webview for progress link.
    const scriptLink = vscode.Uri.file(path.join(context.extensionPath, "out", `webview.js`))

    const stylesLinks = [
      vscode.Uri.file(path.join(context.extensionPath, "src", "../ProgressWebview/styles.css")),
      vscode.Uri.file(path.join(context.extensionPath, "src", "../ProgressWebview/darkTheme.css")),
      vscode.Uri.file(path.join(context.extensionPath, "src", "../ProgressWebview/lightTheme.css")),
    ]

    const iconLink = vscode.Uri.file(path.join(context.extensionPath, "src", "log.png"))
    context.subscriptions.push(vscode.commands.registerCommand("zecrosUtility.viewProgress", () => {
      // Creates the panel 
      const panel = vscode.window.createWebviewPanel("viewProgress", "View Progress", vscode.ViewColumn.One, { enableScripts: true, localResourceRoots: [ vscode.Uri.joinPath(context.extensionUri, "ProgressWebview"), vscode.Uri.joinPath(context.extensionUri, "out") ] })
      panel.webview.html = WebpageHTML(
        panel.webview.asWebviewUri(scriptLink),
        stylesLinks.map(stylesLink => panel.webview.asWebviewUri(stylesLink)),
        panel.webview.asWebviewUri(iconLink)  
      )
       
      panel.webview.onDidReceiveMessage(message => {
        let response = GetMessageResponse(message, progressStorage)
        panel.webview.postMessage(response)
      })
    }))

    let stopwatch = vscode.window.createStatusBarItem("stopwatch", 2, 0)
    SetUpStopwatch(stopwatch, currentLanguage)

    // Set up the word counter
    InitWordCounter(vscode.window.activeTextEditor?.document?.languageId || "none", vscode.window.activeTextEditor?.document)

    vscode.window.onDidChangeWindowState(window => {
      if (IsTrackingStats()) {
        UpdateDateTimeAndSave(window.focused, currentLanguage, progressStorage)
      }
    })

    vscode.window.onDidChangeActiveTextEditor(editor => {
      // Update it before changing the language so that it doesn't assign the new language instead of the old one. 
      if (IsTrackingStats()) {
        UpdateDateTimeAndSave(true, currentLanguage, progressStorage)
      }

      currentLanguage = editor ? editor.document.languageId : "none"

      UpdateStopwatchLanguage(currentLanguage)

      // fn hides if the editor is null.
      WordCountDocumentChange(currentLanguage, editor?.document)
    })
    
    vscode.workspace.onDidChangeTextDocument(editor => {
      UpdateWordCount(editor.document)

      if (IsTrackingStats()) {
        DocumentEdit(editor, progressStorage)
      }
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
  // make sure stats are saved before closing. 
  progressStorage.save(true)
}