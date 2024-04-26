// this file is to handle the message passing between vscode and the extension. 
import { BaseMessage, ProgressWebviewCommands, CompleteBackendResponse, CommandRequestMappings } from "../../shared/MessageTypes"

type PromiseResolvable = (value: unknown) => void

// @ts-ignore
const vscodeAPI: any = acquireVsCodeApi()
const messageQueue: Map<number, PromiseResolvable | BaseMessage> = new Map()
var Ids = 1

// Same as the one in MessageTypes but this one doesn't have the id property, since it's only added in `AwaitMessage`
type BaseRequest<C> = {
  command: C
}

type ClientRequest<C extends ProgressWebviewCommands> = C extends keyof CommandRequestMappings ? BaseRequest<C> & CommandRequestMappings[C] : BaseRequest<C>

/**
 * Waits for the vscode extension backend to reply to the message. 
 * @param message check comments for `ClientRequestMessage` and `CommandRequestMappings`
 * @returns response as dictated by `BackendResponseMapping`
 */
export async function AwaitMessage<C extends ProgressWebviewCommands> (message: ClientRequest<C>): Promise<CompleteBackendResponse<C>> {
  let processId = Ids
  Ids++
  
  let sendMessage = {
    ...message,
    id: processId
  }

  await new Promise(resolve => {
    messageQueue.set(processId, resolve)
    vscodeAPI.postMessage(sendMessage)
  })

  let returnMessage = messageQueue.get(processId)
  messageQueue.delete(processId)
  
  return returnMessage as CompleteBackendResponse<C>
}

window.addEventListener("message", receiveMessage => {
  let message = receiveMessage.data as BaseMessage

  if (messageQueue.has(message.id)) {
    ;(messageQueue.get(message.id) as PromiseResolvable)(null)
    messageQueue.set(message.id, message)
  }
})