import { DeepPartial } from "./structs"

/**
 * Tracks amount of time spent. Both in the window(active) and with the window open(total).
 */
export class TimeAllocation {
  totalTime: number
  activeTime: number

  constructor (timeAllocation?: DeepPartial<TimeAllocation>) {
    this.totalTime = Number(timeAllocation?.totalTime) || 0
    this.activeTime = Number(timeAllocation?.activeTime) || 0
  }

  /**
   * Adds another object instance to this one. Missing properties are ignored.
   * @param timeAllocation other instance.
   */
  combine (timeAllocation: TimeAllocation) {
    this.totalTime += Number(timeAllocation.totalTime) || 0
    this.activeTime += Number(timeAllocation.activeTime) || 0
  }
}
