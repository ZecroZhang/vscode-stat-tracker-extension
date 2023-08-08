//Shows stats for top languages. 

import React from "react"
import { MostUsedLanguagesResponse, NumberResponse } from "../shared/MessageTypes"
import { AwaitMessage } from "./MessageHandler"
import { TimeAllocation } from "../src/Structures"
import { MsToTime } from "../shared/functions"
import ReactDOM from "react-dom"
import { containerDivs } from "./GenerateBody"

export async function SetUpLanguageStats () {
  //Set most common languages + other stuff
  ReactDOM.render(
    <>
      <span className="subTitle">Other</span><br/>
      <span className="miniTitle">Top Languages</span><br/>
      <div id="languagesDiv"></div>
      <button id="showML">Show All Languages</button><br/>
      <strong>Logging since:</strong> <span id="loggingStartDate"></span><br/>
    </>,
    containerDivs.otherInfo
  )

  let languageDiv = document.getElementById("languagesDiv") as HTMLDivElement
  let showLanguagesButton = document.getElementById("showML") as HTMLButtonElement
  let languagesShown: null | number = 3

  //constructs the most used languages html. 
  let mostUsedLanguages = await AwaitMessage({ command: "mostUsedLanguages", amount: 3 }) as MostUsedLanguagesResponse  
  ReactDOM.render(MostUsedLanguageHTML(mostUsedLanguages), languageDiv)

  showLanguagesButton.addEventListener("click", async () => {
    if (languagesShown == 3) {
      languagesShown = null
      showLanguagesButton.innerText = "Show Top 3" 
    } else {
      languagesShown = 3
      showLanguagesButton.innerText = "Show All Languages"
    }

    let response: MostUsedLanguagesResponse
    if (languagesShown === null) {
      response = await AwaitMessage({ command: "mostUsedLanguages" }) as MostUsedLanguagesResponse
    } else {
      response = await AwaitMessage({ command: "mostUsedLanguages", amount: languagesShown }) as MostUsedLanguagesResponse
    }

    ReactDOM.render(MostUsedLanguageHTML(response), languageDiv)
  })

  let loggingStartDate = document.getElementById("loggingStartDate") as HTMLDivElement
  let startDate = await AwaitMessage({ command: "extensionStartDate" }) as NumberResponse
  loggingStartDate.innerText = new Date(startDate.data).toString()
}

/**
 * Generates a react element to display the list of most used languages based on total time. 
 * @param response 
 * @returns 
 */
function MostUsedLanguageHTML (response: MostUsedLanguagesResponse) {
  let components: React.JSX.Element[] = []

  let totalTime = 0
  response.data.forEach(item => {
    totalTime += item[1].time.totalTime
  })

  let other: { amount: number, time: TimeAllocation } | null = response.otherLanguages

  if (other) {
    totalTime += other.time.totalTime
  }

  let position = 0
  for (let [ name, language ] of response.data) {
    position ++

    let timePercentage = language.time.totalTime / totalTime * 100 ?? 0

    components.push(
      <>
        <strong>{position}. {name}</strong><br/>
        Time: {MsToTime(language.time.totalTime)}({timePercentage.toFixed(2)}%)<br/>
        Lines: {language.edits.lines.net.toLocaleString()}<br/>
        Characters: {language.edits.characters.net.toLocaleString()}<br/>
        Characters Without Bulk: {language.edits.charactersWB.net.toLocaleString()}<br/>
      </>
    )
  }

  if (other) {
    let otherPercentage = other.time.totalTime / totalTime * 100 ?? 0

    components.push(
      //Will add an actual language counter on the response later. 
      <>
        <br/>
        Other {other.amount} languages: { otherPercentage.toFixed(2) }%
      </>
    )
  }

  return (
    <> { components } </>
  )
}