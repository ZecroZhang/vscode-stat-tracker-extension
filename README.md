# zecrosUtility README
[Open source](https://github.com/ZecroZhang/vscode-stat-tracker-extension) stat tracker for VSCode, with a few additional utility features.

## Features
Tracks progress when coding. This includes:
- time spent coding(daily, weekly and all time)
- amount of lines/characters written *copying and pasting not included*
- the above for different coding languages 
- the above for different projects(folders)
Click the clock at the bottom right or run the `View Progress` command to see your progress.

Apart from stat tracking, there is a a word counter for text files and a command equivalent for use in other languages.

## Requirements
A beefy computer probably. I write inefficient code.

## Extension Settings
None, but I should add some.

## Known Issues

## Release Notes

## Installing 
You're likely looking at this on the GitHub page.  
The vsix file is included for a quick installation. If you want to compile from scratch then: 
1. Run `npm install` to install all node dependencies.
2. Run `vsce package` 
3. Install the newly generated .vsix file. 

**Note:** If you have a version installed before 0.1.4, follow these steps: 
1. Enter the progress stats webview and copy the `Saved Data` JSON. Save it somewhere. 
2. Uninstall the Zecro's Utility extension. 
3. Install the new version and paste the saved JSON into the box below the button `Load JSON Below` and load the old stats. 