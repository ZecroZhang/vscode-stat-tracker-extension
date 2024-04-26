import vscode from "vscode"
import { Plural } from "../shared/functions"
import { IsWordCountDocument } from "./helper/GetConfig"

/**
 * Regex that matches the white spaces and punctuation between words.
 * Duplicate white space and punctuation will be ignored. Ie "hello  world" matches one space.
 * So it will always count 1 less than the number of words, unless the document is an empty string.
 */
const wordRegex = /[\s,.;\(\)](?=\S)(?![\.,!])/g

interface WordCount {
  selected: number
  total: number
}

const wordCounter: WordCount = {
  selected: 0,
  total: 0
}

let wordCounterBarItem: vscode.StatusBarItem
/**
 * For `UpdateWordCount` so it only updates when the language is correct.
 */
let isValidDocument: boolean = false

/**
 * Sets up the status bar word counter.
 * @param currentLanguage languageId of the current language being used.
 * @param currentDocument current TextDocument if there is one. 
 */
export function InitWordCounter (currentLanguage: string | undefined = "none", currentDocument: vscode.TextDocument | undefined) {
  wordCounterBarItem = vscode.window.createStatusBarItem("wordCount", 2, 10)
  wordCounterBarItem.command = "zecrosUtility.countStats"

  isValidDocument = IsWordCountDocument(currentLanguage, currentDocument)

  // !currentDocument is checked in the function. This is just to help TypeScript's control flow
  if (!isValidDocument || !currentDocument) {
    wordCounterBarItem.hide()
  } else {
    let documentText = currentDocument.getText()

    UpdateInternalWordCount(documentText)
    UpdateWordCountDisplay()

    wordCounterBarItem.show()
  }
}

/**
 * Function called when the document changes. This shows the text counter status item when it changes to a plaintext document, otherwise hides it.
 * @param currentLanguage `TextDocument.languageId`
 * @param currentDocument current vscode text document that's open.
 */
export function WordCountDocumentChange (currentLanguage: string, currentDocument: vscode.TextDocument | undefined) {
  isValidDocument = IsWordCountDocument(currentLanguage, currentDocument)
  if (!currentDocument || !isValidDocument) {
    wordCounterBarItem.hide()
    return
  }

  wordCounterBarItem.show()

  UpdateWordCount(currentDocument)
}

/**
 * This updates the word counter in the status bar for when the user selects something.
 * @param currentLanguage id of the current language.
 * @param editor selection editor 
 */
export function UpdateSelectionWordCount (currentLanguage: string | undefined = "none", editor: vscode.TextEditorSelectionChangeEvent) {
  if (!IsWordCountDocument(currentLanguage, editor.textEditor.document) ) {
    return
  }

  if (editor.selections[0].isEmpty) {// I'll save the keyboard updates for a bit  || editor.kind == 2
    wordCounter.selected = 0
    UpdateWordCountDisplay()
    return
  }

  let wordCount = 0
  editor.selections.forEach(selection => {
    const text = editor.textEditor.document.getText(selection)
    const wordSeparators = text.match(wordRegex)

    // This was originally a bug but it's better if it doesn't count partial selections of a word. 
    // Otherwise, there'd be over counting of words by using multiple selections.
    if (text && wordSeparators?.length) {
      wordCount += (wordSeparators?.length ?? 0) + 1
    }
  })

  // Since there's at least selection. This doesn't completely solve the under/over counting but it helps minimize it.
  if (wordCount == 0) {
    wordCount = 1
  }

  wordCounter.selected = wordCount
  UpdateWordCountDisplay()
}

/**
 * Time the word counter was last updated by UpdateDocumentTypeChangeWordCount to prevent too many word count updates(it's a slow process).
 */
let antiLagTimeout = Date.now()

/**
 * Call this function when the document's text changes. This modifies the word counter in 2.5 seconds from now and limits it to that to prevent lag.
 * @param currentDocument current editor document.
 */
export function UpdateWordCount (currentDocument: vscode.TextDocument) {
  if (Date.now() - antiLagTimeout <= 2500 || !isValidDocument) {
    return
  }

  // As ones will be rejected for the next 2.5s, this timeout is to ensure everything is up to date.
  setTimeout(() => {
    UpdateInternalWordCount(currentDocument.getText())
    UpdateWordCountDisplay()
  }, 2500)
  
  antiLagTimeout = Date.now()
}

/**
 * Updates the data stored in `wordCounter`.
 * @param text This is the text from the current vscode editor document.
 */
function UpdateInternalWordCount (documentText: string | undefined) {
  wordCounter.total = CountWords(documentText)
}

/**
 * Counts the amount of words in the document, using the `wordRegex`.
 * @param documentText The text from the document. Ie `vscode.TextDocument.getText()`
 * @returns amount of words(it's not off by 1).
 */
export function CountWords (documentText?: string) {
  // The len > 0 is bc the regex under counts by 1 always, with the exception of the document being empty. 
  if (documentText !== undefined && documentText.length > 0) {
    let wordSeparators = documentText.match(wordRegex)

    return wordSeparators ? wordSeparators.length + 1 : 1
  } else {
    return 0
  }
}

/**
 * Sets the status bar word counter to the current value in `wordCounter`
 */
function UpdateWordCountDisplay () {
  const total = wordCounter.total
  const selected = wordCounter.selected

  wordCounterBarItem.text = `${total} ${Plural("word", total)}${selected > 0 ? `(${selected} selected)` : ""}`
}