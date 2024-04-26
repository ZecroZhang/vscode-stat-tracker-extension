import { Edits } from "./Edits"
import { TimeAllocation } from "./TimeAllocation"
import { DeepPartial } from "./structs"

/**
 * The stats of a coding language.
 */
export class CodingLanguage {
  time: TimeAllocation
  edits: Edits

  constructor (constructionInput?: DeepPartial<CodingLanguage>) {
    this.time = new TimeAllocation(constructionInput?.time)
    this.edits = new Edits(constructionInput?.edits)
  }

  /**
   * Combines this CodingLanguage with another CodingLanguage. Missing properties are ignored.
   * @param codingLanguageObject Another CodingLanguage class.
   */
  combine (codingLanguageObject?: DeepPartial<CodingLanguage>) {
    this.time.combine(new TimeAllocation(codingLanguageObject?.time))
    this.edits.combine(new Edits(codingLanguageObject?.edits))
  }
}
