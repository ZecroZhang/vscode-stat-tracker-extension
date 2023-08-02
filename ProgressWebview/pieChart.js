"use strict"

var graphDataButton = document.getElementById("graphDataButton")
var graphData = document.getElementById("graphData")

class Slice {
  /**
   * Pie language slice
   * @param { string } language Name of the coding language. 
   * @param { number } radWidth 
   * @param { number | string } colour 
   */
  constructor (language, codeTime, radWidth, totalRad, colour) {
    this.language = language
    this.codeTime = codeTime

    this.radWidth = radWidth
    this.colour = colour
    this.totalRad = totalRad

    this.html = `${this.language}<br>${MsToTime(this.codeTime)}`
  }
}

const pieColours = [ "gold", "crimson", "coral", "lightsteelblue", "seagreen", "turquoise", "sandybrown", "midnightblue", "lemonchiffon", "darkgray" ]
/** @type { Array<Slice> } */
var pieSlices = []
graphData.innerHTML = `<div id="pieChart" style="display: inline-block"></div>
<div id="pieChartLegend" style="display: inline-block"></div>
<div id="displayBox"></div>`

var displayBox = document.getElementById("displayBox") // Box that follows mouse when cursor hovering over the chart.
//click listener for pie chart 
var pieChart = document.getElementById("pieChart")
var chartLegend = document.getElementById("pieChartLegend")

/**
 * Add an item to the legend. 
 * @param { string } colour Hex code of the colour for the style. 
 * @param { string } name Name to be shown on the legend. 
 * @param { number } percent Percentage as a float from 0 to 1. 
 */
function AddLegendItem (colour, name, percent) {
  var legendItemDiv = document.createElement("div")
  legendItemDiv.className = "legendListItem"
  legendItemDiv.innerHTML = `<div class="displayColour" style="background-color: ${colour}"></div><span>${name} (${(percent*100).toFixed(2)}%)</span>`
  
  chartLegend.appendChild(legendItemDiv)
}

graphDataButton.addEventListener("click", async () => {
  //Get the most used language info and ready the slices for the pie chart. 

  /**
   * @type { Array<[ string, import("../src/Structures").CodingLanguage ]> }
   */
  var languageData = (await AwaitMessage({ command: "mostUsedLanguagesJSON", amount: null })).data

  //Sum up the total time for all languages. 
  var totalTime = 0
  for (var i = 0; i < languageData.length; i++) {
    totalTime += languageData[i][1].time.totalTime
  }

  /**
   * Used to join the conic-gradient 
   * @type { Array<string> }
   */
  var gradients = [] 
  pieSlices = []
  chartLegend.innerHTML = `<spam class="subTitle">Legend</span><br>`
  //Give the chart legend a nice top margin 
  chartLegend.style.marginTop = `1vh`

  //Assign the pie slices.
  var totalRad = 0
  for (var c = 0; c < 9 && c < languageData.length; c++) {
    //Percentage of time multiplied by 2pi. 
    var radWidth = (languageData[c][1].time.totalTime / totalTime) * 2 * Math.PI
    totalRad += radWidth

    pieSlices.push(new Slice(languageData[c][0], languageData[c][1].time.totalTime, radWidth, totalRad, pieColours[c]))

    gradients.push(`${pieColours[c]} 0 ${totalRad*180/Math.PI}deg`)

    AddLegendItem(pieColours[c], languageData[c][0], languageData[c][1].time.totalTime / totalTime)
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

    AddLegendItem(pieColours[9], "other", remainingTime/totalTime)
  }

  //Set up the gradient div 
  pieChart.style = `background-image: conic-gradient(${gradients.join(", ")}); width: calc((40vw + 40vh)/2); height: calc((40vw + 40vh)/2); margin: 1vw; margin-right: 4vw; `
  document.getElementById("graphTitle").innerText = "Language Usage"

  //We don't need this to get graphed again. 
  graphDataButton.parentElement.removeChild(graphDataButton)
})

pieChart.addEventListener("mouseenter", () => {
  displayBox.style.display = "block"
})

pieChart.addEventListener("mouseleave", () => {
  displayBox.style.display = "none"
})

pieChart.addEventListener("mousemove", event => {
  //Calculate graph position
  var pieChartBoundingBox = pieChart.getBoundingClientRect()
  var chartCenter = [
    pieChartBoundingBox.width/2 + pieChartBoundingBox.left,
    pieChartBoundingBox.height/2 + pieChartBoundingBox.top
  ]

  //Calculate the angle of the mouse relative to the chart. 
  var angle = Math.atan2(Math.abs(event.clientY)-chartCenter[1], event.clientX-chartCenter[0]) + Math.PI/2
  var adjustedAngle = (angle + Math.PI*2) % (Math.PI*2)
  
  let sliceIndex = 0
  for (; sliceIndex < pieSlices.length; sliceIndex++) {
    if (adjustedAngle <= pieSlices[sliceIndex].totalRad) break
  }
  MoveDisplayBox(event.pageX, event.pageY, pieSlices[sliceIndex].html)
})

/**
 * Moves and changes the hovering display box. 
 * @param { number } x Mouse X. 
 * @param { number } y Mouse Y. 
 * @param { string } innerHTML Text to set the display box to. 
 */
function MoveDisplayBox (x, y, innerHTML) {
  displayBox.style.left = `${x - window.scrollX}px`
  displayBox.style.top = `${y - window.scrollY}px`
  displayBox.innerHTML = innerHTML
}