import { DeepPartial } from "./structs"

/**
 * Class for keeping track of addition and deletion changes.
 */
export class NetAddRemove {
  /**
   * Amount added.
   */
  added: number
  /**
   * Amount removed. 
   */
  removed: number
  /**
   * The net change of the thing. Should be added - removed 
   */
  net: number

  constructor ( constructionValue?: DeepPartial<NetAddRemove> ) {
    this.added = constructionValue?.added || 0
    this.removed = constructionValue?.removed || 0
    this.net = this.added - this.removed
  }

  /**
   * Removes stats from the object.
   * @param removeInput Data to remove from this object.
   */
  remove (removeInput?: DeepPartial<NetAddRemove>) {
    this.added -= removeInput?.added || 0
    this.removed -= removeInput?.removed || 0
    this.net -= removeInput?.net || 0
  }

  /**
   * Combines a second class instance of this class. Missing properties are ignored.
   * @param data other instance.
   */
  combine (data: DeepPartial<NetAddRemove>) {
    const keys = [ "added", "removed", "net" ] as const

    for (let key of keys) {
      // Ignore the property if it's NaN(probably undefined). Using not null assertion because this is the isNaN function... 
      if (isNaN(data[key]!)) {
        continue
      }

      // Add the key to ours... ours should never be undefined 
      this[key] += Number(data[key])
    }
  }

  /**
   * Sets everything back to 0. 
   */
  clear () {
    this.added = 0
    this.removed = 0 
    this.net = 0 
  }
}