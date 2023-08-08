//this file is to handle the message passing between vscode and the extension. 
import { BaseMessage, BackendResponse, ServerCommand, ServerCommandConstruct } from "../shared/MessageTypes"

type PromiseResolvable = (value: unknown) => void

//@ts-ignore
const vscodeAPI: any = acquireVsCodeApi()
const messageQueue: Map<number, PromiseResolvable | BaseMessage> = new Map()
var Ids = 1

/**
 * Mappings: 
 * mostUsedLanguages -> MostUsedLanguagesResponse
 * extensionStartDate -> NumberResponse
 * statsJSONData -> JSONResponse
 * updateUsageData -> BaseMessage
 * projectPath -> (BaseMessage | JSONResponse)
 * colourTheme -> NumberResponse
 * progressObject -> ProgressObjectResponse
 * getProject/currentProject -> (BaseMessage | ProjectResponse)
 * allProjectInfos -> AllProjectInfo
 * scanLines -> (BaseMessage | FileStatsInfo)
 * updateIANames -> BaseMessage
 * 
 * updateProjectName -> BaseMessage
 * mergeProjects -> BaseMessage
 */

/**
 * Waits for the vscode extension backend to reply to the message. 
 * @param message message command to send the server.
 * @returns the response from the server.
 */
export async function AwaitMessage (message: ServerCommandConstruct): Promise<BackendResponse> {
  let processId = Ids
  Ids++
  
  let sendMessage: ServerCommand = {
    ...message,
    id: processId
  }

  await new Promise(resolve => {
    messageQueue.set(processId, resolve)
    vscodeAPI.postMessage(sendMessage)
  })

  let returnMessage = messageQueue.get(processId)
  messageQueue.delete(processId)
  
  return returnMessage as BackendResponse
}

window.addEventListener("message", receiveMessage => {
  let message = receiveMessage.data as BaseMessage

  if (messageQueue.has(message.id)) {
    ;(messageQueue.get(message.id) as PromiseResolvable)(null)
    messageQueue.set(message.id, message)
  }
})