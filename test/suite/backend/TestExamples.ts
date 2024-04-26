// Two time range object skeletons for testing.

import { TypingStats } from "../../../src/structs/TypingStats"

// List of edits so I don't have to type them over and over.
export const edits = [
  {
    lines: {
      added: 32,
      removed: 4,
      net: 28
    },
    characters: {
      added: 546,
      removed: 33,
      net: 513
    },
    charactersWB: {
      added: 411,
      removed: 2,
      net: 409
    }
  },
  {
    lines: {
      added: 32,
      removed: 4,
      net: 28
    },
    characters: {
      added: 56,
      removed: 3,
      net: 53
    },
    charactersWB: {
      added: 23,
      removed: 0,
      net: 23
    }
  }, 
  {
    lines: {
      added: 32,
      removed: 4,
      net: 28
    },
    characters: {
      added: 56,
      removed: 3,
      net: 53
    },
    charactersWB: {
      added: 23,
      removed: 0,
      net: 23
    }
  },
  {
    lines: {
      added: 6,
      removed: 6,
      net: 0
    },
    characters: {
      added: 58, 
      removed: 11,
      net: 47
    },
    charactersWB: {
      added: 55, 
      removed: 1,
      net: 54
    }
  }
]

// List of languages.
export const languages = [
  {
    time: {
      totalTime: 1001,
      activeTime: 1
    },
    edits: edits[2]
  },
  {
    time: {
      totalTime: 13040,
      activeTime: 10000
    },
    edits: edits[1]
  }
]

export const projects = [
  {
    path: "/path/to/project/",
    name: "FunProject",
    time: {
      activeTime: 11040,
      totalTime: 20000
    },
    edits: edits[0],
    languages: {
      "html": languages[0]
    }
  },
  {
    path: "C:\\project\\on\\windows",
    name: "CodeExtension",
    time: {
      activeTime: 109131,
      totalTime: 301203
    },
    edits: edits[0],
    languages: {
      "cpp": languages[1],
      "asm": languages[0]
    }
  }
]

export const testTimeRange1 = {
  resets: 1703623720270,
  codeTime: {
    totalTime: 51092,
    activeTime: 44510
  },
  edits: edits[0],
  languages: {
    "javascript": languages[0],
    "typescript": languages[1]
  },
  typing: new TypingStats(),
  projects
}

export const testTimeRange2 = {
  resets: 1508164753170,
  codeTime: {
    totalTime: 19343,
    activeTime: 10931,
  },
  edits: edits[1],
  languages: {
    "javascript": languages[1],
    "rust": languages[0]
  },
  typing: new TypingStats(),
  projects: []
}