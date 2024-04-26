/**
 * The return type for characters per second or words per minute.
 */
export type TypingSpeed = number | "unknown"

/**
 * Tracker for how fast the user types approximately. This rejects outliers(usually when someone's not typing)
 * The stats are not usable until there are more than 100 samples once this becomes ready. 
 */
export class TypingStats {
  /**
   * Samples for delta times between key strokes. This can contain duplicates and is only used for the first 100 characters when samplesReady is still false. 
   */
  samples: number[]
  /**
   * If there are more than 100 samples and it's ready to reject outliers. 
   */
  samplesReady: boolean
  /**
   * Total characters typed. Used only after samples are ready, otherwise is -1.
   */
  totalChar: number
  /**
   * Total delta time between character typing. Used only after samples are ready, otherwise is -1.
   */
  totalTime: number

  constructor (typingStats?: Partial<TypingStats>) {
    /**
     * Array of 100 timestamps between characters. If it's 15x off then it's considered an outlier. This is used to calculate the median since outliers are unknown. 
     */
    this.samples = typingStats?.samples || []

    this.totalChar = typingStats?.totalChar ? Number(typingStats?.totalChar) : -1
    this.totalTime = typingStats?.totalTime ? Number(typingStats?.totalTime) : -1

    // If the samples are ready the totalChar and time must be defined. 
    this.samplesReady = this.totalChar != -1 && this.totalTime != -1
  }

  /**
   * Adds the stats of another instance to this one. 
   * @param typingStats other instance.
   */
  combine (typingStats: TypingStats) {
    if (typingStats.samplesReady && this.samplesReady) { // both are ready. 
      this.totalChar += typingStats.totalChar
      this.totalTime += typingStats.totalTime
    } else if (!typingStats.samplesReady && !this.samplesReady) { // both are not ready
      this.samples = this.samples.concat(typingStats.samples)

      // Get samples ready if we have more than 100. 
      if (this.samples.length > 100) {
        this.#completeSamples()
      }
    } else {// one is ready. 
      // The one with the samples ready
      let readySamples: TypingStats
      // The one without samples ready. this will be added to the other one. 
      let notReadySamples: TypingStats

      if (this.samplesReady) {
        readySamples = this
        notReadySamples = typingStats
      } else {
        readySamples = typingStats
        notReadySamples = this
      }

      // The average time between two characters. Then multiplied by 15 because anything below will be added. 
      let adjustedAverage = readySamples.totalTime / readySamples.totalChar * 15 
      
      for (let c = 0; c < notReadySamples.samples.length; c++) {
        if (notReadySamples.samples[c] < adjustedAverage) {
          readySamples.totalTime += notReadySamples.samples[c]
          readySamples.totalChar ++
        }
      }

      // If this class isn't the ready sample, we take all their data. 
      if (!this.samplesReady) {
        this.samples = []
        this.samplesReady = true
        this.totalChar = readySamples.totalChar
        this.totalTime = readySamples.totalTime
      }
    }
  }

  /**
   * Adds a typed character to the wpm. If the stats are ready, then if it's 15x from the average or more, it will not be added.
   * @param delta Time in ms since the last character was typed.
   */
  typedCharacter (delta: number) {
    if (this.samplesReady) {
      // Check if it's within the allowed average. 
      let adjustedAverage = this.totalTime / this.totalChar * 15 

      if (delta >= adjustedAverage) {
        return
      }

      this.totalTime += delta
      this.totalChar ++
    } else {
      this.samples.push(delta)

      if (this.samples.length > 100) {
        this.#completeSamples()
      }
    }
  }

  #completeSamples () {
    let median = TypingStats.CalculateMedian(this.samples)
    let { totalTime, totalChar } = TypingStats.#CalculateTotalCharTime(this.samples, median)
    
    this.totalTime = totalTime
    this.totalChar = totalChar

    // No samples needed 
    this.samplesReady = true 
    this.samples = []
  }

  /**
   * Calculates the wpm for the typing stats assuming enough samples. This assumes here are 5 characters in a word. 
   * @returns words per minute or unknown if it's not ready.
   */
  wpm (): TypingSpeed {
    if (!this.samplesReady) return "unknown"
    // 60000 / Time per char * 5 
    return 60000 / ((this.totalTime / this.totalChar) * 5)
  }
  
  /**
   * Calculates the amount of characters per second. 
   */
  cps (): TypingSpeed {
    if (!this.samplesReady) return "unknown"

    return 1000 / (this.totalTime / this.totalChar)
  }

  /**
   * Calculates the median of an array.
   * @param data array to find median of. Note this array will be mutated(sorted). It cannot be empty or this will return undefined.
   * @returns median.
   */
  static CalculateMedian (data: number[]): number {
    // Could use optimizing 
    data = data.sort((a, b) => a-b)

    if (data.length%2 == 0) {
      return (data[data.length/2-1] + data[data.length/2])/2
    } else {
      return data[Math.floor(data.length/2)]
    }
  }

  /**
   * Calculates the total time spent spent typing and the total characters typed.
   * @param data Array of differences between last character typed. Ie the amount of time taken to type the character.
   * @param median Median of `data`. Used to reject extreme outliers. Anything 15x from the median or more is considered an outlier to reject.
   * @returns total time spent typing (`totalTime`) and total characters typed (`totalChar`).
   */
  static #CalculateTotalCharTime (data: number[], median: number) {
    let totalTime = 0
    let totalChar = 0

    for (let c = 0; c < data.length; c++) {

      // Add if it's not 15x longer than 
      if (data[c] < median*15) {
        totalTime += data[c]
        totalChar ++
      }
    }

    return { totalTime, totalChar }
  }
}
