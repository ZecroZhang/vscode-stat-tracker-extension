# Zecro's Utility README
[Open source](https://github.com/ZecroZhang/vscode-stat-tracker-extension) stat tracker for VSCode, with a few additional utility features.

## Features
### Viewing Progress Stats
This extension saves [usage stats](#progress-tracking). These stats can be viewed inside the View Progress webview, by running the `View Progress` command or clicking the clock in the status bar.\
This webview also lets you merge projects, older stats and export your current stats as JSON.

#### Graphs
The webview can generate interactive pie charts for certain stats. Select the time range and type of information to organize into a pie chart under the `Graph Stats` section.

#### File Counter
The `Stat Counter` section lets you count the amount of lines across all the files inside the folder and subfolders.\
\
`Allowed File Extensions` specifies the file extensions, separated by commas, which will be counted. ONLY these files are counted.\
`Ignored File/Folder Globs` specifies any file/folder globs, separated by commas, to ignore.\
\
You can also have it ignore the globs in `.gitignore` or `.vscodeignore` by toggling it in the [extension settings](#extension-settings). In addition, the default values for `Allowed File Extensions` and `Ignored File/Folder Globs` can also be toggled in settings.

### Progress Tracking
This extension tracks a variety of usage stats across time intervals of today, this week and since installation.\
Below is an overview of the general information stored:

#### Time Ranges
These represent an interval of time. Currently, there is one for the day, week and since all time.\
The timer starts once you do any action tracked by the time range and will reset a day or week after, depending on the time range.\
The following stats are recorded:
- [Time Spent](#time-spent)
- [Edits Made](#edits-made)
- [Languages Used](#languages-used)
- [Projects](#projects)
- [Typing Speed](#typing-speed)

#### Projects
This extension considers every workspace folder its own project.\
Projects can be named inside the webview.\
The following stats are tracked for each project:
- [Time Spent](#time-spent)
- [Edits Made](#edits-made)
- [Languages Used](#languages-used)

#### Languages Used
The following stats are saved for every coding language:
- [Time Spent](#time-spent)
- [Edits Made](#edits-made)

#### Time Spent
This tracks the `total time` spent, which is time the IDE was kept open, and the `active time` spent which is the time the IDE window is in focus.

#### Edits Made
This keeps track of the amounts of `lines`, `characters` and `characters without bulk`(characters typed without the use of autocomplete or copy and paste).\
For each of these, it tracks the amount `added`, `removed` and the `net` change.\
In an effort to keep stats from being inflated, if a copy and paste adds or removes more than 100 characters or 10 lines, it will not be counted.

#### Typing Speed
This gives a rough estimate on typing speed based on time spent typing and amount of characters typed. It is only available for a given time range, project, etc. once you type more than 100 characters.\
It doesn't count a character as part of the typing speed if the time it took for it to be typed was 15x slower than the typing speed. It will consider these as breaks.

### Word Counter
This extension also shows a word counter for plaintext documents.\
More files can be toggled to have this property in settings.\
You can also count the lines/words using the `Document Stats` command.

## Extension Settings
Settings for the extension.

### Stat Tracking
`zecroStatTracker.statTracking.autoSaveInterval` Minium time, in seconds, for user stats can be saved due to a user action, ie character typed, switch tab, etc.\
This extension will always save the progress when the code instance is closed gracefully(if the vscode instance crashes, unsaved data will be lost). Set the value 0 or less for it to only save once the extension closes.\
`zecroStatTracker.statTracking.trackStats` If the extension should track coding stats. Eg: code time, languages used, amount of code written.

### Accessories
`zecroStatTracker.accessories.showStatusBarClock` If the status bar clock should show. If disabled you can see stats using the `View Progress` command. (Requires reload to take effect)\
`zecroStatTracker.accessories.wordCounting` Display the word counter for these file endings.\
Separate file endings with a comma. Ex: `txt, .md, c` for text files, files ending in`.md` and `.c`.\
Note: txt applies to other non language plaintext files. Use `.txt` for only files ending in `.txt`.

### File Counting
`zecroStatTracker.fileCounting.defaultAllowedFilesEndings` Default allowed file endings for the stats counter in the progress stats webview.\
Separate file endings with a comma. Eg: `.ts, .cc, .cpp` for files ending in `.ts`, `.cc` and `.cpp`\
`zecroStatTracker.fileCounting.defaultExcludedFiles` Default disallowed file/folder globs, to be ignored when counting stats in the progress stats webview. Separate globs with a comma. Eg: `*.js, not_allowed_folder, file.txt` ignores all files in `./`: ending with `.js`, `not_allowed_folder` and `file.txt`.\
`zecroStatTracker.fileCounting.ignoredGitignore` Have the file stats counter, in the progress stats webview, ignore what `.gitignore` ignores as well.\
`zecroStatTracker.fileCounting.ignoreVscodeIgnore` Have the file stats counter, in the progress stats webview, ignore what `.vscodeignore` ignores as well.

## Installing 
You're likely looking at this on the GitHub page.\
The vsix file is included for a quick installation. If you want to compile from scratch then: 
1. Run `npm install` to install all node dependencies.
2. Run `vsce package`
3. Install the newly generated .vsix file.

**Note:** If you have a version installed before 0.1.4, follow these steps: 
1. Enter the progress stats webview and copy the `Saved Data` JSON. Save it somewhere. 
2. Uninstall the Zecro's Utility extension. 
3. Install the new version and paste the saved JSON into the box below the button `Load JSON Below` and load the old stats. 