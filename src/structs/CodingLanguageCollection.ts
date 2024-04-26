import { CodingLanguage } from "./CodingLanguage"
import { DeepPartial } from "./structs"

/**
 * A mapping of coding language names to their respective stat objects.
 */
export class CodingLanguageCollection {
  [ key: string ]: CodingLanguage

  constructor (codingLanguageCollection?: DeepPartial<CodingLanguageCollection>) {
    if (!codingLanguageCollection) {
      return
    }

    let languageKeys = Array.from(Object.keys(codingLanguageCollection))

    for (let language of languageKeys) {
      this[language] = new CodingLanguage(codingLanguageCollection[language])
    }
  }

  /**
   * Adds the languages(or merges) of the second coding language instance to the first.
   * @param current instance to add stats to (first instance)
   * @param languages instance that gives the stats (second)
   */
  static combine (current: CodingLanguageCollection, languages: DeepPartial<CodingLanguageCollection>) {
    let languageNames = Array.from(Object.keys(languages))

    for (let language of languageNames) {
      if (current[language]) { // if exists, merge
        current[language].combine(new CodingLanguage(languages[language]))
      } else { // doesn't exist, add new. 
        current[language] = new CodingLanguage(languages[language])
      }
    }
  }
} 
