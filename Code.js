/**
 * -------------------------------------------------------------
 * HABIT TRACKER: LATEST TIMESTAMP ONLY (NO DUPLICATE LOGS)
 * (Version 4: Upsert latest timestamp per task, ignore unchecks)
 * -------------------------------------------------------------
 */

const CONFIG = {
  TRACKER_SHEET: "Habit Tracker",
  LOGS_SHEET: "Activity Log",
  NUM_DAYS: 30,
  START_DATE_COL: 3 // Column C onwards are dates
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🚀 Habit Tracker")
    .addItem("1. Re-Build / Reset Tracker Matrix", "setupTaskMatrix")
    .addSeparator()
    .addItem("2. Sync Today's Tasks to Google Calendar", "syncTodayToCalendar")
    .addItem("3. Reset / Clean Activity Log", "resetActivityLog")
    .addToUi();
}

/**
 * BUILDS MATRIX WITH EXACT GITHUB COLOR TIERS & TODAY HIGHLIGHT
 */
function setupTaskMatrix() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Setup 'Habit Tracker' Sheet
  let sheet = ss.getSheetByName(CONFIG.TRACKER_SHEET);
  if (!sheet) sheet = ss.insertSheet(CONFIG.TRACKER_SHEET);
  sheet.clear();
  sheet.clearNotes();

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

  sheet.getRange(2, 1, myTasks.length, 2).setValues(myTasks);
  sheet.getRange(2, 1, myTasks.length, 1).setFontWeight("bold");

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date();

  for (let i = 0; i < CONFIG.NUM_DAYS; i++) {
    let d = new Date(today);
    d.setDate(today.getDate() + i);
    
    let col = CONFIG.START_DATE_COL + i;
    let label = `${d.getDate()} ${monthNames[d.getMonth()]} (${dayNames[d.getDay()]})`;
    let headerCell = sheet.getRange(1, col);
    
    if (i === 0) {
      headerCell.setValue(label + " 📍").setBackground("#2563eb").setFontColor("#ffffff").setFontWeight("bold");
    } else {
      headerCell.setValue(label).setBackground("#111827").setFontColor("#ffffff").setFontWeight("bold");
    }
    
    sheet.setColumnWidth(col, 115);
    let checkRange = sheet.getRange(2, col, myTasks.length, 1);
    checkRange.insertCheckboxes();
  }

  sheet.getRange("A5").setValue("Tasks Completed").setFontWeight("bold");
  sheet.getRange("A6").setValue("Completion %").setFontWeight("bold");
  sheet.getRange("A7").setValue("GitHub Intensity").setFontWeight("bold");

  for (let i = 0; i < CONFIG.NUM_DAYS; i++) {
    let colLetter = getColumnLetter(CONFIG.START_DATE_COL + i);
    sheet.getRange(5, CONFIG.START_DATE_COL + i).setFormula(`=COUNTIF(${colLetter}2:${colLetter}4, TRUE)`);
    sheet.getRange(6, CONFIG.START_DATE_COL + i).setFormula(`=${colLetter}5 / 3`).setNumberFormat("0%");
    sheet.getRange(7, CONFIG.START_DATE_COL + i).setFormula(`=${colLetter}5`);
  }

  const heatmapRange = sheet.getRange(7, CONFIG.START_DATE_COL, 1, CONFIG.NUM_DAYS);
  heatmapRange.setNumberFormat(";;;");

  // GitHub 4-tier exact green colors
  const rules = [
    SpreadsheetApp.newConditionalFormatRule().whenNumberEqualTo(3).setBackground("#216e39").setRanges([heatmapRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberEqualTo(2).setBackground("#40c463").setRanges([heatmapRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberEqualTo(1).setBackground("#9be9a8").setRanges([heatmapRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberEqualTo(0).setBackground("#ebedf0").setRanges([heatmapRange]).build()
  ];
  sheet.setConditionalFormatRules(rules);

  // 2. Setup Activity Log Sheet
  resetActivityLog();

  SpreadsheetApp.getUi().alert("✅ Tracker initialized! Only the latest check time will be stored.");
}

/**
 * AUTOMATIC onEdit: Overwrites with the latest check time only
 */
function onEdit(e) {
  if (!e || !e.range) return;
  const range = e.range;
  const sheet = range.getSheet();
  
  if (sheet.getName() !== CONFIG.TRACKER_SHEET) return;
  
  const row = range.getRow();
  const col = range.getColumn();
  
  // Valid task checkbox range (Rows 2 to 4, Column C onwards)
  if (row >= 2 && row <= 4 && col >= CONFIG.START_DATE_COL) {
    const val = range.getValue();
    const isChecked = (val === true || val === "TRUE");
    
    const dateLabel = sheet.getRange(1, col).getValue().toString().replace(" 📍", "");
    const taskName = sheet.getRange(row, 1).getValue();
    const logSheet = sheet.getParent().getSheetByName(CONFIG.LOGS_SHEET);
    const now = new Date();
    const timeString = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    
    if (isChecked) {
      // 1. Update hover note to latest check time
      range.setNote(`✅ Done at:\n${timeString}`);
      // 2. Overwrite or insert into Activity Log
      upsertLatestLog(logSheet, dateLabel, taskName, timeString);
    } else {
      // 1. Clear note on uncheck
      range.clearNote();
      // 2. Remove entry from Activity Log if unchecked
      removeUncheckedLog(logSheet, dateLabel, taskName);
    }
  }
}

/**
 * Updates existing row if task was already logged, otherwise appends.
 * Result: Exactly ONE row per task per date, holding the latest timestamp!
 */
function upsertLatestLog(logSheet, dateLabel, taskName, timeString) {
  if (!logSheet) return;
  const lastRow = logSheet.getLastRow();
  
  if (lastRow > 1) {
    const data = logSheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === dateLabel && data[i][1] === taskName) {
        // Found existing entry -> OVERWRITE with latest time
        logSheet.getRange(i + 2, 3, 1, 2).setValues([["Completed", timeString]]);
        return;
      }
    }
  }
  
  // Not found -> append new entry
  logSheet.appendRow([dateLabel, taskName, "Completed", timeString]);
}

/**
 * Removes the row if user unchecks the box
 */
function removeUncheckedLog(logSheet, dateLabel, taskName) {
  if (!logSheet) return;
  const lastRow = logSheet.getLastRow();
  if (lastRow <= 1) return;
  
  const data = logSheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === dateLabel && data[i][1] === taskName) {
      logSheet.deleteRow(i + 2);
      return;
    }
  }
}

/**
 * Clears and resets the Activity Log tab headers
 */
function resetActivityLog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName(CONFIG.LOGS_SHEET);
  if (!logSheet) logSheet = ss.insertSheet(CONFIG.LOGS_SHEET);
  
  logSheet.clear();
  logSheet.getRange("A1:D1").setValues([["Date Column", "Task Name", "Status", "Last Checked At"]]);
  logSheet.getRange("A1:D1").setBackground("#1f2937").setFontColor("#ffffff").setFontWeight("bold");
  logSheet.setColumnWidth(1, 140);
  logSheet.setColumnWidth(2, 180);
  logSheet.setColumnWidth(3, 100);
  logSheet.setColumnWidth(4, 200);
}

function syncTodayToCalendar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.TRACKER_SHEET);
  if (!sheet) return;

  const calendar = CalendarApp.getDefaultCalendar();
  const today = new Date();
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

    let endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const event = calendar.createEvent(`[Habit] ${taskName}`, startTime, endTime, {
      description: "Auto-synced from your Habit Matrix"
    });
    event.addPopupReminder(10);
    count++;
  });

  SpreadsheetApp.getUi().alert(`📅 Synced ${count} tasks to Google Calendar!`);
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
