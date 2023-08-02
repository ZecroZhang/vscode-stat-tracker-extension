//Currently only counts code. 

import * as fs from "fs"
import path = require("path")

interface FileStats {
  lines: number
  characters: number
}

interface GroupFileStats {
  lines: number
  characters: number 
  files: number
  folders: number
}

interface ErrorCode {
  error: true 
  code: number
}

/**
 * 
 * @param startPath Starts searching this path and searches every subpath.
 * @param allowedExtensions Will scan files with the following extension endings. 
 * @param deniedNames Skips files and folders including these names. 
 * 
 * @returns GroupFileStats if it works, otherwise will return ErrorCode.
 * @todo Fix the include/exclude... 
 */
export function LinesOfCode (startPath: string, allowedExtensions: Array<string> = [], deniedNames: Array<string> = []): GroupFileStats | ErrorCode {
  //Make sure the startpath exists. 
  if (!fs.existsSync(startPath) || !fs.lstatSync(startPath).isDirectory()) return { error: true, code: 1 }

  try {
    //Change the exclude array to lowercase. 
    allowedExtensions = allowedExtensions.map(item => item.toLowerCase())

    var totalStats: GroupFileStats = {
      lines: 0,
      characters: 0,
      files: 0,
      folders: 0
    }

    //Funny story, I thought that / was a mistake and it started scanning from the root dir. So I replaced it with startPath without realizing startPath is automatically added to the front of everything.
    var stack: Array<string> = [ "/" ]

    while (stack.length > 0) {
      var currentSubPath: string = stack.shift()! //stack.shift probably will never be undefined???
      var items = fs.readdirSync(path.join(startPath, currentSubPath)) 

      var subPathStart = currentSubPath.endsWith("/") ? currentSubPath.substring(0, currentSubPath.length-1): currentSubPath
      for (var item of items) {
        //Figure out if it's in the excluded array. 
        if (deniedNames.some(nameKey => item.toLowerCase().includes(nameKey) && nameKey.length)) continue

        const filePath = path.join(startPath, currentSubPath, item)

        if (fs.statSync(filePath).isDirectory()) {
          stack.push(`${subPathStart}/${item}`)
          totalStats.folders ++
        } else {
          //Check if the file extension is valid
          if (!allowedExtensions.some(extension => item.endsWith(extension) && extension.length)) continue

          //If it's a file, get stats. 
          var stats = GetFileStats(filePath)
          totalStats.characters += stats.characters
          totalStats.lines += stats.lines

          totalStats.files ++
        }
      }
    }

    return totalStats
  } catch (err) {
    return { error: true, code: 0 }
  }
}

function GetFileStats (path: string): FileStats {
  var data = fs.readFileSync(path, { encoding: "utf8" })
  return {
    lines: (data.match(/\n/g)?.length || 0) + 1,
    characters: data.length
  }
}