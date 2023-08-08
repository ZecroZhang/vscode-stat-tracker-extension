//Main file for all the webview. 

const { SetUpStatsCounter } = require("./StatsCounter")
const { RenderBody } = require("./GenerateBody")
const { SetUpPieChart } = require("./PieChart")
const { SetUpProjectStats } = require("./ProjectStats")
const { SetUpTimeRangeStats } = require("./RangeProgress")
const { SetUpLanguageStats } = require("./LanguageStats")

;(async () => {
  RenderBody()
  
  //Main body content. They're async but there's no problem if they run in "parallel"
  SetUpTimeRangeStats()
  SetUpLanguageStats()
  SetUpProjectStats()

  SetUpPieChart()
  await SetUpStatsCounter()
})()