///<reference path="progressWebview.js"/>

/**
 * Used to count lines of code and give stats 
 */

var progressCounterDiv = document.getElementById("progressCounter")

progressCounterDiv.innerHTML =
`<div class="listItem">
  <div class="textLine">Project Path: </div>
  <textarea class="smallLineInputTextarea" id="projectPathInput" class="textLine"></textarea>
</div>

<div class="listItem">
  <div class="textLine">Allowed File Extensions: </div>
  <textarea class="smallLineInputTextarea" id="allowedFileExt" class="textLine"></textarea>
</div>

<div class="listItem">
  <div class="textLine">Ignored File/Folder Names: </div>
  <textarea class="smallLineInputTextarea" id="ignoreFileFolderInput" class="textLine"></textarea>
</div>

<div>
  <button id="scanCodeButton">Scan</button>
  <div id="scannedCodeResultDiv"></div>
</div>`

/**
 * @type { Set<string> }
 */
var ignoredFileFolders = new Set()
var ignoreFileFolderInput = document.getElementById("ignoreFileFolderInput") // We ignore these folders/files.

/**
 * @type { Set<string> }
 */
var allowedFileFolders = new Set([ ".js" ])
var allowedFileFoldersInput = document.getElementById("allowedFileExt")

var projectPathInput = document.getElementById("projectPathInput") //Textarea for the user to enter the project path.

var scanCodeButton = document.getElementById("scanCodeButton") //Button to start scanning. 
var scannedCodeResultDiv = document.getElementById("scannedCodeResultDiv") //Scan button is here and the results show here.

/**
 * @type { import("../src/Structures").ProjectStats } ProjectStats file. 
 */
var currentProject

//Set up the project path 
;(async () => {
  /** @type { string | null } */
  var projectPath = await AwaitMessage({ command: "projectPath" })

  if (projectPath) {
    projectPathInput.value = projectPath.data // Assign it to the project path if there is a value.
  }

  //load the current project. 
  /**
   * @type { pw.ProjectMessage } 
   */
  let project = await AwaitMessage({ command: "currentProject" })

  //this should stop the case of no project info too 
  if (!project.data || !project.stats) {
    return 
  }

  currentProject = project.data
  let projectInfo = project.stats

  //add the project 
  for (let name of projectInfo.search.ignoredFileFolderNames) {
    ignoredFileFolders.add(name)
  }
  ignoreFileFolderInput.value = Array.from(ignoredFileFolders.values()).join(", ")

  for (let name of projectInfo.search.allowedFileExtensions) {
    allowedFileFolders.add(name)
  }
  allowedFileFoldersInput.value = Array.from(allowedFileFolders.values()).join(", ")

})()

var scanningFiles = false
scanCodeButton.addEventListener("click", async () => {
  //We only want one instance of it processing at once. 
  if (scanningFiles) return
  scanningFiles = true 

  //Grab the project path. The user may have changed it. 
  var projectPath = projectPathInput.value
  if (!projectPath) {
    //Tell the user to input a value
    scanningFiles = false
    scannedCodeResultDiv.innerHTML = `<div class="redText">You need to enter a project path.</div>`
    return 
  }

  /**
   * @type { Array<string> } string of allowed file names/file endings. 
   */
  var allowed = allowedFileFoldersInput.value.split(/,/g).map(i => i.trim()).filter(i => i.length)
  for (let name of allowed) {
    allowedFileFolders.add(name)
  }

  /**
   * @type { Array<string> } String of the ignored file/folder names. 
   */
  var ignored = ignoreFileFolderInput.value.split(/,/g).map(i => i.trim()).filter(i => i.length)
  for (let name of ignored) {
    ignoredFileFolders.add(name)
  }

  //Update the storage for the allowed and ignored names. 
  await AwaitMessage({ command: "updateIANames", allowedFileFolders: Array.from(allowedFileFolders.values()), ignoredFileFolders: Array.from(ignoredFileFolders.values()) })
  
  //Scan the files. 
  scannedCodeResultDiv.innerHTML = `<div>Scanning...</div>`

  var progressData = await AwaitMessage({ command: "scanLines", path: projectPath, allowed, ignored })

  if (progressData.error) {
    /**
     * Check for errors. Codes: 
     * 1 : invalid path. 
     */
    var errorText 
    switch (progressData.code) {
      case 1: 
        errorText = "Invalid starting folder path."
        break
      default:
        errorText = "An unknown error happened..." 
        break
    }

    scannedCodeResultDiv.innerHTML = `<div class="redText">${errorText}</div>`
  } else {
    scannedCodeResultDiv.innerHTML = `<div>Results:</div>
    <div>Total Lines: ${progressData.data.lines}</div>
    <div>Total Characters: ${progressData.data.characters}</div>
    <div>Files: ${progressData.data.files}</div>
    <div>Folders: ${progressData.data.folders}</div>`

  }
   
  scanningFiles = false

  //Scroll to bottom of page. 
  window.scrollTo(0, document.body.scrollHeight)
})