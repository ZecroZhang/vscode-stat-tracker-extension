/**
 * This file is used to count lines of code and give stats 
 */

// imports
import React from "react"
import ReactDOM from "react-dom"

import { AwaitMessage } from "./MessageHandler"
import { CreateLineInput } from "./utility"

/**
 * Sets up the stat counter(at the bottom), and event listeners for this to work. 
 */
export async function SetUpStatsCounter () {
  // The HTML will be rendered for this at the end.
  const progressCounterDiv = document.getElementById("progressCounter") as HTMLDivElement

  // Show the user if files are being ignored.
  let ignoreFiles = await AwaitMessage({ command: "getSearchIgnores" })

  let progressCounterData = (
    <>
      { CreateLineInput("Project Path: ", <textarea className="smallLineInputTextarea textLine" id="projectPathInput"></textarea>) }
      { CreateLineInput("Allowed File Extensions: ", <textarea className="smallLineInputTextarea textLine" id="allowedFileExt"></textarea>) }
      { CreateLineInput("Ignored File/Folder Globs: ", <textarea className="smallLineInputTextarea textLine" id="ignoreFileFolderInput"></textarea>) }

      <div id="ignoreFileFolderInfoContainer">
        {
          ignoreFiles.ignoredGitignore ? <div style={{ fontStyle: "italic" }}>Also ignoring files specified in .gitignore</div> : <></>
        }
        {
          ignoreFiles.ignoreVscodeIgnore ? <div style={{ fontStyle: "italic" }}>Also ignoring files specified in .vscodeignore</div> : <></>
        }
      </div>

      <div>
        <button id="scanCodeButton">Scan</button>
        <div id="scannedCodeResultDiv"></div>
      </div>
    </>
  )

  ReactDOM.render(progressCounterData, progressCounterDiv)
  
  // The file/folder names which will be ignored or allowed. 
  const ignoredFileFolders: Set<string> = new Set([ "node_modules", ".git" ])
  const allowedFileFolders: Set<string> = new Set([ ".js" ])

  let projectPathInput = document.getElementById("projectPathInput") as HTMLTextAreaElement // Textarea for the user to enter the project path.
  let ignoreFileFolderInput = document.getElementById("ignoreFileFolderInput") as HTMLTextAreaElement // We ignore these folders/files.
  let allowedFileFoldersInput = document.getElementById("allowedFileExt") as HTMLTextAreaElement

  let scanCodeButton = document.getElementById("scanCodeButton") as HTMLButtonElement // Button to start scanning. 
  let scannedCodeResultDiv = document.getElementById("scannedCodeResultDiv") as HTMLDivElement // Scan button is here and the results show here.

  let projectPath = await AwaitMessage({ command: "projectPath" })

  if (!projectPath.error) {
    projectPathInput.value = projectPath.path // Assign it to the project path if there is a value.
  }

  // load the current project. 
  let project = await AwaitMessage({ command: "currentProject", timeRange: "allTime" })

  // this should stop the case of no project info too 
  if (project.error) {
    ReactDOM.render(<div>The project stats counter is only supported within projects currently. <br/> Open a folder to enable this feature. </div>, progressCounterDiv)
    return 
  }

  let projectInfo = project.info

  // Set it to default, if never used.
  if (projectInfo.search.isDefaultIA) {
    const { allowed, ignored } = await AwaitMessage({ command: "getDefaultIA" })
    projectInfo.search.ignoredFileFolderNames = ignored
    projectInfo.search.allowedFileExtensions = allowed

  }

  // add the project 
  for (let name of projectInfo.search.ignoredFileFolderNames) {
    ignoredFileFolders.add(name)
  }
  ignoreFileFolderInput.value = Array.from(ignoredFileFolders.values()).join(", ")

  for (let name of projectInfo.search.allowedFileExtensions) {
    allowedFileFolders.add(name)
  }
  allowedFileFoldersInput.value = Array.from(allowedFileFolders.values()).join(", ")

  // Scanner
  let scanningFiles = false
  scanCodeButton.addEventListener("click", async () => {
    // We only want one instance of it processing at once. 
    if (scanningFiles) {
      return
    }
    scanningFiles = true 
    
    function SetScannedResult (html: React.FunctionComponentElement<any>) {
      ReactDOM.render(html, scannedCodeResultDiv)

    }

    // Grab the project path. The user may have changed it. 
    let projectPath = projectPathInput.value
    if (!projectPath) {
      // Tell the user to input a value
      scanningFiles = false

      SetScannedResult(<div className="redText">You need to enter a project path.</div>)
      return 
    }
    
    // For setting the allowed/ignored based on the user input. 
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
    let allowed: string[] = IASet(allowedFileFoldersInput, allowedFileFolders)
  
    /**
     *  String of the ignored file/folder names. 
     */
    let ignored: string[] = IASet(ignoreFileFolderInput, ignoredFileFolders)
  
    // Update the storage for the allowed and ignored names. 
    await AwaitMessage({
      command: "updateIANames",
      allowedFileFolders: Array.from(allowedFileFolders.values()),
      ignoredFileFolders: Array.from(ignoredFileFolders.values())
    })
    
    // Scan the files. 
    SetScannedResult(<div>Scanning...</div>)
  
    let progressData = await AwaitMessage({ command: "scanLines", path: projectPath, allowedFileFolders: allowed, ignoredFileFolders: ignored })
    
    if (progressData.error) {
      SetScannedResult(<div className="redText">{ progressData.errorMessage }</div>)
    } else {
      SetScannedResult(
        <>
          <div>Results:</div>
          <div>Total Lines: {progressData.lines}</div>
          <div>Total Characters: {progressData.characters}</div>
          <div>Files: {progressData.files}</div>
          <div>Folders: {progressData.folders}</div>
          {
            progressData.hasUnreachableFiles ? <div className="redText">This directory contains unreachable files/folders which were not counted.</div> : <></>
          }
        </>
      )
    }

    scanningFiles = false
  
    // Scroll to bottom of page. 
    window.scrollTo(0, document.body.scrollHeight)
  })
}