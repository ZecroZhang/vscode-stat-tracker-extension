/**
 * Main file used for controlling the webview. This does all the main displaying of stats except for the pie char and stat counter. 
 */
/// <reference path="./messageHandler.js"/>
/// <reference path="./HTMLBuilder.js"/>
/// <reference types="./types"/>

"use strict"

//Grabs all the important variables
var containerDivsIds = [ "todayProgressDiv", "weeklyProgressDiv", "totalProgressDiv", "projectProgress", "otherInfo", "controlDiv" ]

/**
 * @type { { [ key: string ]: HTMLDivElement } }
 */
var containerDivs = {}
for (var div of containerDivsIds) {
  containerDivs[div] = document.getElementById(div)
}
//Set up main content 
SetUp("todayTime", "Today", "todayProgressDiv")
SetUp("weeklyTime", "This Week", "weeklyProgressDiv")
SetUp("", "All Time", "totalProgressDiv")

//Set most common languages + other stuff
containerDivs.otherInfo.innerHTML = `<span class="subTitle">Other</span><br>
<span class="miniTitle">Top Languages</span><br>
<div id="languagesDiv"></div>
<button id="showML">Show All Languages</button><br>
<strong>Logging since:</strong> <span id="loggingStartDate"></span><br>`
var languageDiv = document.getElementById("languagesDiv")
var showLanguagesbutton = document.getElementById("showML")
var languagesShown = 3

//constructs the most used languages html. 
AwaitMessage({ command: "mostUsedLanguages", amount: 3 }).then(info => {
  languageDiv.innerHTML = info.html
})

//constructs the project html. 
AwaitMessage({ command: "currentProject", type: "allTime" }).then(async project => {
  containerDivs.projectProgress.appendChild(await BuildCompleteProjectHTMLView(project))
})

showLanguagesbutton.addEventListener("click", async () => {
  if (languagesShown == 3) {
    languagesShown = null
    showLanguagesbutton.innerText = "Show Top 3" 
  } else {
    languagesShown = 3
    showLanguagesbutton.innerText = "Show All Languages"
  }
  AwaitMessage({ command: "mostUsedLanguages", amount: languagesShown }).then(info => {
    languageDiv.innerHTML = info.html
  })
})

//Final settings/stuff div 
containerDivs.controlDiv.innerHTML = `<!--<span class="subTitle"></span>-->
<button id="graphDataButton">Graph Most Used Languages(Data)</button>
<div id="graphTitle" class="subTitle"></div>
<div id="graphData"></div><br>

<span class="subTitle">Saved Data</span><br>
<textarea id="jsonData"></textarea><br>
<button id="jsonLoader">Load JSON Below</button><br>
<textarea id="inputData" placeholder="Load JSON Data?"></textarea>`

//JSON string with all progress. 
var jsonDataTextarea = document.getElementById("jsonData")
AwaitMessage({ command: "statsJSONData" }).then(info => {
  jsonDataTextarea.value = JSON.stringify(info.data, null, 3)
})
//For loading progress data. 
var jsonLoader = document.getElementById("jsonLoader")
var inputData = document.getElementById("inputData")
jsonLoader.addEventListener("click", async () => {
  if (!inputData.value) return

  /**
   * @type { import("../src/Structures").UsageTimeInterface }
   */
  var data = JSON.parse(inputData.value)
  inputData.value = ""

  await AwaitMessage({ command: "updateUsageData", data })
})


var loggingStartDate = document.getElementById("loggingStartDate")
var jsonData = document.getElementById("jsonData")
AwaitMessage({ command: "extensionStartDate" }).then(
/**
 * Gets and sets the extension start date. 
 * @param { pw.DateMessage } info 
 */
info => {
  loggingStartDate.innerText = info.date
})


//Set up the theme
AwaitMessage({ command: "colourTheme" }).then(
/**
 * 
 * @param { pw.ColourThemeMessage } message 
 */
message => {
  //If light theme(1), enable the dark theme sprite sheet, otherwise enable the light theme sprite sheet 
  var enable = message.data == 1 ? "lightThemeStyleSheet" : "darkThemeStyleSheet"

  document.getElementById(enable).removeAttribute("disabled")
})

