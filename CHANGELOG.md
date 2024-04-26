# Change Log

### [1.0.0]
#### Added
- Support for untrusted workspaces.
- Added unittests.
- Added [settings](README.md#extension-settings).

#### Changed
- Refactored the internal classes.
- Improved documentation of functions and the extension.
- Changed the ignored file/folder names into globs.
- Refactored the message passing system between the webview and the backend to work better with the typescript type system.
- Made code more consistent.
- Changed webview graphs, buttons and other components to no longer resize vertically with the window.
- Set user action progress save to minimum of every 60s, up from 15s.
- Made the error more descriptive for the stats counter when it reads a folder/file it does not have permission to read.
- Improved and modified error messages to show on empty on various input fields. 
- Reduced the project name cap from 256 to 50.

#### Removed
- Removed the nonfuncitonal delete today progress and delete typed stats command.
- Removed opening window notification when viewing stats.

#### Fixed
- Fixed minor time rounding display error.
- Fixed issue of `NetAddRemove` instances having a net of 0 when the property is missing instead of calculating it to `added - removed`.
- Fixed issue with folder names not correctly resolving if it ends with `/` or windows folder names.
- Fixed issue where combining project stats don't combine the languages used.
- Fixed the "Document Stats" command throwing an error.
- Fixed the issue of the text word counter showing the same amount of words as the previous document when clicking into an empty document.
- Fixed an issue of selections not showing when one word is selected. The under and overcounting when you create multiple selections in words excluding the separator will remain unresolved for now.
- Resolved an issue with the extension's version jumping from 1.0.7 to 0.0.7
- Fixed issue with the view progress webview showing the wrong colour theme for high contract light/dark mode in vscode.

### [0.1.4]
- Added naming of projects. 
- Added ability to merge project stats.
- Rewrote webview using TypeScript React.
- Renamed extension internally. This breaks backwards compatibility again.
- Using webpack for bundling.

### [0.1.3]
- Refactored internal structures to remove the use of interfaces for Partial objects.
- *Possible undocumented changes.* 

### [0.1.2]
- Refactored internal structures and save data structure. Older version are no longer backwards compatible.
- *Possible undocumented changes.* 

### [0.1.1]
- Webview changes:
  - Webview can show the language usage graph.
  - Webview can count the stats of files in a specific directory.
  - Added dark and light theme for webview. Based on the current vs code theme. 
- Rewrote main extension in TypeScript. 

### [0.1.0]
- Rewrote the webview. Now it updates automatically when re-entering the window and extra functionality at the bottom.
- Added stats merging, so you can merge old stats with this one. Make sure the old stats json is updated to this update.

### [0.0.9]
- Fixed a glitch causing discarded characters to not save. 

### [0.0.8]
- Added a word counter that displays total words and selected words on text files.
- Added a command to give the stats of the file. Gives the word, character and line count.
- Time while the computer's asleep will no longer be counted. Also added a nice welcome back message for when your computer does wake up. :\)
- Added a discard category for extra large copy and pastes and deletes. Discards if more 100 characters and 10 lines added or removed at once.

### [0.0.7]
- Added error message for load or random exceptions when running the extension to make it easier to debug.
- Added commas to the total stats. 
- Fixed an issue with account creation.
- Set up an nonfunctional text counter for the next update. 

### [0.0.6]
- Attempt to patch a bug causing an extreme amount of code to be written.
- No longer saves after 100 lines or 10k characters in 1 min.
- Added command to delete today's progress.
- Added command to delete the written values from different languages.

### [0.0.5]
- Keeps track of the net lines, characters and characters without bulk for the languages.
- Also displays the top 3 languages as well as their stats and percentage of time used.
- Stats show when the today and weekly stats reset.
- Timer increments by 5 seconds instead of 1 until the 1m mark.

### [0.0.4]
Keeps track of languages used. No stats added yet.

### [0.0.3]
Extension no longer jams the code editor...

### [0.0.0]
Initial release of this random util thing.
