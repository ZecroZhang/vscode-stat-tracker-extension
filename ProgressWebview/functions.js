//Compiled from functions.ts in the main folder.
"use strict"
/**
 * Converts milliseconds to a human readable time format.
 * @param timeMs The amount of time in ms.
 * @param precision The amount of decimal precision on the seconds.
 */
function MsToTime(timeMs, precision = 0) {
    //Check if the input is negative. If so, set it to the absolute value.
    var pastTense = timeMs < 0
    if (pastTense) {
        timeMs = Math.abs(timeMs)
    }
    var hours = Math.floor(timeMs / 3600000)
    var minutes = Math.floor(timeMs / 60000) % 60
    var seconds = (timeMs / 1000) % 60
    var timeBuilder = []
    if (hours > 0)
        timeBuilder.push(`${hours} ${Plural("hour", hours)}`)
    if (minutes > 0)
        timeBuilder.push(`${minutes} ${Plural("minute", minutes)}`)
    //Seconds gets rounded to the nearest whole second. This may lead to '1.4 second' instead of '1.4 seconds'
    if (seconds > 0)
        timeBuilder.push(`${seconds.toFixed(precision)} ${Plural("second", Math.round(seconds))}`)
    if (!timeBuilder.length)
        return `0 seconds`
    var textBuilder
    if (timeBuilder.length == 1) {
        textBuilder = timeBuilder.toString()
    }
    else {
        var temp = timeBuilder.pop() //Hold the last item. We want to insert an "and" before the last item. 
        textBuilder = `${timeBuilder.join(", ")}, and ${temp}`
    }
    if (pastTense)
        textBuilder += " ago"
    return textBuilder
}
function Plural(text, amount, type) {
    if (amount === 1)
        return text
    /**
     * Type 0: adds s
     * Type 1: adds es
     * Type 2: doubles the last letters and returns es
     */
    if (type === 1)
        return `${text}es`
    else if (type === 2)
        return `${text}${text.charAt(text.length - 1)}es`
    //Assume it's 0 entered. Or something else random. 
    return `${text}s`
}