//Some helper functions 
import React from "react"

/**
 * Creates a div element that goes `name: [text area]`, where the items are centered vertically and the textarea is the smaller version. 
 * @param name field name. Recommended to leave a space at the end. 
 * @param textarea include `smallLineInputTextarea textLine` as the className. 
 * @returns listItem div
 * @todo I wonder if I can move the textarea className into the function... 
 */
export function CreateLineInput (name: string, textarea: React.JSX.Element) {
  return (
    <div className="listItem">
      <div className="textLine">{name}</div>
      { textarea }
    </div>
  )
}