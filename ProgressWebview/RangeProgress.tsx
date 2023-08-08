//Display stats for progress per time ranges. 

import React from "react"
import ReactDOM from "react-dom"
import { Edits, TimeAllocation, TimeRangeNames } from "../src/Structures"
import { ProgressObjectResponse } from "../shared/MessageTypes"
import { AwaitMessage } from "./MessageHandler"
import { MsToTime } from "../shared/functions"
import { containerDivs } from "./GenerateBody"

/**
 * Sets up all the time range stats. Today/weekly/all time 
 */
export async function SetUpTimeRangeStats () {
  //Set up main content 
  SetUpTimeRangeView("todayTime", "Today", "todayProgressDiv")
  SetUpTimeRangeView("weeklyTime", "This Week", "weeklyProgressDiv")
  SetUpTimeRangeView("allTime", "All Time", "totalProgressDiv")
}

type TimeTitle = "Today" | "This Week" | "All Time"
type TimeRangeHTMLIds = "todayProgressDiv" | "weeklyProgressDiv" | "totalProgressDiv"

/**
 * Calls the `SetUp` for the time range html based on if the button has the attribute `data-detailed` for detail view/
 * I think this is only called for when a more detail button is clicked. 
 * @param isDetailed If the div was detailed or not detailed before the button was clicked. Changes to the opposite of this. 
 * @param type Type of the time range. 
 * @param name Title for the time range. 
 * @param progressDiv HTML Id of the container div for the progress.
 */
function DetailedView (isDetailed: boolean, type: TimeRangeNames, name: TimeTitle, progressDiv: TimeRangeHTMLIds) {
  SetUpTimeRangeView(type, name, progressDiv, !isDetailed)
}

/**
 * Function for setting up the HTML webview. 
 * @param type Type of the time range. 
 * @param name Title for the time range. 
 * @param progressDiv HTML Id of the container div for the progress. 
 * @param detailed If the time range stats should display detailed view(true) or the generic view(false). 
 */
async function SetUpTimeRangeView (type: TimeRangeNames, name: TimeTitle, progressDiv: TimeRangeHTMLIds, detailed: boolean = false) {  
  try {
    let info = await AwaitMessage({ command: "progressObject", type }) as ProgressObjectResponse

    let data = BuildTimeViewHTML(info, name, [ type, name, progressDiv ], detailed)
    
    ReactDOM.render(data, containerDivs[progressDiv])
  } catch (e) {
    ReactDOM.render(
      <strong className="redText">FAILED TO LOAD</strong>,
      containerDivs[progressDiv]
    )
    console.error(e)
  }
}

/**
 * Builds the stats for a time period. 
 * @param info 
 * @param timeTitle 
 * @param params passed into `DetailedView`, started on the second argument, when the button's clicked. [ type, name, progressDiv ]
 * @param detailed false = normal view, true = detailed view.
 * @returns React element/HTML data 
 */
function BuildTimeViewHTML (info: ProgressObjectResponse, timeTitle: TimeTitle, params: [TimeRangeNames, TimeTitle, TimeRangeHTMLIds], detailed: boolean = false) {
  let cpsString: string
  if (info.cps == "unknown") {
    cpsString = info.cps
  } else {
    cpsString = `${info.cps.toFixed(2)} about ${(info.cps / 5 * 60).toFixed(2)} WPM`
  }

  let cpsDisplay = (
    <>
      <strong>Characters per second:</strong> {cpsString} <br/>
    </>
  )

  let progress = info.data

  let resetTime = <></>
  if (progress.resets && params[0] != "allTime") {
    resetTime = (
      <>
        <strong>Resets:</strong> {new Date(progress.resets).toString()} <br/>
      </>
    )
  }

  let buttonId = `infoButton${timeTitle}`

  let isDetailed = detailed

  return (
    <>
      <span className="subTitle">{timeTitle}</span> <br/>
      {CodeTimeHTMLView(progress.codeTime)} { CodeModifiedHTMLView(progress.edits, detailed) }
      {cpsDisplay}

      <strong>Projects:</strong> {progress.projects.length} <br/> <br/>

      {resetTime}

      <button id={buttonId} onClick={
        () => {
          DetailedView(isDetailed, ...params)
        }
      } data-detailed={detailed}>{detailed ? "Basic View" : "More Info"}</button><br/>
    </>
  )
}


/**
 * HTML container with all the code modified details. 
 * @param info this only needs to have the lines, characters and characters wb 
 * @param detailed if it should be detailed. 
 * @returns html 
 */
export function CodeModifiedHTMLView (info: Edits, detailed: boolean) {
  const types = [ "lines", "characters", "charactersWB" ] as const
  const typeNames = [ "Lines", "Characters", "Characters Without Bulk" ]

  let components: React.JSX.Element[] = []

  if (detailed) { //the more detailed view. 
    for (var c = 0; c < types.length; c++) {
      for (var action of ([ "added", "removed", "net" ] as const)) {
        components.push(
          <>
            <strong>{typeNames[c]} {action.substring(0, 1).toUpperCase()}{action.substring(1)}:</strong> {info[types[c]][action].toLocaleString()}<br/>
          </>
        )
      }
      components.push(<br/>)
    }
  } else {
    for (var c = 0; c < types.length; c++) {
      components.push(
        <>
          <strong>{typeNames[c]} Added:</strong> {info[types[c]].net.toLocaleString()}<br/>
        </>
      )
    }
  }

  return (
    <>
      <span className="miniTitle">Code Modified</span><br/>
      { components }
    </>
  )
}

/**
 * Create HTML content for code time. 
 * @param time 
 * @returns HTML
 */
export function CodeTimeHTMLView (time: TimeAllocation) {
  return (
    <>
      <span className="miniTitle">Code Time</span><br/>
      <strong>Active Time:</strong> { MsToTime(time.activeTime) }<br/>
      <strong>Total Time:</strong> { MsToTime(time.totalTime) }<br/>
      <br/>
    </>
  )
}