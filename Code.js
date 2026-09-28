/**
 * -------------------------------------------------------------
 * TASK MATRIX: TASKS IN ROWS | DATES IN COLUMNS
 * (Version 2: Configured for Gate, Leetcode, and Github tasks)
 * -------------------------------------------------------------
 */

const CONFIG = {
  TRACKER_SHEET: "Habit Tracker",
  LOGS_SHEET: "Activity Log",
  NUM_DAYS: 30, // Generates columns for the next 30 days
  START_DATE_COL: 3 // Column C onwards are dates
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🚀 Habit Tracker")
    .addItem("1. Auto-Build Tracker with My Tasks", "setupTaskMatrix")
    .addSeparator()
    .addItem("2. Sync Today's Tasks to Google Calendar", "syncTodayToCalendar")
    .addToUi();
}

/**
 * 1-CLICK BUILD: Sets up your exact tasks and date columns.
 */
function setupTaskMatrix() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Setup 'Habit Tracker' Sheet
  let sheet = ss.getSheetByName(CONFIG.TRACKER_SHEET);
  if (!sheet) sheet = ss.insertSheet(CONFIG.TRACKER_SHEET);
  sheet.clear();
  sheet.clearNotes();

  // Tasks and default alert times (modify times anytime in Column B)
  const myTasks = [
    ["Gate (4 hours)", "10:00"],
    ["Leetcode (2 que)", "18:00"],
    ["Github commit (5)", "21:30"]
  ];

  // Headers
  sheet.getRange("A1").setValue("Task Name").setBackground("#1f2937").setFontColor("#ffffff").setFontWeight("bold");
  sheet.getRange("B1").setValue("Alert Time").setBackground("#374151").setFontColor("#ffffff").setFontWeight("bold");
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 100);

  // Insert Tasks into Rows 2, 3, 4
  sheet.getRange(2, 1, myTasks.length, 2).setValues(myTasks);
  sheet.getRange(2, 1, myTasks.length, 1).setFontWeight("bold");

  // Generate Date Columns: e.g. "29 Sep (Tue)"
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date();

  for (let i = 0; i < CONFIG.NUM_DAYS; i++) {
    let d = new Date(today);
    d.setDate(today.getDate() + i);
    
    let col = CONFIG.START_DATE_COL + i;
    let label = `${d.getDate()} ${monthNames[d.getMonth()]} (${dayNames[d.getDay()]})`;
    
    // Header
    let headerCell = sheet.getRange(1, col);
    headerCell.setValue(label).setBackground("#111827").setFontColor("#ffffff").setFontWeight("bold").setFontSize(10);
    sheet.setColumnWidth(col, 110);

    // Checkboxes for the 3 tasks
    let checkRange = sheet.getRange(2, col, myTasks.length, 1);
    checkRange.insertCheckboxes();
  }

  // Row 5: Total Completed formula
  sheet.getRange("A5").setValue("Tasks Completed").setFontWeight("bold");
  // Row 6: Completion % formula
  sheet.getRange("A6").setValue("Completion %").setFontWeight("bold");
  // Row 7: GitHub Dot
  sheet.getRange("A7").setValue("GitHub Intensity").setFontWeight("bold");

  for (let i = 0; i < CONFIG.NUM_DAYS; i++) {
    let colLetter = getColumnLetter(CONFIG.START_DATE_COL + i);
    sheet.getRange(5, CONFIG.START_DATE_COL + i).setFormula(`=COUNTIF(${colLetter}2:${colLetter}4, TRUE)`);
    sheet.getRange(6, CONFIG.START_DATE_COL + i).setFormula(`=${colLetter}5 / 3`).setNumberFormat("0%");
    sheet.getRange(7, CONFIG.START_DATE_COL + i).setFormula(`=${colLetter}6`);
  }

  // Hide text on row 7 so only green color shows
  sheet.getRange(7, CONFIG.START_DATE_COL, 1, CONFIG.NUM_DAYS).setNumberFormat(";;;");

  // GitHub Green Color Scale for Row 7
  const heatmapRange = sheet.getRange(7, CONFIG.START_DATE_COL, 1, CONFIG.NUM_DAYS);
  const colorRule = SpreadsheetApp.newConditionalFormatRule()
    .setGradientMinpoint("#ebedf0")                                                      // 0% (Light Gray)
    .setGradientMidpointWithValue("#7bc96f", SpreadsheetApp.InterpolationType.PERCENT, "50") // 50% (Medium Green)
    .setGradientMaxpointWithValue("#196127", SpreadsheetApp.InterpolationType.PERCENT, "100") // 100% (Dark Green)
    .setRanges([heatmapRange])
    .build();
  sheet.setConditionalFormatRules([colorRule]);

  // 2. Setup 'Activity Log' Sheet (Records exact timestamps)
  let logSheet = ss.getSheetByName(CONFIG.LOGS_SHEET);
  if (!logSheet) logSheet = ss.insertSheet(CONFIG.LOGS_SHEET);
  if (logSheet.getLastRow() === 0) {
    logSheet.getRange("A1:C1").setValues([["Date Column", "Task Name", "Checked At (Exact Time)"]]);
    logSheet.getRange("A1:C1").setBackground("#1f2937").setFontColor("#ffffff").setFontWeight("bold");
    logSheet.setColumnWidth(1, 140);
    logSheet.setColumnWidth(2, 200);
    logSheet.setColumnWidth(3, 200);
  }

  SpreadsheetApp.getUi().alert("✅ Your Task Matrix is ready with Gate, Leetcode, and GitHub tasks!");
}

/**
 * TRIGGER: Automatically records exact timestamp on the cell as a note and in the log.
 */
function handleTaskEdit(e) {
  if (!e || !e.range) return;
  const range = e.range;
  const sheet = range.getSheet();
  
  if (sheet.getName() !== CONFIG.TRACKER_SHEET) return;
  
  const row = range.getRow();
  const col = range.getColumn();
  
  // Must be in task rows (2 to 4) and date columns (3 and beyond)
  if (row >= 2 && row <= 4 && col >= CONFIG.START_DATE_COL) {
    const isChecked = range.getValue() === true;
    const dateLabel = sheet.getRange(1, col).getValue();
    const taskName = sheet.getRange(row, 1).getValue();
    const logSheet = sheet.getParent().getSheetByName(CONFIG.LOGS_SHEET);
    
    if (isChecked) {
      const now = new Date();
      const timeString = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      
      // 1. Add hover note on the checkbox cell
      range.setNote(`Completed at:\n${timeString}`);
      
      // 2. Add entry to Activity Log
      if (logSheet) {
        logSheet.appendRow([dateLabel, taskName, timeString]);
      }
    } else {
      range.clearNote();
    }
  }
}

/**
 * Syncs today's tasks to Google Calendar with phone alerts 10 mins before.
 */
function syncTodayToCalendar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.TRACKER_SHEET);
  if (!sheet) return;

  const calendar = CalendarApp.getDefaultCalendar();
  const today = new Date();
  
  // Tasks are in rows 2, 3, 4
  const taskData = sheet.getRange(2, 1, 3, 2).getValues();
  let count = 0;

  taskData.forEach(([taskName, timeStr]) => {
    if (!taskName) return;
    
    let startTime = new Date(today);
    if (typeof timeStr === "string" && timeStr.includes(":")) {
      const [h, m] = timeStr.split(":").map(Number);
      startTime.setHours(h, m, 0, 0);
    } else if (timeStr instanceof Date) {
      startTime.setHours(timeStr.getHours(), timeStr.getMinutes(), 0, 0);
    } else {
      startTime.setHours(10, 0, 0, 0);
    }

    let endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1-hour block

    const event = calendar.createEvent(`[Habit] ${taskName}`, startTime, endTime, {
      description: "Auto-synced from your Habit Matrix"
    });
    event.addPopupReminder(10); // Alert on phone 10 min before
    count++;
  });

  SpreadsheetApp.getUi().alert(`📅 Synced ${count} tasks to Google Calendar with phone alerts!`);
}

function getColumnLetter(colIndex) {
  let temp, letter = '';
  while (colIndex > 0) {
    temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colIndex = (colIndex - temp - 1) / 26;
  }
  return letter;
}
