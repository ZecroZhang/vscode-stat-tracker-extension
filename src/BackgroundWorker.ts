import vscode from "vscode"
import { performance } from "perf_hooks"
import { Edits } from "./structs/Edits"
import { UsageTime } from "./structs/UsageTime"
import { NetAddRemove } from "./structs/NetAddRemove"
import { GetConfig } from "./helper/GetConfig"

// Most of the updating of progress storage happens here. 
let lastSaveTime: number = Date.now()
const sessionStartTime: number = Date.now()

let totalEdits = new Edits()
let lastCheck = Date.now()

let currentLanguage: string = "none"
let stopWatchReference: vscode.StatusBarItem

/**
 * Single use function for initialization 
 * @param stopwatch Stop watch object from the status bar. 
 * @param inputCurrentLanguage Current coding language of the editor. 
 */
export async function SetUpStopwatch (stopwatch: vscode.StatusBarItem, inputCurrentLanguage: string) {
  stopWatchReference = stopwatch
  currentLanguage = inputCurrentLanguage // We sorta need this global for the stopwatch to work. 

  // Set it up only if it's enabled.
  if (!GetConfig("accessories.showStatusBarClock")) {
    return
  }

  stopwatch.name = "stopwatch"
  stopwatch.command = "zecrosUtility.viewProgress"
  stopwatch.show()

  // This updates the time for the first min(seconds display)
  while (Date.now() - sessionStartTime < 60000) {
    UpdateStopWatch(stopwatch)
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  // Updates the time after 1m and seconds are no longer shown. 
  while (true) {
    if (Date.now()-lastCheck > 120000) {
      // Sleep time won't be included now. For testing, it'll give a notif from the sleep.
      lastSaveTime = Date.now() - 60000
      vscode.window.showInformationMessage(`Welcome back! There's an exciting journey ahead of us.`)
    }
    lastCheck = Date.now()

    UpdateStopWatch(stopwatch)

    // UpdateDTAndSave(vscode.window.state.focused, currentLanguage)
    await new Promise(resolve => setTimeout(resolve, 60000))
  }
}

function UpdateStopWatch (stopwatch: vscode.StatusBarItem) {
  if (Date.now() - sessionStartTime < 60000) {
    stopwatch.text = `⏱${Math.floor((Date.now() - sessionStartTime) / 1000)}s`
  } else {
    stopwatch.text = `⏱${ReturnTime(Date.now() - sessionStartTime)}`
  }

  // stopwatch.text += ` - ${currentLanguage}`
}

export function UpdateStopwatchLanguage (inputCurrentLanguage: string) {
  currentLanguage = inputCurrentLanguage
  UpdateStopWatch(stopWatchReference)
}

function ReturnTime (time: number) {
  let min = Math.floor(time / 60000)
  let hours = Math.floor(min / 60)
  min = min % 60
  return hours > 0 ? `${hours}h ${min}m` : `${min}m`
}

/**
 * Function called to save progress.
 * @param active if the window is in focus.
 * @param languageId id of the current language the user's using.
 * @param progressStorage storage object.
 */
export function UpdateDateTimeAndSave(active: boolean, languageId: string, progressStorage: UsageTime) {
  let toAdd = Date.now() - lastSaveTime
  lastSaveTime = Date.now()

  // It doesn't make sense for todayTime to be undefined. 
  if (progressStorage.todayTime.resets! < Date.now() - 60000) {
    progressStorage.todayTime.reset(86400000 + Date.now())
  }
  if (progressStorage.weeklyTime.resets! < Date.now() - 60000) {
    progressStorage.weeklyTime.reset(604800000 + Date.now())
  }

  // Get the current project.
  let projectPath = vscode.workspace.workspaceFolders?.[0]?.uri?.path

  // Updates Code Time
  progressStorage.updateCodeTime(toAdd, languageId, active, projectPath)

  // bulk characters from copy and paste and other sources are discarded. 
  if (totalEdits.characters.added > 10000 || totalEdits.characters.removed > 20000 || totalEdits.lines.added > 500 || totalEdits.lines.removed > 100) {
    totalEdits = new Edits()
  }

  // Add the edits
  progressStorage.updateEdits(totalEdits, languageId, projectPath)

  // Reset all of them. 
  totalEdits.clear()

  progressStorage.save()
}

let lastCharacterTyped = performance.now()

/**
 * Function for updating stats as the document is edited. 
 * @param editor current active editor 
 */
export function DocumentEdit (editor: vscode.TextDocumentChangeEvent, progressStorage: UsageTime) {
  // Updates the non bulk total characters.
  if (editor.contentChanges.length == 1) {
    if (editor.contentChanges[0].text.length == 0 && editor.contentChanges[0].rangeLength < 3) {
      totalEdits.charactersWB.net --
      totalEdits.charactersWB.removed ++
    } else if (editor.contentChanges[0].text.length < 3 && editor.contentChanges[0].rangeLength == 0) {
      totalEdits.charactersWB.net ++
      totalEdits.charactersWB.added ++

      // WPM stats won't be counting deleting sadly
      progressStorage.addToWPM(performance.now() - lastCharacterTyped)
      lastCharacterTyped = performance.now()

    }
  }

  let bulkLines = new NetAddRemove(), bulkCharacters = new NetAddRemove()
  // Updates total characters and lines. 
  for (let c = 0; c < editor.contentChanges.length; c++) {
    // Update the lines if it's not a single line edit. 
    if (!editor.contentChanges[0].range.isSingleLine) {
      bulkLines.removed += Math.abs(editor.contentChanges[0].range.end.line - editor.contentChanges[0].range.start.line)
      bulkLines.net -= Math.abs(editor.contentChanges[0].range.end.line - editor.contentChanges[0].range.start.line)
    }

    // Update the characters. 
    if (editor.contentChanges[c].text.length == 0) {
      bulkCharacters.net -= editor.contentChanges[c].rangeLength
      bulkCharacters.removed += editor.contentChanges[c].rangeLength
    } else {
      bulkCharacters.added += editor.contentChanges[c].text.length
      bulkCharacters.removed += editor.contentChanges[c].rangeLength
      bulkCharacters.net += editor.contentChanges[c].text.length - editor.contentChanges[c].rangeLength
      let newLines = 0
      for (let i of editor.contentChanges[c].text) {
        if (i == "\n") newLines++
      }
      bulkLines.added += newLines
      bulkLines.net += newLines
    }
  }

  // Discards if there's more than 100 characters or 10 lines this update ;)
  if (bulkCharacters.added > 100 || bulkCharacters.removed > 100 || bulkLines.added > 10 || bulkLines.removed > 10) {

  } else {
    totalEdits.lines.combine(bulkLines)
    totalEdits.characters.combine(bulkCharacters)
  }
}