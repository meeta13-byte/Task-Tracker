# Setup & Usage Instructions

This guide walks you through setting up and using the **Habit & Task Tracker** in Google Sheets with automatic Google Calendar phone alerts, real-time timestamping, and GitHub-style green streak indicators.

---

## 📋 Prerequisites
* A Google Account.
* Access to your Google Sheet: [Task Tracker Sheet](https://docs.google.com/spreadsheets/d/1mViYNLdfI6GD93Og4KLQKN9YmXx3Gm8nXGuamfCPNuo/edit).
* Google Calendar app installed on your smartphone (logged into the same Google account).

---

## 🚀 Step 1: Install the Script into Google Sheets

1. Open your Google Sheet in your web browser.
2. In the top navigation bar, click **Extensions** > **Apps Script**.
3. In the Apps Script code editor, delete any existing text inside `Code.gs`.
4. Copy the entire contents of [`Code.js`](./Code.js) and paste it into the editor.
5. Click the **Save** icon (💾) or press `Cmd + S` / `Ctrl + S`.
6. Return to your Google Sheet and **refresh the browser page** (`F5` or `Cmd + R`).

---

## 🛠️ Step 2: One-Click Auto-Setup

1. In the Google Sheets top menu bar, you will now see a custom menu: **🚀 Habit Tracker**.
2. Click **🚀 Habit Tracker** > **1. Re-Build / Reset Tracker Matrix**.
3. **Grant Permissions (First time only)**:
   * Google will show an *"Authorization Required"* popup.
   * Click **Continue**.
   * Select your Google Account.
   * Click **Advanced** (small text at bottom left).
   * Click **Go to Untitled project (unsafe)**.
   * Click **Allow**.
4. After authorization is granted, click **🚀 Habit Tracker** > **1. Re-Build / Reset Tracker Matrix** one more time.
5. Your sheet will automatically populate with:
   * Tasks: `Gate (4 hours)`, `Leetcode (2 que)`, `Github commit (5)`.
   * Date columns for the next 30 days with day labels (e.g., `29 Sep (Tue)`).
   * Today's column highlighted with a **blue header and 📍 pin icon**.
   * Dynamic completion calculations (`Tasks Completed`, `Completion %`).
   * GitHub-style green intensity squares in the bottom row.
   * An organized `Activity Log` sheet.

---

## 📱 Step 3: Sync Daily Tasks to Google Calendar (Phone Alerts)

Whenever you want today's tasks scheduled on your phone:
1. Click **🚀 Habit Tracker** in the sheet menu.
2. Select **2. Sync Today's Tasks to Google Calendar**.
3. The script will read your scheduled times from Column B (e.g., `10:00`, `18:00`, `21:30`) and schedule them on your Google Calendar with a **10-minute popup reminder** on your phone!

> **Tip for Daily Automation**:
> If you want calendar events created automatically every morning without clicking:
> 1. In Apps Script, click the **⏰ Triggers** icon on the left sidebar.
> 2. Click **+ Add Trigger**.
> 3. Select function: `syncTodayToCalendar`.
> 4. Event source: `Time-driven` -> `Day timer` -> `4am to 5am`.
> 5. Click **Save**.

---

## 🎯 Step 4: Daily Workflow

### Checking Off Tasks
* When you finish a task, click the checkbox in **Today's column (📍)**.
* **Hover Note**: The cell will immediately show a note:
  ```
  ✅ Done at:
  2026-09-29 18:45:12
  ```
* **Activity Log**: The sheet records the completion time in the `Activity Log` tab.
* **Smart Overwrite**: If you check, uncheck, and check again, it automatically **overwrites with the latest time only**—preventing messy duplicate rows.
* **Unchecking**: If you uncheck a box, the note is removed and the entry is cleared from the log.

### GitHub Green Intensity Bar
The `GitHub Intensity` row at the bottom visually indicates your progress for each day:
* ⬜ **0 Tasks (0%)**: GitHub Light Gray (`#ebedf0`)
* 🟩 **1 Task (33%)**: GitHub Light Green (`#9be9a8`)
* 🟩 **2 Tasks (67%)**: GitHub Medium Green (`#40c463`)
* 🟩 **3 Tasks (100%)**: GitHub Deep Green (`#216e39`)

---

## ⚙️ Customizing Your Tasks
To modify or add tasks:
1. Change the text in Column A (`Task Name`) or Column B (`Alert Time`).
2. If you add rows, ensure you include checkboxes and update the `COUNTIF` formula range in row 5 accordingly, or re-run setup from the menu.
