# Change Log

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

### [1.0.7]
- Added error message for load or random exceptions when running the extension to make it easier to debug.
- Added commas to the total stats. 
- Fixed an issue with account creation.
- Set up an nonfunctional text counter for the next update. 

### [1.0.6]
- Attempt to patch a bug causing an extreme amount of code to be written.
- No longer saves after 100 lines or 10k characters in 1 min.
- Added command to delete today's progress.
- Added command to delete the written values from different languages.

### [1.0.5]
- Keeps track of the net lines, characters and characters without bulk for the languages.
- Also displays the top 3 languages as well as their stats and percentage of time used.
- Stats show when the today and weekly stats reset.
- Timer increments by 5 seconds instead of 1 until the 1m mark.

### [1.0.4]
Keeps track of languages used. No stats added yet.

### [1.0.3]
Extension no longer jams the code editor...

### [1.0.0]
Initial release of this random util thing.
