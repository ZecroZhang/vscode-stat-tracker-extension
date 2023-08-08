import React from "react"
import ReactDOM from "react-dom"

import { AllProjectInfo, ErrorResponse, ProjectResponse } from "../shared/MessageTypes"
import { AwaitMessage } from "./MessageHandler"
import { containerDivs } from "./GenerateBody"
import { CodeModifiedHTMLView, CodeTimeHTMLView } from "./RangeProgress"
import { CreateLineInput } from "./Utility"

export async function SetUpProjectStats () {
  //constructs the project html. 
  let currentProjectData = await AwaitMessage({ command: "currentProject", type: "allTime" }) as ProjectResponse
  containerDivs.projectProgress.appendChild(await BuildCompleteProjectHTMLView(currentProjectData))
}

/**
 * Builds the entire projects section. From title to the project data.  
 * @param project 
 * @returns { Promise<HTMLDivElement> } the two elements to be added in order. 
 */
async function BuildCompleteProjectHTMLView (project: ProjectResponse): Promise<HTMLDivElement> {
  let contentContainer = document.createElement("div")

  ReactDOM.render(
    <>
      <span className="subTitle">Projects</span><br/>
      Project <select id="projectSelectMenu"></select> Time Range <select id="timeRangeSelectMenu"></select><br/>
      Sort projects <select id="projectSortSelectMenu"></select><br/>
      <div id="projectStatsContainer">{BuildProjectHTMLView(project)}</div>
    </>,
    contentContainer
  )

  let projectSelectMenu = contentContainer.querySelector("#projectSelectMenu") as HTMLSelectElement
  let timeRangeSelectMenu = contentContainer.querySelector("#timeRangeSelectMenu") as HTMLSelectElement
  let projectSortSelectMenu = contentContainer.querySelector("#projectSortSelectMenu") as HTMLSelectElement

  /**
   * 
   * @param menu 
   * @param { { name: string, value: string }[] } options 
   */
  let AddOptions = (menu: HTMLSelectElement, options: { name: string; value: string }[]) => {
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
  let projectInfoSort: { [key: string]: ((projectInfoResponse: AllProjectInfo) => void) } = {
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
  type SortTypes = "alphabetical" | "time"

  let SortAndBuildProjectInfo = async (type: SortTypes) => {
    let projectInfoResponse = await AwaitMessage({ command: "allProjectInfos", type: timeRangeSelectMenu.selectedOptions[0].value }) as AllProjectInfo
    
    //sort it. 
    projectInfoSort[type](projectInfoResponse)

    //remove any existing one.
    for (let i = projectSelectMenu.children.length-1; i > 0; i --) {
      projectSelectMenu.removeChild(projectSelectMenu.children[i])
    }

    if (projectSelectMenu.childElementCount == 0) {
      ReactDOM.render(<option value="" disabled selected>None Selected</option>, projectSelectMenu)
    }
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
      if (projectInfo.path == project.info?.path) {
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
    project = await AwaitMessage({ command: "getProject", path: projectPath, type: timeRangeSelectMenu.selectedOptions[0].value }) as ProjectResponse

    ReactDOM.render(BuildProjectHTMLView(project), document.getElementById("projectStatsContainer"))
    if (project.info) {
      (document.getElementById("projectNameInput") as HTMLTextAreaElement).value = project.info.name
    }
  })

  timeRangeSelectMenu.addEventListener("change", async () => {
    //This is so that when the time range is changed but there was originally no project selected(because a project folder wasn't open), it won't say the project wasn't worked on. What a random bug... 
    let originalIndex = projectSelectMenu.selectedIndex

    await SortAndBuildProjectInfo(projectSortSelectMenu.selectedOptions[0].value as SortTypes)

    if (projectSelectMenu.selectedIndex == 0 && originalIndex != 0) {
      ReactDOM.render(<span>This project was not worked on during this time interval.</span>, document.getElementById("projectStatsContainer"))
      return
    }

    let path = projectSelectMenu.selectedOptions[0].value
    let type = timeRangeSelectMenu.selectedOptions[0].value

    project = await AwaitMessage({ command: "getProject", path, type }) as ProjectResponse
    ReactDOM.render(BuildProjectHTMLView(project), document.getElementById("projectStatsContainer"))
  })
  
  projectSortSelectMenu.addEventListener("change", () => {
    let value = projectSortSelectMenu.selectedOptions[0].value
    if (value == "alphabetical" || value == "time") {
      SortAndBuildProjectInfo(value)
    } else {
      console.error(`Oops, unknown choice for project sort select menu.`)
    }
  })

  return contentContainer
}

/**
 * Builds an HTML container for the project stats + info. It does not include the top title and project selector. That is in `BuildCompleteProjectHTMLView`
 * @param project the response from a backend project request. 
 * @returns 
 */
function BuildProjectHTMLView (project: ProjectResponse) {
  //no project found
  if (!project.project || !project.info) {
    return (
      <>
        <span>No Project Selected</span> <br/>
      </>
    )
  }

  let projectPath = project.path

  //This function gets called as each character is typed in. I don't think matter too much right now since saving is only triggered every x minutes.
  //I'll optimize this later. 
  let SetProjectName = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    //Currently capping it at 256. 
    let name = event.target.value.substring(0, 256)
    
    await AwaitMessage({ command: "updateProjectName", name, path: projectPath })
  }

  let MergeProject = async () => {
    let pathInput = document.getElementById("mergeProjectInput") as HTMLTextAreaElement

    let otherPath = pathInput.value.trim()
    pathInput.value = ""

    //Not going to throw an error for empty strings incase of a double click or something. 
    if (!otherPath) {
      return
    }

    let errorDisplay = document.getElementById("mergeProjectErrorDisplay") as HTMLSpanElement 

    if (otherPath == projectPath) {
      errorDisplay.innerText = "Projects cannot be merged with themselves.\n"
      return
    }

    let result = await AwaitMessage({ command: "mergeProjects", paths: [ projectPath, otherPath ] })

    if ((result as ErrorResponse).error) {
      result = result as ErrorResponse
      
      errorDisplay.innerText = result.errorMessage + "\n"
      return
    }
    errorDisplay.innerText = ""

    //Get rid of the merged project from the select menu. 
    let projectSelectMenu = document.getElementById("projectSelectMenu") as HTMLSelectElement
    let otherProjectIndex: number | null = null

    for (let i = 0; i < projectSelectMenu.childElementCount; i++) {
      if ((projectSelectMenu.children[i] as HTMLOptionElement).value == otherPath) {
        otherProjectIndex = i
        break
      }
    }

    if (otherProjectIndex !== null) {
      projectSelectMenu.removeChild(projectSelectMenu.children[otherProjectIndex])
    }

    let timeRangeSelectMenu = document.getElementById("timeRangeSelectMenu") as HTMLSelectElement
    let timeRange = timeRangeSelectMenu.selectedOptions[0].value

    //Reload the project.
    let project = await AwaitMessage({ command: "getProject", path: projectPath, type: timeRange }) as ProjectResponse
    let statsContainer = document.getElementById("projectStatsContainer") as HTMLDivElement

    ReactDOM.render(BuildProjectHTMLView(project), statsContainer)
  }

  return (
    <>
      <span className="miniTitle">Current Project - Info</span><br/>
      Path: { project.info.path } <br/>

      <div className="listItem">
        <div className="textLine">Name: </div>
        <textarea className="smallLineInputTextarea textLine" onChange={ SetProjectName } defaultValue={project.info.name} id="projectNameInput"></textarea>
      </div>

      { CodeTimeHTMLView(project.project.timeAllocation) }
      { CodeModifiedHTMLView(project.project.edits, true) }

      { CreateLineInput("Merge With: ", <textarea className="smallLineInputTextarea textLine" id="mergeProjectInput"></textarea>) }
      <button onClick={MergeProject}>Merge Project</button><br/>
      <span id="mergeProjectErrorDisplay" className="redText"></span>
      Note: the project entered above(one being merged) will be deleted.
    </>
  )
}