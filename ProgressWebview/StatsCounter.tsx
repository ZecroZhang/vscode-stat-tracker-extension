//<reference path="progressWebview.js"/>

/**
 * This file is used to count lines of code and give stats 
 */

//imports
import React from "react"
import ReactDOM from "react-dom"

import { AwaitMessage } from "./MessageHandler"
import { ErrorResponse, FileStatsInfo, JSONResponse, ProjectResponse } from "../shared/MessageTypes"
import { CreateLineInput } from "./Utility"

/**
 * Sets up the stat counter(at the bottom), and event listeners for this to work. 
 */
export async function SetUpStatsCounter () {
  //The HTML will be rendered for this at the end.
  const progressCounterDiv = document.getElementById("progressCounter") as HTMLDivElement

  let progressCounterData = (
    <>
      { CreateLineInput("Project Path: ", <textarea className="smallLineInputTextarea textLine" id="projectPathInput"></textarea>) }
      { CreateLineInput("Allowed File Extensions: ", <textarea className="smallLineInputTextarea textLine" id="allowedFileExt"></textarea>) }
      { CreateLineInput("Ignored File/Folder Names: ", <textarea className="smallLineInputTextarea textLine" id="ignoreFileFolderInput"></textarea>) }

      <div>
        <button id="scanCodeButton">Scan</button>
        <div id="scannedCodeResultDiv"></div>
      </div>
    </>
  )

  ReactDOM.render(progressCounterData, progressCounterDiv)
  
  //The file/folder names which will be ignored or allowed. 
  const ignoredFileFolders: Set<string> = new Set([ "node_modules", ".git" ])
  const allowedFileFolders: Set<string> = new Set([ ".js" ])

  let projectPathInput = document.getElementById("projectPathInput") as HTMLTextAreaElement //Textarea for the user to enter the project path.
  let ignoreFileFolderInput = document.getElementById("ignoreFileFolderInput") as HTMLTextAreaElement // We ignore these folders/files.
  let allowedFileFoldersInput = document.getElementById("allowedFileExt") as HTMLTextAreaElement

  let scanCodeButton = document.getElementById("scanCodeButton") as HTMLButtonElement //Button to start scanning. 
  let scannedCodeResultDiv = document.getElementById("scannedCodeResultDiv") as HTMLDivElement //Scan button is here and the results show here.

  var projectPath = (await AwaitMessage({ command: "projectPath" }) as JSONResponse).data

  if (projectPath) {
    projectPathInput.value = projectPath // Assign it to the project path if there is a value.
  }

  //load the current project. 
  let project = await AwaitMessage({ command: "currentProject" }) as ProjectResponse

  //this should stop the case of no project info too 
  if (!project.project || !project.info) {
    ReactDOM.render(<div>The project stats counter is only supported within projects currently. <br/> Open a folder to enable this feature. </div>, progressCounterDiv)
    return 
  }

  let projectInfo = project.info

  //add the project 
  for (let name of projectInfo.search.ignoredFileFolderNames) {
    ignoredFileFolders.add(name)
  }
  ignoreFileFolderInput.value = Array.from(ignoredFileFolders.values()).join(", ")

  for (let name of projectInfo.search.allowedFileExtensions) {
    allowedFileFolders.add(name)
  }
  allowedFileFoldersInput.value = Array.from(allowedFileFolders.values()).join(", ")

  //Scanner
  let scanningFiles = false
  scanCodeButton.addEventListener("click", async () => {
    //We only want one instance of it processing at once. 
    if (scanningFiles) {
      return
    }
    scanningFiles = true 
    
    function SetScannedResult (html: React.FunctionComponentElement<any>) {
      ReactDOM.render(html, scannedCodeResultDiv)

    }

    //Grab the project path. The user may have changed it. 
    let projectPath = projectPathInput.value
    if (!projectPath) {
      //Tell the user to input a value
      scanningFiles = false

      SetScannedResult(<div className="redText">You need to enter a project path.</div>)
      return 
    }
    
    //For setting the allowed/ignored based on the user input. 
    function IASet (input: HTMLTextAreaElement, iAFileFolder: Set<string>) {
      let items = input.value.split(/,/g).map(i => i.trim()).filter(i => i.length)

      iAFileFolder.clear()
      
      for (let name of items) {
        iAFileFolder.add(name)
      }

      return items
    }

    /**
     * String of allowed file names/file endings. 
     */
    var allowed: string[] = IASet(allowedFileFoldersInput, allowedFileFolders)
  
    /**
     *  String of the ignored file/folder names. 
     */
    var ignored: string[] = IASet(ignoreFileFolderInput, ignoredFileFolders)
  
    //Update the storage for the allowed and ignored names. 
    await AwaitMessage({
      command: "updateIANames",
      allowedFileFolders: Array.from(allowedFileFolders.values()),
      ignoredFileFolders: Array.from(ignoredFileFolders.values())
    })
    
    //Scan the files. 
    SetScannedResult(<div>Scanning...</div>)
  
    let progressData = await AwaitMessage({ command: "scanLines", path: projectPath, allowedFileFolders: allowed, ignoredFileFolders: ignored }) as FileStatsInfo | ErrorResponse
    
    if ((progressData as ErrorResponse).error) {
      SetScannedResult(<div className="redText">{ (progressData as ErrorResponse).errorMessage }</div>)
    } else {
      progressData = progressData as FileStatsInfo
      
      SetScannedResult(
        <>
          <div>Results:</div>
          <div>Total Lines: {progressData.lines}</div>
          <div>Total Characters: {progressData.characters}</div>
          <div>Files: {progressData.files}</div>
          <div>Folders: {progressData.folders}</div>
        </>
      )
    }

    scanningFiles = false
  
    //Scroll to bottom of page. 
    window.scrollTo(0, document.body.scrollHeight)
  })
}