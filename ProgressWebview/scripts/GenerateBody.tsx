/**
 * Generates the HTML structure for the main body. As well as generating the other data not covered by the other files(time ranges, projects, pie chart and stats counter).
 */

import React from "react"
import ReactDOM from "react-dom"
import { AwaitMessage } from "./MessageHandler"

function GenerateTitle (title: string) {
  return (
    <div className="backgroundContainer mainTitle">
      <div className="titleBlock">{title}</div>
    </div>
  )
}

export const containerDivs: { [key: string]: HTMLDivElement } = {}

/**
 * Renders the HTML for the main body of the page. 
 */
export function RenderBody () {
  let statsTitle = GenerateTitle("Progress Stats")

  let statsContainer = (
    <div className="backgroundContainer" id="progressContainers">
      <div className="containerDiv"> 
        <div id="todayProgressDiv" className="mainDiv"></div>
        <div id="weeklyProgressDiv" className="mainDiv"></div>
        <div id="totalProgressDiv" className="mainDiv"></div>
        <div id="projectProgress" className="mainDiv"></div>
        <div id="otherInfo" className="mainDiv"></div>
        <div id="controlDiv" className="mainDiv"></div>
      </div>
    </div>
  )

  let counterTitle = GenerateTitle("Stat Counter")

  let counterContainer = (
    <div className="backgroundContainer">
      <div id="progressCounter" className="mainDiv containerDiv"></div>
    </div>
  )

  let body = (
    <>
      {statsTitle}{statsContainer}
      {counterTitle}{counterContainer}
    </>
  )

  ReactDOM.render(body, document.body)

  // Grabs all the important variables
  const containerDivsIds = [ "todayProgressDiv", "weeklyProgressDiv", "totalProgressDiv", "projectProgress", "otherInfo", "controlDiv" ] as const
  for (let div of containerDivsIds) {
    containerDivs[div] = document.getElementById(div) as HTMLDivElement
  }

  SetUpOtherWebviewContent()
}

/**
 * Sets up the graph, json data section as well as setting the colour theme
 */
async function SetUpOtherWebviewContent () {
  ReactDOM.render(
    <>
      <div id="graphTitle" className="subTitle">Graph Stats</div>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "row",
        alignItems: "center"
      }}> {/* Container for the select menus. */}
        <div>
          Time Range <select id="graphTimeRangeSelectMenu"></select>
        </div>
        <div>
          Stats From <select id="graphStatsFromSelectMenu"></select>
        </div>
        <div>
          Type <select id="graphTypeSelectMenu"></select>
          <select id="graphSubtypeSelectMenu"></select>
        </div>
      </div>
      <button id="graphDataButton">Graph Stats</button>
      <div id="graphData"></div><br/>

      <span className="subTitle">Saved Data</span><br/>
      <textarea id="jsonData"></textarea><br/>
      <button id="jsonLoader">Load Stats JSON Below</button><br/>
      <span className="redText" id="jsonLoaderErrorDisplay"></span>
      <textarea id="inputData" placeholder="Load JSON Data?"></textarea>
    </>,
    containerDivs.controlDiv
  )

  // JSON string with all progress. 
  let statsJSON = await AwaitMessage({ command: "statsJSONData" })
  ;(document.getElementById("jsonData") as HTMLTextAreaElement).value = statsJSON.json
  
  // For loading progress data. 
  let inputData = document.getElementById("inputData") as HTMLTextAreaElement
  ;(document.getElementById("jsonLoader") as HTMLButtonElement).addEventListener("click", async () => {
    const jsonLoaderErrorDisplay = document.getElementById("jsonLoaderErrorDisplay") as HTMLSpanElement

    if (!inputData.value) {
      jsonLoaderErrorDisplay.innerText = "Please provide stats JSON to be added.\n"
      return
    }

    // A UsageTime object. 
    let data: object

    try {
      data = JSON.parse(inputData.value)
    } catch (err) {
      jsonLoaderErrorDisplay.innerText = "Invalid JSON provided.\n"
      return 
    }

    jsonLoaderErrorDisplay.innerText = ""
    inputData.value = ""

    await AwaitMessage({ command: "updateUsageData", data })
  })

  // Set up the theme
  let theme = await AwaitMessage({ command: "colourTheme" })
  let styleSheet = theme.isDark ? "darkThemeStyleSheet" : "lightThemeStyleSheet"
  
  document.getElementById(styleSheet)!.removeAttribute("disabled")
}