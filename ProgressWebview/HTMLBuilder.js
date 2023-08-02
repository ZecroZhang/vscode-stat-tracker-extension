//Functions for creating the html data for the elements and stuff. 

/// <reference path="./progressWebview.js"/>

/**
 * Calls the set up for the time range html based on if the button has the attribute `data-detailed` for detail view.  
 * @param { HTMLButtonElement } button The detailed view/basic view button. 
 * @param { pw.TimeRequest } type Type of the time range. 
 * @param { pw.timeTitle } name Title for the time range. 
 * @param { pw.TimeRangeHTMLIds } progressDiv HTML Id of the container div for the progress.
 */
function DetailedView (button, type, name, progressDiv) {
  SetUp(type, name, progressDiv, button.getAttribute("data-detailed") == "true" ? false : true)
}

/**
 * Function for setting up the HTML webview. 
 * @param { pw.TimeRequest } type Type of the time range. 
 * @param { pw.timeTitle } name Title for the time range. 
 * @param { pw.TimeRangeHTMLIds } progressDiv HTML Id of the container div for the progress. 
 * @param { boolean } detailed If the timerange stats should display detailed view(true) or the generic view(false). 
 */
async function SetUp (type, name, progressDiv, detailed = false) {  
  try {
    /**
     * @type { pw.ProgressObjectMessage }
     */
    var info = await AwaitMessage({ command: "progressObject", type })

    var data = BuildTimeViewHTML(info, name, `'${type}', '${name}', '${progressDiv}'`, detailed)
    containerDivs[progressDiv].innerHTML = data
  } catch (e) {
    containerDivs[progressDiv].innerHTML = `<strong class="redText">FAILED TO LOAD</strong>`
    console.error(e)
  }
}

/**
 * Create HTML content for code time. 
 * @param { {
 *    activeTime: string
 *    totalTime: string
 * } } info Data.
 * @returns HTML
 */
function CodeTimeHTMLView (info) {
  return `<span class="miniTitle">Code Time</span><br>
<strong>Active Time:</strong> ${info.activeTime}<br>
<strong>Total Time:</strong> ${info.totalTime}<br>
<br>`
}

/**
 * HTML containder with all the code modified details. 
 * @param { pw.ProgressObjectMessage } info this only needs to have the lines, characters and characterswb 
 * @param { boolean } detailed if it should be detailed. 
 * @returns { string } html 
 */
function CodeModifiedHTMLView (info, detailed) {
  let returnHTML = `<span class="miniTitle">Code Modified</span><br>`
  const types = [ "lines", "characters", "charactersWB" ]
  const typeNames = [ "Lines", "Characters", "Characters Without Bulk" ]

  if (detailed) { //the more detailed view. 
    for (var c = 0; c < types.length; c++) {
      for (var action of [ "added", "removed", "net" ]) {
        returnHTML += `<strong>${typeNames[c]} ${action.substring(0, 1).toUpperCase()}${action.substring(1)}:</strong> ${info[types[c]][action].toLocaleString()}<br>`
      }
      returnHTML += `<br>`
    }
  } else {
    for (var c = 0; c < types.length; c++) {
      returnHTML += `<strong>${typeNames[c]} Added:</strong> ${info[types[c]].net.toLocaleString()}<br>`
    }
  }

  return returnHTML
}

/**
 * Builds the stats for a time period. 
 * @param { pw.ProgressObjectMessage } info 
 * @param { pw.TimeTitle } timeTitle 
 * @param { string } params This is inserted as HTML(js) into the DetailedView() function after the first parameter. Should be in the form of `'${type}', '${name}', '${progressDiv}'`. 
 * @param { boolean } detailed false = normal view, true = detailed view.
 * @returns { string } String of HTML for the webview. 
 */
function BuildTimeViewHTML (info, timeTitle, params, detailed = false) {
  var returnHTML = `<span class="subTitle">${timeTitle}</span><br>
  ${CodeTimeHTMLView(info)}${CodeModifiedHTMLView(info, detailed)}`
  
  //characters per second and wpm 
  returnHTML += `<strong>Characters per second:</strong> ${info.cps?.toFixed?.(2)}`
  if (info.cps == "unknown") {
    returnHTML += `<br>`
  } else {
    returnHTML += ` about ${(info.cps / 5 * 60).toFixed(2)} WPM<br>`
  }

  returnHTML += `<strong>Projects:</strong> ${info.projects.length}`

  returnHTML += `<br>` //extra line break 
  //reset time
  returnHTML += `<strong>Resets:</strong> ${info.resets}<br>`

  //add the more info button. 
  returnHTML += `<button id="infoButton${timeTitle}" onclick="DetailedView(this, ${params})" data-detailed="${detailed}">${detailed ? "Basic View" : "More Info"}</button><br>`
  return returnHTML
}

/**
 * Builds everything for projects. 
 * @param { pw.ProjectMessage } project
 * @returns { Promise<HTMLDivElement> } the two elements to be added in order. 
 */
async function BuildCompleteProjectHTMLView (project) {
  let contentContainer = document.createElement("div")

  contentContainer.innerHTML = `<span class="subTitle">Projects</span><br>
Project <select id="projectSelectMenu"></select> Time Range <select id="timeRangeSelectMenu"></select><br>
Sort projects <select id="projectSortSelectMenu"></select><br>
  <div id="projectStatsContainer">${BuildProjectHTMLView(project)}</div>`

  /**
   * @type { HTMLSelectElement }
   */
  let projectSelectMenu = contentContainer.querySelector("#projectSelectMenu")
  /**
   * @type { HTMLSelectElement }
   */
  let timeRangeSelectMenu = contentContainer.querySelector("#timeRangeSelectMenu")

  /**
   * @type { HTMLSelectElement }
   */
  let projectSortSelectMenu = contentContainer.querySelector("#projectSortSelectMenu")

  /**
   * 
   * @param { HTMLSelectElement } menu 
   * @param { { name: string, value: string }[] } options 
   */
  let AddOptions = (menu, options) => {
    for (let option of options) {
      let optionElem = document.createElement("option")
      optionElem.value = option.value
      optionElem.text = option.name
  
      menu.appendChild(optionElem)
    }
  }

  //add the time ranges. 
  const timeRanges = [
    { name: "All Time", value: "allTime" },
    { name: "Weekly", value: "weeklyTime" },
    { name: "Today", value: "todayTime" },
  ]
  AddOptions(timeRangeSelectMenu, timeRanges)
  timeRangeSelectMenu.selectedIndex = 0 //set the all time to be selected. 

  //add the sort options 
  const sortOptions = [
    { name: "Alphabetical", value: "alphabetical" },
    { name: "Time Spent", value: "time" },
  ]
  AddOptions(projectSortSelectMenu, sortOptions)
  projectSortSelectMenu.selectedIndex = 0

  //add the options. This will need to fetch the project later. 
  //sorting the projects so it's easier for the user
  /**
   * 
   * @type { { [ key: string ]: ((projectInfoResponse: pw.AllProjectInfoMessage) => void) } }
   */
  let projectInfoSort = {
    alphabetical: (projectInfoResponse) => {
      projectInfoResponse.data.sort((a, b) => {
        let aName = a.name.toLowerCase()
        let bName = b.name.toLowerCase()
    
        if (aName == bName) {
          return 0
        } else if (aName > bName) {
          return 1
        } else {
          return -1
        }
      })
    },
    time: (projectInfoResponse) => {
      //descending order
      projectInfoResponse.data.sort((a, b) => b.time - a.time)
    }
  }

  /**
   * 
   * @param { "alphabetical" | "time" } type 
   */
  let SortAndBuildProjectInfo = async (type) => {
    /**
     * @type { pw.AllProjectInfoMessage }
     */
    let projectInfoResponse = await AwaitMessage({ command: "allProjectInfos", type: timeRangeSelectMenu.selectedOptions[0].value })
    
    //sort it. 
    projectInfoSort[type](projectInfoResponse)

    //remove any existing one. 
    projectSelectMenu.innerHTML = `<option value="" disabled selected>None Selected</option>`
    let projectFound = false 

    //add all the select options. 
    for (let i = 0; i < projectInfoResponse.data.length; i++) {
      let projectInfo = projectInfoResponse.data[i]
  
      let option = document.createElement("option")
      //text is what is displayed to the user. 
      option.value = projectInfo.path
      option.text = projectInfo.name
  
      projectSelectMenu.appendChild(option)
  
      //current selected project :)
      if (projectInfo.path == project.stats?.path) {
        projectSelectMenu.selectedIndex = i+1 //none option takes the first slot
        projectFound = true
      }
    }

    //unselect the item if there is no current project(most likely) or if no project was found.
    if (!projectFound) {
      projectSelectMenu.selectedIndex = 0
    }
  }
  await SortAndBuildProjectInfo("alphabetical")

  //select menu listeners 
  projectSelectMenu.addEventListener("change", async () => {
    //this should have only one item. 
    let projectPath = projectSelectMenu.selectedOptions[0].value

    //set it to the new project. 
    project = await AwaitMessage({ command: "getProject", path: projectPath, type: timeRangeSelectMenu.selectedOptions[0].value }) 

    //projectStatsContainer
    document.getElementById("projectStatsContainer").innerHTML = BuildProjectHTMLView(project)
  })

  timeRangeSelectMenu.addEventListener("change", async () => {
    await SortAndBuildProjectInfo(projectSortSelectMenu.selectedOptions[0].value)

    if (projectSelectMenu.selectedIndex == 0) {
      document.getElementById("projectStatsContainer").innerHTML = `This project was not worked on during this time interval.`
      return
    }

    project = await AwaitMessage({ command: "getProject", path: projectSelectMenu.selectedOptions[0].value, type: timeRangeSelectMenu.selectedOptions[0].value }) 
    document.getElementById("projectStatsContainer").innerHTML = BuildProjectHTMLView(project)
  })
  
  projectSortSelectMenu.addEventListener("change", () => {
    let value = projectSortSelectMenu.selectedOptions[0].value
    if (value == "alphabetical" || value == "time") {
      SortAndBuildProjectInfo(value)
    } else {
      console.log(`Oops, unknown choice for project sort select menu.`)
    }
  })

  return contentContainer
}

/**
 * Builds an HTML container for the project stats + info. It does not include the top title and project selector. That is in `BuildCompleteProjectHTMLView`
 * @param { pw.ProjectMessage } project
 * 
 * @returns { string } HTML of the project content. 
 */
function BuildProjectHTMLView (project) {
  //no project found
  if (!project.stats || !project.data) {
    return `<span>No Project Selected</span><br>`
  }

  let containderData = `<span class="miniTitle">Current Project - Info</span><br>`
  containderData += `Path: ${project.stats.path} <br> Name: [] <br>`

  containderData += CodeTimeHTMLView(project)

  //add the toggling of the detailed flag later:tm:
  containderData += CodeModifiedHTMLView(project.data.edits, true) 

  // <span class="miniTitle">Top Languages</span><br>
  return containderData
}