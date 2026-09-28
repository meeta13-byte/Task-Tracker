/**
 * -------------------------------------------------------------
 * HABIT & TASK TRACKER WITH GITHUB HEATMAP & GOOGLE CALENDAR
 * (Version 1: Initial Layout)
 * -------------------------------------------------------------
 */

const CONFIG = {
  TASKS_SHEET: "Tasks",
  HISTORY_SHEET: "History",
  HEATMAP_SHEET: "Heatmap",
  CHECK_COL: 3,       // Column C: Status checkbox
  TIMESTAMP_COL: 4,   // Column D: Completed At
};

/**
 * Adds a custom menu to the Google Sheet when opened.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🚀 Habit Tracker")
    .addItem("1. Run 1-Click Auto Setup (Build Sheets & Heatmap)", "setupEverything")
    .addSeparator()
    .addItem("2. Sync Today's Tasks to Google Calendar", "syncTasksToCalendar")
    .addItem("3. Test Daily Midnight Rollover", "dailyMidnightRollover")
    .addToUi();
}

/**
 * ONE-CLICK AUTO SETUP:
 * Formats Tasks, History, and the GitHub-style Heatmap tab automatically.
 */
function setupEverything() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Setup 'Tasks' Sheet
  let taskSheet = ss.getSheetByName(CONFIG.TASKS_SHEET);
  if (!taskSheet) taskSheet = ss.insertSheet(CONFIG.TASKS_SHEET);
  
  taskSheet.clear();
  taskSheet.getRange("A1:D1").setValues([["Task Name", "Scheduled Time (HH:MM)", "Done?", "Completed At"]]);
  taskSheet.getRange("A1:D1").setBackground("#1f2937").setFontColor("#ffffff").setFontWeight("bold");

  // Sample tasks that persist every day until you change them
  const sampleTasks = [
    ["Morning Workout", "07:00", false, ""],
    ["Read 20 Pages", "09:00", false, ""],
    ["Deep Work / Coding Session", "14:00", false, ""],
    ["Evening Reflection & Planning", "21:30", false, ""]
  ];
  taskSheet.getRange(2, 1, sampleTasks.length, 4).setValues(sampleTasks);
  
  // Insert Checkboxes for 50 rows
  const checkboxRange = taskSheet.getRange(2, CONFIG.CHECK_COL, 50, 1);
  checkboxRange.insertCheckboxes();
  taskSheet.setColumnWidth(1, 260);
  taskSheet.setColumnWidth(2, 180);
  taskSheet.setColumnWidth(3, 80);
  taskSheet.setColumnWidth(4, 180);

  // 2. Setup 'History' Sheet
  let histSheet = ss.getSheetByName(CONFIG.HISTORY_SHEET);
  if (!histSheet) histSheet = ss.insertSheet(CONFIG.HISTORY_SHEET);
  histSheet.clear();
  histSheet.getRange("A1:E1").setValues([["Date", "Total Tasks", "Completed", "Completion %", "Current Streak (Days)"]]);
  histSheet.getRange("A1:E1").setBackground("#1f2937").setFontColor("#ffffff").setFontWeight("bold");
  histSheet.getRange("D:D").setNumberFormat("0.0%");
  histSheet.setColumnWidth(1, 120);
  histSheet.setColumnWidth(2, 100);
  histSheet.setColumnWidth(3, 100);
  histSheet.setColumnWidth(4, 120);
  histSheet.setColumnWidth(5, 160);

  // 3. Setup 'Heatmap' Sheet (GitHub-style 52 weeks x 7 days)
  let heatSheet = ss.getSheetByName(CONFIG.HEATMAP_SHEET);
  if (!heatSheet) heatSheet = ss.insertSheet(CONFIG.HEATMAP_SHEET);
  heatSheet.clear();

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  days.forEach((day, idx) => {
    heatSheet.getRange(idx + 2, 1).setValue(day).setFontWeight("bold").setFontColor("#6b7280");
  });

  // Week header labels (W1 to W52)
  for (let w = 1; w <= 52; w++) {
    heatSheet.getRange(1, w + 1).setValue("W" + w).setFontSize(8).setFontColor("#9ca3af");
    heatSheet.setColumnWidth(w + 1, 24);
  }
  for (let r = 2; r <= 8; r++) {
    heatSheet.setRowHeight(r, 24);
  }

  // Set square grid cells with default 0 value
  const gridRange = heatSheet.getRange(2, 2, 7, 52);
  gridRange.setNumberFormat(";;;"); // Hide number text so only colors show

  // Apply GitHub Green Gradient Conditional Formatting
  const rule = SpreadsheetApp.newConditionalFormatRule()
    .setGradientMinpoint("#ebedf0")                // Empty/0% (Light Gray)
    .setGradientMidpointWithValue("#7bc96f", SpreadsheetApp.InterpolationType.PERCENT, "50") // 50% (Light Green)
    .setGradientMaxpointWithValue("#196127", SpreadsheetApp.InterpolationType.PERCENT, "100") // 100% (GitHub Dark Green)
    .setRanges([gridRange])
    .build();
  heatSheet.setConditionalFormatRules([rule]);

  SpreadsheetApp.getUi().alert("✅ Setup Complete! Your Tasks, History, and GitHub Heatmap have been configured.");
}

/**
 * Timestamp recorder: triggers when a checkbox in the Tasks sheet is marked.
 */
function handleTaskEdit(e) {
  if (!e || !e.range) return;
  const range = e.range;
  const sheet = range.getSheet();
  
  if (sheet.getName() !== CONFIG.TASKS_SHEET) return;
  
  const row = range.getRow();
  const col = range.getColumn();
  
  // When a checkbox in Column C is toggled
  if (col === CONFIG.CHECK_COL && row > 1) {
    const isChecked = range.getValue() === true;
    const timestampCell = sheet.getRange(row, CONFIG.TIMESTAMP_COL);
    
    if (isChecked) {
      const now = new Date();
      timestampCell.setValue(Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"));
    } else {
      timestampCell.clearContent();
    }
  }
}

/**
 * Runs automatically every midnight:
 * 1. Computes daily score and updates streak.
 * 2. Writes to History and updates the Heatmap square.
 * 3. Resets checkboxes for the new day.
 */
function dailyMidnightRollover() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const taskSheet = ss.getSheetByName(CONFIG.TASKS_SHEET);
  const histSheet = ss.getSheetByName(CONFIG.HISTORY_SHEET);
  const heatSheet = ss.getSheetByName(CONFIG.HEATMAP_SHEET);
  
  const lastRow = taskSheet.getLastRow();
  if (lastRow < 2) return;
  
  // Count completed tasks
  const values = taskSheet.getRange(2, 1, lastRow - 1, 4).getValues();
  let totalTasks = 0;
  let completedCount = 0;
  
  values.forEach(row => {
    if (row[0] && row[0].toString().trim() !== "") {
      totalTasks++;
      if (row[CONFIG.CHECK_COL - 1] === true) completedCount++;
    }
  });
  
  const completionRate = totalTasks > 0 ? (completedCount / totalTasks) : 0;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = Utilities.formatDate(yesterday, Session.getScriptTimeZone(), "yyyy-MM-dd");
  
  // Calculate consecutive streak
  const histLastRow = histSheet.getLastRow();
  let prevStreak = 0;
  if (histLastRow > 1) {
    prevStreak = Number(histSheet.getRange(histLastRow, 5).getValue()) || 0;
  }
  
  // Streak continues if 100% completed
  const currentStreak = (completionRate === 1.0) ? (prevStreak + 1) : 0;
  
  histSheet.appendRow([dateStr, totalTasks, completedCount, completionRate, currentStreak]);
  
  // Update GitHub Heatmap cell
  updateHeatmapCell(heatSheet, yesterday, completionRate);
  
  // Reset checkboxes and timestamps for the new day
  taskSheet.getRange(2, CONFIG.CHECK_COL, lastRow - 1, 1).setValue(false);
  taskSheet.getRange(2, CONFIG.TIMESTAMP_COL, lastRow - 1, 1).clearContent();
}

/**
 * Places the completion value in the corresponding week and day slot of the Heatmap.
 */
function updateHeatmapCell(heatSheet, date, score) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  const weekIndex = Math.min(52, Math.max(1, Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7)));
  
  // 1 = Mon, 7 = Sun
  let dayOfWeek = date.getDay();
  dayOfWeek = (dayOfWeek === 0) ? 7 : dayOfWeek; // Adjust Sunday to row 7
  
  heatSheet.getRange(dayOfWeek + 1, weekIndex + 1).setValue(score);
}

/**
 * Creates Google Calendar events with phone popup notifications for today's tasks.
 */
function syncTasksToCalendar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const taskSheet = ss.getSheetByName(CONFIG.TASKS_SHEET);
  const lastRow = taskSheet.getLastRow();
  if (lastRow < 2) return;
  
  const calendar = CalendarApp.getDefaultCalendar();
  const data = taskSheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const today = new Date();
  let scheduledCount = 0;
  
  data.forEach(([taskName, timeStr]) => {
    if (!taskName || taskName.toString().trim() === "") return;
    
    let startTime = new Date(today);
    if (timeStr && timeStr instanceof Date) {
      startTime.setHours(timeStr.getHours(), timeStr.getMinutes(), 0, 0);
    } else if (typeof timeStr === "string" && timeStr.includes(":")) {
      const parts = timeStr.split(":").map(Number);
      startTime.setHours(parts[0], parts[1], 0, 0);
    } else {
      startTime.setHours(9, 0, 0, 0); // Default: 9:00 AM
    }
    
    let endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
    
    // Add event with popup notification to phone 10 minutes before
    const event = calendar.createEvent(`[Task] ${taskName}`, startTime, endTime, {
      description: "Auto-synced from your Google Sheet Habit Tracker"
    });
    event.addPopupReminder(10);
    scheduledCount++;
  });
  
  SpreadsheetApp.getUi().alert(`📅 Synced ${scheduledCount} tasks to your Google Calendar with 10-min alerts!`);
}
