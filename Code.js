/**
 * -------------------------------------------------------------
 * HABIT TRACKER: MATRIX + GOOGLE CALENDAR + MOBILE GITHUB WEB APP
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
 * SERVES THE MOBILE WEB APP & JSON API FOR ANDROID WIDGET
 */
function doGet(e) {
  // Return JSON for native Android Widget
  if (e && e.parameter && (e.parameter.format === "json" || e.parameter.api === "data")) {
    return ContentService.createTextOutput(JSON.stringify(getMobileData()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return HtmlService.createHtmlOutput(getMobileAppHtml())
    .setTitle("Habit Tracker")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * API: Fetches live data for the phone Web App
 */
function getMobileData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.TRACKER_SHEET);
  if (!sheet) return null;

  // 1. Get Tasks (Rows 2 to 4)
  const taskRows = sheet.getRange(2, 1, 3, 2).getValues();
  const todayChecks = sheet.getRange(2, CONFIG.START_DATE_COL, 3, 1).getValues();
  
  const tasks = taskRows.map((row, idx) => ({
    name: row[0],
    time: row[1],
    done: todayChecks[idx][0] === true
  }));

  // 2. Get 30 Days Heatmap Data
  const history = [];
  const dates = sheet.getRange(1, CONFIG.START_DATE_COL, 1, CONFIG.NUM_DAYS).getValues()[0];
  const completed = sheet.getRange(5, CONFIG.START_DATE_COL, 1, CONFIG.NUM_DAYS).getValues()[0];
  const intensities = sheet.getRange(7, CONFIG.START_DATE_COL, 1, CONFIG.NUM_DAYS).getValues()[0];

  for (let i = 0; i < CONFIG.NUM_DAYS; i++) {
    history.push({
      label: dates[i].toString().replace(" 📍", ""),
      isToday: i === 0,
      completed: Number(completed[i]) || 0,
      intensity: Number(intensities[i]) || 0
    });
  }

  // Calculate streak (consecutive days with 3/3 tasks)
  let streak = 0;
  for (let i = 0; i < history.length; i++) {
    if (history[i].completed === 3) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return { tasks: tasks, history: history, streak: streak };
}

/**
 * API: Allows checking/unchecking directly from phone Web App
 */
function toggleTaskFromWeb(taskIndex, isChecked) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.TRACKER_SHEET);
  if (!sheet) return;

  const targetRow = taskIndex + 2; // Tasks start at Row 2
  const targetCol = CONFIG.START_DATE_COL; // Today is Column C
  
  const range = sheet.getRange(targetRow, targetCol);
  range.setValue(isChecked);
  
  // Trigger timestamp & log handling
  const fakeEvent = { range: range };
  onEdit(fakeEvent);
  return getMobileData();
}

/**
 * BUILDS MATRIX WITH EXACT GITHUB COLOR TIERS & TODAY HIGHLIGHT
 */
function setupTaskMatrix() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let sheet = ss.getSheetByName(CONFIG.TRACKER_SHEET);
  if (!sheet) sheet = ss.insertSheet(CONFIG.TRACKER_SHEET);
  sheet.clear();
  sheet.clearNotes();

  const myTasks = [
    ["Gate (4 hours)", "10:00"],
    ["Leetcode (2 que)", "18:00"],
    ["Github commit (5)", "21:30"]
  ];

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

  const rules = [
    SpreadsheetApp.newConditionalFormatRule().whenNumberEqualTo(3).setBackground("#216e39").setRanges([heatmapRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberEqualTo(2).setBackground("#40c463").setRanges([heatmapRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberEqualTo(1).setBackground("#9be9a8").setRanges([heatmapRange]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberEqualTo(0).setBackground("#ebedf0").setRanges([heatmapRange]).build()
  ];
  sheet.setConditionalFormatRules(rules);

  resetActivityLog();
  SpreadsheetApp.getUi().alert("✅ Tracker initialized! Mobile GitHub app is ready.");
}

/**
 * AUTOMATIC onEdit: Records latest timestamp and updates activity log
 */
function onEdit(e) {
  if (!e || !e.range) return;
  const range = e.range;
  const sheet = range.getSheet();
  
  if (sheet.getName() !== CONFIG.TRACKER_SHEET) return;
  
  const row = range.getRow();
  const col = range.getColumn();
  
  if (row >= 2 && row <= 4 && col >= CONFIG.START_DATE_COL) {
    const val = range.getValue();
    const isChecked = (val === true || val === "TRUE");
    
    const dateLabel = sheet.getRange(1, col).getValue().toString().replace(" 📍", "");
    const taskName = sheet.getRange(row, 1).getValue();
    const logSheet = sheet.getParent().getSheetByName(CONFIG.LOGS_SHEET);
    const now = new Date();
    const timeString = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    
    if (isChecked) {
      range.setNote(`✅ Done at:\n${timeString}`);
      upsertLatestLog(logSheet, dateLabel, taskName, timeString);
    } else {
      range.clearNote();
      removeUncheckedLog(logSheet, dateLabel, taskName);
    }
  }
}

function upsertLatestLog(logSheet, dateLabel, taskName, timeString) {
  if (!logSheet) return;
  const lastRow = logSheet.getLastRow();
  
  if (lastRow > 1) {
    const data = logSheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === dateLabel && data[i][1] === taskName) {
        logSheet.getRange(i + 2, 3, 1, 2).setValues([["Completed", timeString]]);
        return;
      }
    }
  }
  logSheet.appendRow([dateLabel, taskName, "Completed", timeString]);
}

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

  // 1. Delete previous habit events for today to avoid duplicate entries!
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  const existingEvents = calendar.getEvents(startOfDay, endOfDay);
  existingEvents.forEach(ev => {
    const title = ev.getTitle();
    if (title.startsWith("[Habit]") || title.startsWith("[Task]")) {
      ev.deleteEvent();
    }
  });

  const taskData = sheet.getRange(2, 1, 3, 2).getValues();
  let count = 0;

  taskData.forEach(([taskName, timeStr]) => {
    if (!taskName || taskName.toString().trim() === "") return;

    // Explicitly exclude any "office" tasks from syncing
    if (taskName.toString().toLowerCase().includes("office")) return;
    
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

  SpreadsheetApp.getUi().alert(`📅 Synced ${count} tasks to Google Calendar (duplicates cleared, office excluded)!`);
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

/**
 * Mobile Web App HTML (Responsive GitHub Dark Mode UI)
 */
function getMobileAppHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Habit Tracker</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
    body { background-color: #0d1117; color: #c9d1d9; padding: 16px; min-height: 100vh; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #21262d; }
    .title { font-size: 20px; font-weight: 700; color: #f0f6fc; }
    .streak-badge { background: #238636; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 4px; }
    
    .card { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 16px; margin-bottom: 20px; }
    .card-title { font-size: 14px; font-weight: 600; color: #8b949e; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }

    /* Task Items */
    .task-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: #0d1117; border: 1px solid #30363d; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s ease; }
    .task-item.done { border-color: #238636; background: rgba(46, 160, 67, 0.1); }
    .task-left { display: flex; align-items: center; gap: 12px; }
    .task-checkbox { width: 22px; height: 22px; border-radius: 6px; border: 2px solid #484f58; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .task-item.done .task-checkbox { background: #238636; border-color: #238636; }
    .task-checkbox svg { display: none; fill: #ffffff; width: 14px; height: 14px; }
    .task-item.done .task-checkbox svg { display: block; }
    .task-name { font-size: 15px; font-weight: 500; color: #f0f6fc; }
    .task-item.done .task-name { text-decoration: line-through; color: #8b949e; }
    .task-time { font-size: 12px; color: #8b949e; background: #21262d; padding: 3px 8px; border-radius: 12px; }

    /* GitHub Heatmap Grid */
    .heatmap-container { overflow-x: auto; padding-bottom: 8px; -webkit-overflow-scrolling: touch; }
    .heatmap-grid { display: grid; grid-template-rows: repeat(3, 16px); grid-auto-flow: column; grid-auto-columns: 16px; gap: 4px; }
    .day-box { width: 16px; height: 16px; border-radius: 3px; cursor: pointer; position: relative; }
    
    .lvl-0 { background-color: #161b22; border: 1px solid #21262d; }
    .lvl-1 { background-color: #0e4429; }
    .lvl-2 { background-color: #006d32; }
    .lvl-3 { background-color: #39d353; }
    .is-today { outline: 2px solid #58a6ff; outline-offset: 1px; }

    .legend { display: flex; align-items: center; justify-content: flex-end; gap: 4px; font-size: 11px; color: #8b949e; margin-top: 10px; }
    .legend-box { width: 12px; height: 12px; border-radius: 2px; }

    .sync-btn { width: 100%; padding: 12px; background: #21262d; color: #58a6ff; border: 1px solid #30363d; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; text-align: center; margin-top: 8px; }
    .sync-btn:active { background: #30363d; }
    .loading-overlay { display: none; position: fixed; inset: 0; background: rgba(13,17,23,0.7); justify-content: center; align-items: center; font-size: 14px; color: #58a6ff; }
  </style>
</head>
<body>

  <div class="header">
    <div class="title">⚡ Habit Tracker</div>
    <div class="streak-badge" id="streakBadge">🔥 0 Days</div>
  </div>

  <!-- Today's Tasks Card -->
  <div class="card">
    <div class="card-title">Today's Targets</div>
    <div id="taskList">Loading tasks...</div>
    <button class="sync-btn" onclick="syncCalendar()">📅 Sync with Google Calendar</button>
  </div>

  <!-- GitHub Heatmap Card -->
  <div class="card">
    <div class="card-title">GitHub Contribution Matrix</div>
    <div class="heatmap-container">
      <div class="heatmap-grid" id="heatmapGrid"></div>
    </div>
    <div class="legend">
      <span>Less</span>
      <div class="legend-box lvl-0"></div>
      <div class="legend-box lvl-1"></div>
      <div class="legend-box lvl-2"></div>
      <div class="legend-box lvl-3"></div>
      <span>More</span>
    </div>
  </div>

  <div class="loading-overlay" id="loadingOverlay">Syncing...</div>

  <script>
    function loadData() {
      google.script.run.withSuccessHandler(renderData).getMobileData();
    }

    function renderData(data) {
      if (!data) return;

      // Update streak
      document.getElementById('streakBadge').innerText = '🔥 ' + data.streak + ' Day' + (data.streak === 1 ? '' : 's');

      // Render tasks
      const taskList = document.getElementById('taskList');
      taskList.innerHTML = '';
      data.tasks.forEach((task, idx) => {
        const item = document.createElement('div');
        item.className = 'task-item' + (task.done ? ' done' : '');
        item.onclick = () => toggle(idx, !task.done);
        item.innerHTML = \`
          <div class="task-left">
            <div class="task-checkbox">
              <svg viewBox="0 0 16 16"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>
            </div>
            <span class="task-name">\${task.name}</span>
          </div>
          <span class="task-time">\${task.time}</span>
        \`;
        taskList.appendChild(item);
      });

      // Render GitHub Heatmap Grid
      const grid = document.getElementById('heatmapGrid');
      grid.innerHTML = '';
      data.history.forEach(day => {
        const box = document.createElement('div');
        box.className = 'day-box lvl-' + day.intensity + (day.isToday ? ' is-today' : '');
        box.title = \`\${day.label}: \${day.completed}/3 Completed\`;
        box.onclick = () => alert(\`\${day.label}\\nStatus: \${day.completed}/3 tasks completed\`);
        grid.appendChild(box);
      });
    }

    function toggle(idx, isChecked) {
      showLoading(true);
      google.script.run
        .withSuccessHandler(newData => {
          showLoading(false);
          renderData(newData);
        })
        .toggleTaskFromWeb(idx, isChecked);
    }

    function syncCalendar() {
      showLoading(true);
      google.script.run
        .withSuccessHandler(msg => {
          showLoading(false);
          alert(msg);
        })
        .syncTodayToCalendar();
    }

    function showLoading(show) {
      document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }

    // Auto-load on open
    window.onload = loadData;
  </script>
</body>
</html>`;
}
