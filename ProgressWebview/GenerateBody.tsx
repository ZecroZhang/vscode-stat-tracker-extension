/**
 * Generates the HTML structure for the main body. As well as generating the other data not covered by the other files(time ranges, projects, pie chart and stats counter).
 */

import React from "react"
import ReactDOM from "react-dom"
import { JSONResponse, NumberResponse } from "../shared/MessageTypes"
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

  //Grabs all the important variables
  const containerDivsIds = [ "todayProgressDiv", "weeklyProgressDiv", "totalProgressDiv", "projectProgress", "otherInfo", "controlDiv" ] as const
  for (var div of containerDivsIds) {
    containerDivs[div] = document.getElementById(div) as HTMLDivElement
  }

  SetUpOtherWebviewContent()
}

async function SetUpOtherWebviewContent () {
  ReactDOM.render(
    <>
      <button id="graphDataButton">Graph Most Used Languages(Data)</button>
      <div id="graphTitle" className="subTitle"></div>
      <div id="graphData"></div><br/>

      <span className="subTitle">Saved Data</span><br/>
      <textarea id="jsonData"></textarea><br/>
      <button id="jsonLoader">Load JSON Below</button><br/>
      <textarea id="inputData" placeholder="Load JSON Data?"></textarea>
    </>,
    containerDivs.controlDiv
  )

  //JSON string with all progress. 
  let statsJSON = await AwaitMessage({ command: "statsJSONData" }) as JSONResponse
  ;(document.getElementById("jsonData") as HTMLTextAreaElement).value = statsJSON.data
  
  //For loading progress data. 
  let inputData = document.getElementById("inputData") as HTMLTextAreaElement
  ;(document.getElementById("jsonLoader") as HTMLButtonElement).addEventListener("click", async () => {
    if (!inputData.value) {
      return
    }

    //A UsageTime object. 
    //Add a data validation check here later. 
    let data = JSON.parse(inputData.value)
    inputData.value = ""

    await AwaitMessage({ command: "updateUsageData", json: data })
  })

  //Set up the theme
  let theme = await AwaitMessage({ command: "colourTheme" }) as NumberResponse
  let styleSheet = theme.data == 1 ? "lightThemeStyleSheet" : "darkThemeStyleSheet"
  
  document.getElementById(styleSheet)!.removeAttribute("disabled")
}