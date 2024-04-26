import path from "path"
import { runTests } from "@vscode/test-electron"

;(async () => {
  try {
    await runTests({
      extensionDevelopmentPath: path.resolve(__dirname, "../"),
      extensionTestsPath: path.resolve(__dirname, "./suite/index.js")
    })
  } catch (err) {
    console.error(err)
  }
})()