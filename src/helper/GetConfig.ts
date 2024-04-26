import vscode from "vscode"
import { BackendResponseMapping } from "../../shared/MessageTypes"

/**
 * Gets the vscode configuration for this extension(`zecroStatTracker.${name}`).
 * @param name config property to get.
 * @returns the value the configuration is set to. Or null if there was an issue getting it.
 */
export function GetConfig<T> (name: string): null | T {
  const extConfig = vscode.workspace.getConfiguration("zecroStatTracker")

  if (!extConfig) {
    return null
  }

  return extConfig.get(name) as T
}

/**
 * @returns If we should be tracking stats.
 */
export function IsTrackingStats () {
  const isTracking = GetConfig<boolean>("statTracking.trackStats")

  // Since it may be null.
  return isTracking !== false
}

/**
 * If this is a document we should show the word counter on based on user settings.
 * @param currentLanguage language Id of the current document.
 * @param currentDocument text document being edited.
 * @returns if the word counter should be displayed.
 */
export function IsWordCountDocument (currentLanguage: string | undefined = "none", currentDocument: vscode.TextDocument | undefined) {
  if (!currentDocument) {
    return false
  }

  const config = GetConfig<string>("accessories.wordCounting")

  // None or the stat wasn't found.
  if (!config) {
    return false
  }

  const wordCountDocuments = config.split(",").map(item => item.trim())
  const currentFile = currentDocument.fileName

  if (wordCountDocuments.includes("txt") && currentLanguage == "plaintext") {
    return true
  }

  return wordCountDocuments.some(item => currentFile.endsWith(item))
}

/**
 * Gets the default ignored/allowed files/globs for the progress webview stat counter from settings.
 * @returns the ignore and allowed files/globs
 */
export function GetDefaultIANames () {
  const allowed = GetConfig<string>("fileCounting.defaultAllowedFilesEndings")
  const exclude = GetConfig<string>("fileCounting.defaultExcludedFiles")

  // This should not happen.
  if (allowed === null || exclude === null) {
    throw new Error(`Unable to find default configuration for allowed and exclude files.`)
  }

  // Turns the default input into a list of values.
  const convert = (item: string) => item.split(",").map(i => i.trim()).filter(i => i.length > 0)

  return {
    allowed: convert(allowed),
    ignored: convert(exclude)
  }
}

/**
 * Gets the settings for if files in gitignore or vscodeignore should be ignored.
 * @returns obj with setting states.
 */
export function GetStatCounterConfig (): BackendResponseMapping["getSearchIgnores"] {
  const ignoredGitignore = GetConfig<boolean>("fileCounting.ignoredGitignore")
  const ignoreVscodeIgnore = GetConfig<boolean>("fileCounting.ignoreVscodeIgnore")

  // This should not be happening.
  if (ignoreVscodeIgnore === null || ignoredGitignore === null) {
    throw new Error(`Failed to find settings for file ignoring.`)
  }

  return { ignoredGitignore, ignoreVscodeIgnore }
}