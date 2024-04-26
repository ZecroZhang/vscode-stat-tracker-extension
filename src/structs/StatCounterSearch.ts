import { DeepPartial } from "./structs"

/**
 * Stores the details of the project stat counter on the webview.
 */
export class StatCounterSearch {
  path: string
  allowedFileExtensions: string[]
  ignoredFileFolderNames: string[]
  /**
   * If the allowed/ignored arrays are still the default value. If this is true, it will be automatically replaced when scanning.
   */
  isDefaultIA: boolean

  constructor (statCounterSearch?: DeepPartial<StatCounterSearch>) {
    this.path = statCounterSearch?.path || ""
    this.allowedFileExtensions = statCounterSearch?.allowedFileExtensions || []
    this.ignoredFileFolderNames = statCounterSearch?.ignoredFileFolderNames || []

    this.isDefaultIA = statCounterSearch?.isDefaultIA ?? true
  }
}
