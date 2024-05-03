// Currently only counts code. 

import fs from "fs"
import { minimatch } from "minimatch"
import path from "path"

interface FileStats {
  lines: number
  characters: number
}

export interface GroupFileStats {
  lines: number
  characters: number 
  files: number
  folders: number

  hasUnreachableFiles: boolean
}

export interface ErrorCode {
  error: true
  /**
   * 1 = file/folder not found, 0 = unknown error
   */ 
  code: 1 | 0
}

/**
 * Checks if a folder is accessible and can be read from.
 * @param path path to the folder(absolute path recommended).
 * @returns if it can be read from.
 */
function IsAccessible (path: string) {
  try {
    fs.accessSync(path, fs.constants.R_OK)
    return true
  } catch (err) {
    return false
  }
}

/**
 * Calculates the lines, characters and other stats access multiple files inside the startPath.
 * @param startPath Starts searching this path and searches every subpath. Needs to be a path to a folder.
 * @param allowedExtensions Will scan files with the following extension endings. 
 * @param deniedGlobs File paths matching these globs will be ignored. Make sure they are all in lowercase as this is not case sensitive.
 * 
 * @returns GroupFileStats if it works, otherwise will return ErrorCode.
 */
export function LinesOfCode (startPath: string, allowedExtensions: string[] = [], deniedGlobs: string[] = []): GroupFileStats | ErrorCode {
  // Make sure the startPath exists. 
  if (!fs.existsSync(startPath) || !fs.lstatSync(startPath).isDirectory()) {
    return { error: true, code: 1 }
  }

  try {
    // Change the exclude array to lowercase. 
    allowedExtensions = allowedExtensions.map(item => item.toLowerCase())

    let totalStats: GroupFileStats = {
      lines: 0,
      characters: 0,
      files: 0,
      folders: 0,
      hasUnreachableFiles: false
    }

    // Funny story, I thought that / was a mistake and it started scanning from the root dir. So I replaced it with startPath without realizing startPath is automatically added to the front of everything.
    // This was later replaced with "" to prevent glob issues.
    let stack: string[] = [ "" ]

    while (stack.length > 0) {
      const currentSubPath: string = stack.shift()! // stack.shift probably will never be undefined???
      const currentPath = path.join(startPath, currentSubPath)

      if (!IsAccessible(currentPath)) {
        totalStats.hasUnreachableFiles = true
        continue
      }

      let files = fs.readdirSync(currentPath)

      const subPathStart = currentSubPath.endsWith("/") || currentSubPath.endsWith("\\") ? currentSubPath.substring(0, currentSubPath.length-1): currentSubPath
      for (let fileName of files) {
        // This starts from the base folder, excusing the ./
        const relativeFilePath = subPathStart.length > 0 ? `${subPathStart}/${fileName}` : fileName
        // Figure out if it's in the excluded array. 
        if (deniedGlobs.some(glob => minimatch(relativeFilePath.toLowerCase(), glob))) {
          continue
        }

        const filePath = path.join(startPath, currentSubPath, fileName)

        if (fs.statSync(filePath).isDirectory()) {
          stack.push(relativeFilePath)
          totalStats.folders ++
        } else {
          // Check if the file extension is valid
          if (!allowedExtensions.some(extension => fileName.endsWith(extension) && extension.length)) {
            continue
          } else if (!IsAccessible(path.join(startPath, relativeFilePath))) {
            // This check is done here instead of above so the message isn't misleading since only files/folders which would have otherwise been counted will trigger the unreachable files warning.
            totalStats.hasUnreachableFiles = true 
            continue
          }

          // If it's a file, get stats. 
          let stats = GetFileStats(filePath)
          totalStats.characters += stats.characters
          totalStats.lines += stats.lines

          totalStats.files ++
        }
      }
    }

    return totalStats
  } catch (err) {
    console.error(err)
    return { error: true, code: 0 }
  }
}

function GetFileStats (path: string): FileStats {
  const data = fs.readFileSync(path, { encoding: "utf8" })

  let lines = 0
  if (data.length > 0) {
    lines = (data.match(/\n/g)?.length || 0) + 1
  }

  return {
    lines,
    characters: data.length
  }
}