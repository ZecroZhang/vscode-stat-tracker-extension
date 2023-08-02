//this file is to handle the message passing between vscode and the extension. 

//Env variables
const vscodeAPI = acquireVsCodeApi()
const messageQueue = new Map()
var Ids = 1

/**
 * Waits for the vscode extension backend to reply to the message. 
 * @param { unknown } message 
 * @returns 
 */
async function AwaitMessage (message) {
  var processId = Ids
  Ids++
  message.id = processId
  await new Promise(resolve => {
    messageQueue.set(processId, resolve)
    vscodeAPI.postMessage(message)
  })
  var returnMessage = messageQueue.get(processId)
  messageQueue.delete(processId)
  return returnMessage
}

window.addEventListener("message", message => {
  message = message.data
  if (messageQueue.has(message.id)) {
    messageQueue.get(message.id)()
    messageQueue.set(message.id, message)
  }
})