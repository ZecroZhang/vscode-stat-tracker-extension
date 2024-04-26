// Main file for all the webview. 

const { SetUpStatsCounter } = require("./scripts/StatsCounter")
const { RenderBody } = require("./scripts/GenerateBody")
const { SetUpPieChart } = require("./scripts/PieChart")
const { SetUpProjectStats } = require("./scripts/ProjectStats")
const { SetUpTimeRangeStats } = require("./scripts/RangeProgress")
const { SetUpLanguageStats } = require("./scripts/LanguageStats")

;(async () => {
  RenderBody()
  
  // Main body content. They're async but there's no problem if they run in "parallel"
  SetUpTimeRangeStats()
  SetUpLanguageStats()
  SetUpProjectStats()

  SetUpPieChart()
  await SetUpStatsCounter()
})()