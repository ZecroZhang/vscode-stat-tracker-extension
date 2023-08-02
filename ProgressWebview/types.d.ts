import { NetAddRemove, ProjectStats, ProjectStatsInfo, TimeAllocation, UsageTimeInterface } from "../src/Structures"

interface BaseMessage {
  id: string
}

//Created from ProgressObject() in ViewProgressHandler.ts
interface ProgressObjectMessage extends BaseMessage {
  activeTime: string
  totalTime: string
  resets: number | null

  lines: NetAddRemove
  characters: NetAddRemove
  charactersWB: NetAddRemove

  projects: ProjectStats[]
  cps: number | "unknown"
}

interface DateMessage extends BaseMessage {
  date: Date
}

interface ProjectMessage extends BaseMessage {
  data?: ProjectStats
  activeTime: string
  totalTime: string
  stats?: ProjectStatsInfo
}

interface AllProjectInfoMessage extends BaseMessage {
  data: {
    name: string
    path: string,
    time: number //total time in ms
  }[]
}

interface ColourThemeMessage extends BaseMessage {
  data: 0 | 1 //0 for black and 1 for white. 
}

type TimeTitle = "Today" | "This Week" | "All Time"
type TimeRequest = "allTime" | "weeklyTime" | "todayTime"
type TimeRangeHTMLIds = "todayProgressDiv" | "weeklyProgressDiv" | "totalProgressDiv"

export as namespace pw //progress wevbiew 