import React from "react"
import ReactDOM from "react-dom"

import { MsToTime } from "../shared/functions"
import { AwaitMessage } from "./MessageHandler"
import { MostUsedLanguagesResponse } from "../shared/MessageTypes"

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
   * @param codeTime 
   * @param radWidth 
   * @param totalRad 
   * @param colour 
   */
  constructor (language: string, codeTime: number, radWidth: number, totalRad: number, colour: string | number) {
    this.language = language
    this.codeTime = codeTime

    this.radWidth = radWidth
    this.colour = colour
    this.totalRad = totalRad

    this.html = <> {this.language} <br/> {MsToTime(this.codeTime)} </>
  }
}

const pieColours = [ "gold", "crimson", "coral", "lightsteelblue", "seagreen", "turquoise", "sandybrown", "midnightblue", "lemonchiffon", "darkgray" ]

//Call this after the main content has been set up. 
export function SetUpPieChart () {
  let pieSlices: Slice[] = []

  ReactDOM.render(
    <>
      <div id="pieChart" style={ { display: "inline-block" } }></div>
      <div id="pieChartLegend" style={ { display: "inline-block" } }></div>
      <div id="displayBox"></div>
    </>,
    document.getElementById("graphData")
  )

  let displayBox = document.getElementById("displayBox") as HTMLDivElement // Box that follows mouse when cursor hovering over the chart.
  //click listener for pie chart 
  let pieChart = document.getElementById("pieChart") as HTMLDivElement
  let chartLegend = document.getElementById("pieChartLegend") as HTMLDivElement

  let graphDataButton = document.getElementById("graphDataButton") as HTMLButtonElement

  graphDataButton.addEventListener("click", async () => {
    //Get the most used language info and ready the slices for the pie chart. 

    let languageData = (await AwaitMessage({ command: "mostUsedLanguages" }) as MostUsedLanguagesResponse).data

    //Sum up the total time for all languages. 
    var totalTime = 0
    for (let [ _, language ] of languageData) {
      totalTime += language.time.totalTime
    }

    /**
     * Used to join the conic-gradient
     */
    let gradients: Array<string> = []

    pieSlices = []
    
    let legendComponents: React.JSX.Element[] = [
      <span className="subTitle">Legend</span>, <br/>
    ]

    //Give the chart legend a nice top margin 
    chartLegend.style.marginTop = `1vh`

    //Assign the pie slices.
    let totalRad = 0
    let c = 0
    for (; c < 9 && c < languageData.length; c++) {
      //Percentage of time multiplied by 2pi. 
      let radWidth = (languageData[c][1].time.totalTime / totalTime) * 2 * Math.PI
      totalRad += radWidth

      pieSlices.push(new Slice(languageData[c][0], languageData[c][1].time.totalTime, radWidth, totalRad, pieColours[c]))

      gradients.push(`${pieColours[c]} 0 ${totalRad*180/Math.PI}deg`)

      let item = CreateLegendItem(pieColours[c], languageData[c][0], languageData[c][1].time.totalTime / totalTime)
      legendComponents.push(item)
    }

    //If there's more than 9 elements, we have an 'other'. 
    if (c < languageData.length) {
      var remainingTime = 0
      for (; c < languageData.length; c++) {
        if (isNaN(languageData[c][1].time.totalTime)) {
          continue
        }
        remainingTime += languageData[c][1].time.totalTime
      }

      var radWidth = remainingTime/totalTime * 2*Math.PI
      pieSlices.push(new Slice("other", remainingTime, radWidth, Math.PI*2, pieColours[9]))
      
      gradients.push(`${pieColours[9]} 0 360deg`)

      let item = CreateLegendItem(pieColours[9], "other", remainingTime/totalTime)
      legendComponents.push(item)
    }

    ReactDOM.render(legendComponents, chartLegend)

    //Set up the gradient div 
    pieChart.style.backgroundImage = `conic-gradient(${gradients.join(", ")})`
    pieChart.style.width = `calc((40vw + 40vh)/2)`
    pieChart.style.height = `calc((40vw + 40vh)/2)`
    pieChart.style.margin = `1vw`
    pieChart.style.marginRight = `4vw`


    ;(document.getElementById("graphTitle") as HTMLDivElement).innerText = "Language Usage"

    //We don't need this to get graphed again. 
    graphDataButton.parentElement?.removeChild(graphDataButton)
  })

  pieChart.addEventListener("mouseenter", () => {
    displayBox.style.display = "block"
  })

  pieChart.addEventListener("mouseleave", () => {
    displayBox.style.display = "none"
  })

  pieChart.addEventListener("mousemove", event => {
    //Calculate graph position
    let pieChartBoundingBox = pieChart.getBoundingClientRect()
    let chartCenter = [
      pieChartBoundingBox.width/2 + pieChartBoundingBox.left,
      pieChartBoundingBox.height/2 + pieChartBoundingBox.top
    ]

    //Calculate the angle of the mouse relative to the chart. 
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