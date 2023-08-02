import * as vscode from "vscode"

const wordRegex = /[\s,.;\(\)](?=\S)(?![\.,!])/g
var wordCounterArr: [ null | number | Array<String>, null | number ] = [ null, null ] //This array is so confusing. 

var wordCounter: vscode.StatusBarItem

export function InitWordCounter (currentLanguage: string | undefined = "none", currentDocument?: vscode.TextDocument) {
  wordCounter = vscode.window.createStatusBarItem("wordCount", 2, 10)
  wordCounter.command = "zecrosUtility.countStats"

  if (currentLanguage != "plaintext" || !currentDocument) {
    wordCounter.hide()
  } else {
    var documentText = currentDocument.getText()
    if (documentText) {
      wordCounterArr[0] = documentText.match(wordRegex)
      wordCounterArr[0] = wordCounterArr[0] == null ? 1 : wordCounterArr[0].length + 1
    } else wordCounterArr[0] = 0

    UpdateWordCount()
    wordCounter.show()
  }
}

export function ChangeDocumentShowHideTextCount (currentLanguage: string, currentDocument: vscode.TextDocument) {
  if (currentLanguage == "plaintext") {
    var documentText = currentDocument.getText()
    if (documentText) {
      wordCounterArr[0] = documentText.match(wordRegex)
      wordCounterArr[0] = wordCounterArr[0] == null ? 1 : wordCounterArr[0].length + 1
    } else wordCounterArr[0] = 0
    wordCounter.show()

  } else wordCounter.hide()
}

export function UpdateSelectionWordCount (currentLanguage: string | undefined = "none", editor: vscode.TextEditorSelectionChangeEvent) {
  //This is for plain text 
  if (currentLanguage != "plaintext") return
  if (editor.selections[0].isEmpty) {//I'll save the keyboard updates for a bit  || editor.kind == 2
    wordCounterArr[1] = null
    UpdateWordCount()
  }
  var wordCount = 0
  editor.selections.forEach(selection => {
    var text = editor.textEditor.document.getText(selection).match(wordRegex)
    if (text) {
      wordCount += text.length+1
    }
  })
  wordCounterArr[1] = wordCount
  UpdateWordCount()
}

var antiLagTimeout = Date.now()

export function UpdateDocumentTypeChangeWordCount (currentDocument: vscode.TextDocument) {
  if (Date.now()-antiLagTimeout > 2500) {
    setTimeout(() => {
      wordCounterArr[0] = (currentDocument.getText().match(wordRegex) || "").length+1
      UpdateWordCount()
    }, 2500)
    antiLagTimeout = Date.now()
  }
}

function UpdateWordCount() {
  wordCounter.text = `${wordCounterArr[0]} word${wordCounterArr[0] == 1 ? "" : "s"}${wordCounterArr[1] ? `(${wordCounterArr[1]} selected)` : ""}`
}