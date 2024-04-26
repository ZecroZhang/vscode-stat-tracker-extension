/**
 * Converts milliseconds to a human readable time format. 
 * @param timeMs The amount of time in milliseconds.
 * @param precision The amount of decimal precision on the seconds. This MUST be nonnegative. Defaults to no subsecond precision.
 * @returns Time in the format x time unit separated by commas with an and in between the last two. Eg: 14 hours, 33 minutes, and 52 seconds.
 */
export function MsToTime (timeMs: number, precision: number = 0): string {
  // Check if the input is negative. If so, set it to the absolute value.
  let pastTense = timeMs < 0
  if (pastTense) {
    timeMs = Math.abs(timeMs)
  }

  let hours = Math.floor(timeMs / 3600000)
  let minutes = Math.floor(timeMs / 60000) % 60
  let seconds = (timeMs/1000) % 60

  let timeBuilder: string[] = []

  if (hours > 0) timeBuilder.push(`${hours} ${Plural("hour", hours)}`)
  if (minutes > 0) timeBuilder.push(`${minutes} ${Plural("minute", minutes)}`)
  // Seconds gets rounded to the nearest whole second. This may lead to '1.4 second' instead of '1.4 seconds'
  if (seconds > 0) timeBuilder.push(`${seconds.toFixed(precision)} ${Plural("second", Math.round(seconds*100)/100)}`)

  if (!timeBuilder.length) return `0 seconds`

  let textBuilder: string
  if (timeBuilder.length == 1) {
    textBuilder = timeBuilder.toString()
  } else {
    let temp = timeBuilder.pop() // Hold the last item. We want to insert an "and" before the last item. 
    textBuilder = `${timeBuilder.join(", ")}, and ${temp}`
  }

  if (pastTense) {
    textBuilder += " ago"
  }
  return textBuilder
}

/**
 * Makes the word plural if it is not one.
 * @param word The word to make plural depending on the amount.
 * @param amount Amount of this item.
 * @param type 0 means to add an s, 1 is to add es, and 2 is to double the last letter and add es. Defaults to 0 (adding an s).
 * @returns The word pluralized or not depending on amount.
 */
export function Plural (word: string, amount: number , type?: 1 | 2 | 0 ): string {
  if (amount === 1) return word 

  if (type === 1) return `${word}es`
  else if (type === 2) return `${word}${word.charAt(word.length - 1)}es`

  // Assume it's 0 entered. Or something else random. 
  return `${word}s`
}