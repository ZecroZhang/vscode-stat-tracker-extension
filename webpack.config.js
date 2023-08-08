"use strict"
const path = require("path")

//@ts-check
/**
 * @typedef {import('webpack').Configuration} Configuration
 */

/**
 * @type { Configuration }
 */
const extensionConfig = {
  target: "node",
  mode: "none",
  entry: "./src/extension.ts",
  output: {
    path: path.resolve(__dirname, "out"), 
    filename: "extension.js",
    libraryTarget: "commonjs2"
  },
  externals: {
    vscode: "commonjs vscode"
  },
  resolve: {
    extensions: [ ".ts", ".js" ]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          { loader: "ts-loader" }
        ]
      }
    ]
  },
  devtool: "nosources-source-map",
  infrastructureLogging: {
    level: "log"
  }
}

/**
 * @type { Configuration }
 */
const webviewConfig = {
  mode: "production", //"none" doesn't seem to work for the webview. 
  entry: "./ProgressWebview/",
  output: {
    path: path.resolve(__dirname, "out"),
    filename: "webview.js"
  },
  resolve: {
    extensions: [ ".ts", ".tsx", ".js", ".jsx" ]
  },
  module: {
    rules: [
      // {
      //   test: /\.css$/,
      //   use: [
      //     { loader: "css-loader" } //ok I'm not sure if this will be used later. 
      //   ]
      // },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          { loader: "ts-loader" }
        ]
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        include: path.resolve(__dirname, "ProgressWebview/index.js"),
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [
                [ "@babel/preset-env", { targets: "defaults" } ],
                "@babel/preset-react",
                "@babel/preset-typescript"
              ]
            }
          }
        ]
      }
    ]
  }
}

module.exports = [ extensionConfig, webviewConfig ]