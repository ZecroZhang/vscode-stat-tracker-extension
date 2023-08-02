import * as vscode from "vscode"
import { MsToTime } from "./functions"
import { TimeRange, UsageTime } from "./Structures"

export interface ProgressViewMessagePost {
  [ key: string ]: any

  id: number,
  date?: Date,
  html?: any, //It's supposed to be a string but, I can't get the multitype function to work for this. 
  data?: any
}

/**
 * 
 * @param scriptLink Array order: function.js, progressWebview.js, pieChart.js, progressCounter.js
 * @param stylesLink Array order: styles.css, darkTheme.css, lightTheme.css
 */
export function WebpageHTML (scriptLink: Array<vscode.Uri>, stylesLink: Array<vscode.Uri>): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Compiled function script -->
  <script src="${scriptLink[0]}"></script>

  <script src="${scriptLink[1]}" defer></script>
  <script src="${scriptLink[2]}" defer></script>
  <script src="${scriptLink[3]}" defer></script>
  <script src="${scriptLink[4]}" defer></script>
  <script src="${scriptLink[5]}" defer></script>
  <link rel="stylesheet" href="${stylesLink[0]}" />
  <link id="darkThemeStyleSheet" rel="stylesheet" href="${stylesLink[1]}" disabled />
  <link id="lightThemeStyleSheet" rel="stylesheet" href="${stylesLink[2]}" disabled />
<head>
<body>
  <div class="backgroundContainer mainTitle">
    <div class="titleBlock">Progress Stats</div>
  </div>
  <div class="backgroundContainer" id="progressContainers">
    <div class="containerDiv"> 
      <div id="todayProgressDiv" class=""></div>
      <div id="weeklyProgressDiv" class="mainDiv"></div>
      <div id="totalProgressDiv" class="mainDiv"></div>
      <div id="projectProgress" class="mainDiv"></div>
      <div id="otherInfo" class="mainDiv"></div>
      <div id="controlDiv" class="mainDiv"></div>
    </div>
  </div>

  <div class="backgroundContainer mainTitle">
    <div class="titleBlock">Stat Counter</div> 
  </div>
  <div class="backgroundContainer">
    <div id="progressCounter" class="mainDiv containerDiv"></div>
  </div>
</body>`
}

export function FindAndReturnTopLanguages (number: number, onlyJSON: boolean, progressStorage: UsageTime) {
  //Type is for the return value. They will always be storted by time. 
  var sortedLanguages = Array.from(Object.entries(progressStorage.allTime.languages)).sort((a, b) => b[1].time.totalTime - a[1].time.totalTime)
  //progressStorage.languages = new Object(sortedLanguages)
  //^for some reason this reurns an array???? 
  var totalTime = 0
  var amt = sortedLanguages.length
  sortedLanguages.forEach(item => {
    totalTime += item[1].time.totalTime
  })
  var otherTime = totalTime
  //Cuts out the top n languages.
  if (number && number < sortedLanguages.length) {
    sortedLanguages = sortedLanguages.slice(0, number)
  }
  //Returns if it's only for JSON
  if (onlyJSON) return sortedLanguages

  var toReturn = ``
  sortedLanguages.forEach((item, pos) => {
    otherTime -= item[1].time.totalTime
    toReturn += `<strong>${pos + 1}. ${item[0]}</strong><br>
Time: ${MsToTime(item[1].time.totalTime)}(${(item[1].time.totalTime / totalTime * 100 || 0).toFixed(2)}%)<br>
Lines: ${item[1].edits.lines.net.toLocaleString()}<br>
Characters: ${item[1].edits.characters.net.toLocaleString()}<br>
Characters Without Bulk: ${item[1].edits.charactersWB.net.toLocaleString()}<br>`
  })
  if (number && amt >= number) {
    toReturn += `Other ${amt - number} languages: ${(otherTime / totalTime * 100 || 0).toFixed(2)}%`
  }
  return toReturn
}

interface ProgressObjectInterface {
  [ key: string ]: unknown

  activeTime: string, 
  totalTime: string, 
  resets: Date
}

export function ProgressObject (messageToPost: ProgressViewMessagePost, progressStorage: TimeRange) {
  const typesArray = [ "lines", "characters", "charactersWB" ] as const

  messageToPost.activeTime = MsToTime(progressStorage.codeTime.activeTime),
  messageToPost.totalTime = MsToTime(progressStorage.codeTime.totalTime),
  messageToPost.resets = progressStorage.resets ? new Date(progressStorage.resets) : null
  

  for (var type of typesArray) {
    messageToPost[type] = progressStorage.edits[type]
  }
  
  //Add coding languages.
  
  //wpm 
  messageToPost.cps = progressStorage.typing.cps()

  //Projects
  messageToPost.projects = progressStorage.projects

  //return shouldn't be nessary since ProgressViewMessagePost objects are passed by reference 
}