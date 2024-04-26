import { GraphTypes } from "../../shared/MessageTypes"
import { TimeRangeNames } from "../../src/structs/structs"
import { AwaitMessage } from "./MessageHandler"
import { AddOptions, SelectMenuOptions } from "./utility"

interface SelectMenus {
  timeRangeSelectMenu: HTMLSelectElement
  statsFromSelectMenu: HTMLSelectElement
  typeSelectMenu: HTMLSelectElement
  subtypeSelectMenu: HTMLSelectElement
}

/**
 * Sets the selected item for the select menu type. This automatically changes the sub type if this changes. 
 * @param elements the 4 main select menus.
 * @param value new type of this select menu.
 */
export function SetTypeMenu (elements: SelectMenus, value: GraphTypes) {
  // Populate the menu if no entries.
  if (elements.typeSelectMenu.childElementCount == 0) {
    const menuItems: SelectMenuOptions[] = [
      { name: "Time", value: "time" },
      { name: "Lines", value: "lines" },
      { name: "Characters", value: "characters" },
      { name: "Characters without bulk", value: "charactersWB" }
    ]

    AddOptions(elements.typeSelectMenu, menuItems)

    elements.typeSelectMenu.selectedIndex = 0
  }

  const subMenu = elements.subtypeSelectMenu
  const subType = subMenu.selectedOptions[0]?.value

  const isTime = value == "time"
  const subTypeIsTime = [ "active", "total" ].includes(subType)

  // Either isTime && !subTypeIsTime or !isTime && subTypeIsTime
  if (isTime == !subTypeIsTime) {
    subMenu.innerHTML = ""

    const newChildren: SelectMenuOptions[] = isTime ? [
      { name: "Total", value: "total" },
      { name: "Active", value: "active" }
    ] : [
      { name: "Net", value: "net" },
      { name: "Added", value: "added" },
      { name: "Removed", value: "removed" }
    ]

    AddOptions(subMenu, newChildren)

    subMenu.selectedIndex = 0
  }
}

/**
 * Regenerates the projects select menu to work with the current time range. Call this once at the start and whenever the time range is changed.
 * @param elements the 4 select menus
 * @param value either languages, projects or the path to a project.
 * @param timeRange selected time range
 */
export async function SetStatsFromMenu (elements: SelectMenus, value: string, timeRange: TimeRangeNames) {
  const fromMenu = elements.statsFromSelectMenu
  const options: SelectMenuOptions[] = [
    { name: "Languages", value: "languages" },
    { name: "Projects", value: "projects" }
  ]

  let { projects } = await AwaitMessage({ command: "allProjectInfo", timeRange })
  projects = projects.sort((a, b) => b.time - a.time) // Descending order sort.
  let valueIndex = [ "languages", "projects" ].indexOf(value)

  // Reset what's there and add the new items
  fromMenu.innerHTML = ""
  for (let i = 0; i < projects.length; i++) {
    let project = projects[i]

    options.push({
      name: `${project.name} - languages`,
      value: project.path
    })

    if (project.path == value) {
      valueIndex = i + 2 // The two items at the front.
    }
  }

  AddOptions(fromMenu, options)

  // Init types if not already.
  if (elements.typeSelectMenu.childElementCount == 0) {
    SetTypeMenu(elements, "time")
  }

  // Select the right item, or default to unknown.
  if (valueIndex == -1) {
    valueIndex = 0
  }
  fromMenu.selectedIndex = valueIndex
}

/**
 * Call this when the time range is changed. And once at the start to set everything up.
 * @param elements the 4 select menus
 * @param value selected time range
 */
export async function SetTimeRangeMenu (elements: SelectMenus, value: TimeRangeNames) {
  const select = elements.timeRangeSelectMenu

  // Create the 3 children.
  if (select.childElementCount == 0) {
    const childData: {
      name: string
      value: TimeRangeNames
    }[] = [
      { name: "All Time", value: "allTime" },
      { name: "This Week", value: "weeklyTime" },
      { name: "Today", value: "todayTime" }
    ]

    AddOptions(select, childData)
  }

  // Set the value.
  select.selectedIndex = {
    "allTime": 0,
    "weeklyTime": 1,
    "todayTime": 2
  }[value]

  // Check that the stats from is still valid.
  const statsFrom = elements.statsFromSelectMenu
  if (statsFrom.childElementCount == 0) {
    SetStatsFromMenu(elements, "languages", value)
  } else if (![ 0, 1 ].includes(statsFrom.selectedIndex)) {
    // Check if the project path is valid.
    let path = (statsFrom.children[statsFrom.selectedIndex] as HTMLOptionElement).value

    let project = await AwaitMessage({ command: "getProject", timeRange: value, path })

    // This project can no longer be selected.
    if (project.error) {
      path = "languages"
    }
    SetStatsFromMenu(elements, path, value)
  } else {
    SetStatsFromMenu(elements, statsFrom.selectedOptions[0]?.value, value)
  }
}
