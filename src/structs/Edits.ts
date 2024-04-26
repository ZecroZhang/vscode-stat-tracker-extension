import { NetAddRemove } from "./NetAddRemove"
import { DeepPartial } from "./structs"

const netAddRemoveKeys = [ "characters", "lines", "charactersWB" ] as const
/**
 * Edits statistics for lines, characters and characters without bulk.
 */
export class Edits {
  // The following be defined in the loop. 
  /**
   * Lines modified. 
   */
  lines!: NetAddRemove
  /**
   * Characters modified. 
   */
  characters!: NetAddRemove
  /**
   * Characters modified without counting bulk modification, such as copy and paste or autofill. 
   */
  charactersWB!: NetAddRemove

  constructor (editInput?: DeepPartial<Edits>) {
    for (let item of netAddRemoveKeys) {
      this[item] = new NetAddRemove(editInput?.[item])
    }
  }

  /**
   * Adds the edit stats from another class to this one. Missing properties are ignored.
   * @param edits Another Edits class.
   */
  combine (edits: Edits) {
    for (let item of netAddRemoveKeys) {
      this[item].combine(edits[item])
    }
  }

  /**
   * Resets all stats. 
   */
  clear () {
    this.lines.clear()
    this.characters.clear()
    this.charactersWB.clear()
  }
}
