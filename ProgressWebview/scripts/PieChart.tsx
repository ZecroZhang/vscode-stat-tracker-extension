import React from "react"
import ReactDOM from "react-dom"

import { MsToTime, Plural } from "../../shared/functions"
import { AwaitMessage } from "./MessageHandler"
import { TimeRangeNames } from "../../src/structs/structs"
import { AddOptions, SelectMenuOptions } from "./utility"
import { GraphSubTypes, GraphTypes } from "../../shared/MessageTypes"
import { SetTimeRangeMenu, SetTypeMenu } from "./GraphSelectMenus"

class Slice {
  language: string
  codeTime: number
  radWidth: number
  colour: string | number
  totalRad: number
  html: React.JSX.Element

  /**
   * Pie language slice
   * @param language Name of the coding language. 
   * @param value The amount of the type. Note time is in milliseconds.
   * @param type type of the value being displayed.
   * @param radWidth width of the pie slice in radians.
   * @param totalRad total amount of radians at the end of this slice.
   * @param colour colour of the slice.
   */
  constructor (language: string, value: number, type: "time" | "lines" | "characters" | "charactersWB", radWidth: number, totalRad: number, colour: string | number) {
    this.language = language
    this.codeTime = value

    this.radWidth = radWidth
    this.colour = colour
    this.totalRad = totalRad

    let displayValue: string
    switch (type) {
      case "time":
        displayValue = MsToTime(value)
        break
      case "lines":
        displayValue = `${value} ${Plural("line", value)}`
        break
      case "characters":
        displayValue = `${value} ${Plural("character", value)}`
        break
      case "charactersWB":
        displayValue = `${value} ${Plural("character", value)} without bulk`
      break
    }

    this.html = <> {this.language} <br/> {displayValue} </>
  }
}

const pieColours = [ "gold", "crimson", "coral", "lightsteelblue", "seagreen", "turquoise", "sandybrown", "midnightblue", "lemonchiffon", "darkgray" ]

/**
 * Sets the display style property on the no data div. 
 * @param display 
 */
function ToggleNoInfo (display: "none" | "") {
  (document.getElementById("pieChartNoData") as HTMLDivElement).style.display = display
}

// Call this after the main content has been set up. 
export function SetUpPieChart () {
  let pieSlices: Slice[] = []

  ReactDOM.render(
    <>
      <div id="pieChartNoData" style={{ display: "none" }}>No Data</div>
      <div id="pieChart" style={ { display: "inline-block" } }></div>
      <div id="pieChartLegend" style={ { display: "inline-block" } }></div>
      <div id="displayBox"></div>
    </>,
    document.getElementById("graphData")
  )

  // Select menus ranges
  const timeRangeSelectMenu = document.getElementById("graphTimeRangeSelectMenu") as HTMLSelectElement
  const statsFromSelectMenu = document.getElementById("graphStatsFromSelectMenu") as HTMLSelectElement
  const typeSelectMenu = document.getElementById("graphTypeSelectMenu") as HTMLSelectElement
  const subtypeSelectMenu = document.getElementById("graphSubtypeSelectMenu") as HTMLSelectElement

  const selectMenus = {
    timeRangeSelectMenu,
    statsFromSelectMenu,
    typeSelectMenu,
    subtypeSelectMenu
  }
  SetTimeRangeMenu(selectMenus, "allTime") // This auto sets up the other ones.

  /**
   * Gets the type for the graph select menu.
   */
  function GetType () {
    return typeSelectMenu.selectedOptions[0].value as GraphTypes
  }
  /**
   * Gets the selected time range.
   */
  function GetTimeRange () {
    return timeRangeSelectMenu.selectedOptions[0].value as TimeRangeNames
  }

  timeRangeSelectMenu.addEventListener("change", () => {
    SetTimeRangeMenu(selectMenus, GetTimeRange())
  })
  typeSelectMenu.addEventListener("change", () => {
    SetTypeMenu(selectMenus, GetType())
  })

  const displayBox = document.getElementById("displayBox") as HTMLDivElement // Box that follows mouse when cursor hovering over the chart.
  // click listener for pie chart 
  const pieChart = document.getElementById("pieChart") as HTMLDivElement
  const chartLegend = document.getElementById("pieChartLegend") as HTMLDivElement

  const graphDataButton = document.getElementById("graphDataButton") as HTMLButtonElement

  graphDataButton.addEventListener("click", async () => {
    const response = await AwaitMessage({
      command: "getGraphData",
      timeRange: GetTimeRange(),
      rank: statsFromSelectMenu.selectedOptions[0].value,
      type: GetType(),
      subtype: subtypeSelectMenu.selectedOptions[0].value as GraphSubTypes
    })

    if (response.error || response.totalAmount == 0) {
      ToggleNoInfo("")
      pieChart.style.display = "none"
      ReactDOM.unmountComponentAtNode(chartLegend)
      return
    }
    
    ToggleNoInfo("none")
    const { data, totalAmount } = response


    /**
     * Used to join the conic-gradient
     */
    let gradients: Array<string> = []

    pieSlices = []
    
    let legendComponents: React.JSX.Element[] = [
      <span className="subTitle">Legend</span>, <br/>
    ]

    // Give the chart legend a nice top margin 
    chartLegend.style.marginTop = `1vh`

    // Assign the pie slices.
    let totalRad = 0
    for (let c = 0; c < data.length; c++) {
      const { amount, name } = data[c]
      const percentage = amount / totalAmount

      // Percentage of time multiplied by 2pi. 
      let radWidth = percentage * 2 * Math.PI
      totalRad += radWidth

      pieSlices.push(new Slice(name, amount, GetType(), radWidth, totalRad, pieColours[c]))

      gradients.push(`${pieColours[c]} 0 ${totalRad*180/Math.PI}deg`)

      let item = CreateLegendItem(pieColours[c], name, percentage)
      legendComponents.push(item)
    }

    ReactDOM.render(legendComponents, chartLegend)

    // Set up the gradient div 
    pieChart.style.backgroundImage = `conic-gradient(${gradients.join(", ")})`
    pieChart.style.width = `400px`
    pieChart.style.height = `400px`
    pieChart.style.margin = `8px`
    pieChart.style.marginRight = `32px`
    pieChart.style.display = ``
  })

  pieChart.addEventListener("mouseenter", () => {
    displayBox.style.display = "block"
  })

  pieChart.addEventListener("mouseleave", () => {
    displayBox.style.display = "none"
  })

  pieChart.addEventListener("mousemove", event => {
    // Calculate graph position
    let pieChartBoundingBox = pieChart.getBoundingClientRect()
    let chartCenter = [
      pieChartBoundingBox.width/2 + pieChartBoundingBox.left,
      pieChartBoundingBox.height/2 + pieChartBoundingBox.top
    ]

    // Calculate the angle of the mouse relative to the chart. 
    let angle = Math.atan2(Math.abs(event.clientY)-chartCenter[1], event.clientX-chartCenter[0]) + Math.PI/2
    let adjustedAngle = (angle + Math.PI*2) % (Math.PI*2)
    
    let sliceIndex = 0
    for (; sliceIndex < pieSlices.length; sliceIndex++) {
      if (adjustedAngle <= pieSlices[sliceIndex].totalRad) {
        break
      }
    }
    MoveDisplayBox(event.pageX, event.pageY, pieSlices[sliceIndex].html)
  })

  /**
   * Moves and changes the hovering display box. 
   * @param x Mouse X. 
   * @param y Mouse Y. 
   * @param innerHTML Text to set the display box to. 
   */
  function MoveDisplayBox (x: number, y: number, innerHTML: React.JSX.Element) {
    displayBox.style.left = `${x - window.scrollX}px`
    displayBox.style.top = `${y - window.scrollY}px`

    ReactDOM.render(innerHTML, displayBox)
  }
}

/**
 * Add an item to the legend. 
 * @param backgroundColor Hex code of the colour for the style. 
 * @param name Name to be shown on the legend. 
 * @param percent Percentage as a float from 0 to 1. 
 * 
 * @returns The legend item div. 
 */
function CreateLegendItem (backgroundColor: string, name: string, percent: number) {
  return (
    <div className="legendListItem">
      <div className="displayColour" style={{ backgroundColor }}></div>
      <span>{name} ({(percent*100).toFixed(2)}%)</span>
    </div>
  )
}