# Setup & Usage Instructions

This guide walks you through setting up and using the **Habit & Task Tracker** in Google Sheets with automatic Google Calendar phone alerts, real-time timestamping, and a dedicated **native Samsung Android home screen widget** featuring GitHub-style green contribution dots.

---

## 📋 Prerequisites
* A Google Account.
* Access to your Google Sheet: [Task Tracker Sheet](https://docs.google.com/spreadsheets/d/1mViYNLdfI6GD93Og4KLQKN9YmXx3Gm8nXGuamfCPNuo/edit).
* Google Calendar app installed on your phone.
* Samsung Galaxy Phone (Android) & Mac with Safari.

---

## 🚀 Step 1: Install / Update the Script in Google Sheets

1. Open your Google Sheet in your web browser.
2. In the top navigation bar, click **Extensions** > **Apps Script**.
3. In the Apps Script code editor, delete any existing text inside `Code.gs`.
4. Copy the entire contents of [`Code.js`](./Code.js) and paste it into the editor.
5. Click the **Save** icon (💾) or press `Cmd + S` / `Ctrl + S`.
6. Return to your Google Sheet and **refresh the browser page** (`Cmd + R`).

---

## 🛠️ Step 2: One-Click Auto-Setup

1. In the Google Sheets top menu bar, click **🚀 Habit Tracker** > **1. Re-Build / Reset Tracker Matrix**.
2. **Grant Permissions (First time only)**:
   * Click **Continue** -> Select your Google Account -> Click **Advanced** -> Click **Go to Untitled project (unsafe)** -> Click **Allow**.
3. After authorization is granted, click **🚀 Habit Tracker** > **1. Re-Build / Reset Tracker Matrix** one more time.
4. Your sheet is now completely populated with your 3 tasks, dates, formulas, and GitHub colors!

---

## 📱 Step 3: Deploy the Web App & JSON API

To allow the native Android widget to read your live scores and streak:

1. In the **Apps Script** editor, click the blue **Deploy** button (top right) > **New deployment**.
2. Click the gear icon (**⚙️**) next to "Select type" and choose **Web app**.
3. Set the following fields:
   * **Description**: `Task Tracker API & Web App`
   * **Execute as**: `Me`
   * **Who has access**: `Anyone`
4. Click **Deploy**.
5. Copy the **Web App URL** shown under "Web app" (ends with `/exec`).

---

## 📲 Step 4: Install the Native Widget on your Samsung Phone

1. Go to the [Releases](https://github.com/meeta13-byte/Task-Tracker/releases) or [Actions Artifacts](https://github.com/meeta13-byte/Task-Tracker/actions) page in your GitHub repository.
2. Download the `app-debug.apk` file directly onto your Samsung phone.
3. Tap the downloaded file to install it (*enable "Install unknown apps" if prompted*).
4. Open the installed **Task Tracker** app.
5. Paste your **Google Apps Script Web App URL** from Step 3 and tap **Save & Sync Widget**.
6. On your Samsung home screen:
   * Long-press an empty area of your wallpaper.
   * Tap **Widgets**.
   * Find **Task Tracker**.
   * Drag the **Habits (GitHub Heatmap)** widget onto your home screen!

---

## 📅 Step 5: Sync Daily Tasks to Google Calendar (Phone Alerts)

* Click **🚀 Habit Tracker** > **2. Sync Today's Tasks to Google Calendar**.
* **Clean Calendar Sync**: Deletes any previously created habit events for today before syncing to guarantee **no duplicates**, and **filters out any "Office" tasks** so only your real study and habit goals are scheduled.
* Tasks will alert you 10 minutes before their scheduled time.

---

## 🎯 Step 6: Daily Workflow

### Checking Off Tasks
* **In Google Sheets**: Check the box for today's column (`📍`).
* **Hover Note**: The cell shows:
  ```
  ✅ Done at:
  2026-09-29 18:45:12
  ```
* **Activity Log**: Automatically updates with your latest check time.
* **Samsung Widget**: Tap the 🔄 refresh icon on your home screen widget to see your streak and green squares update instantly!

### GitHub Green Intensity
* ⬜ **0 Tasks (0%)**: Empty Dark Gray (`#161b22`)
* 🟩 **1 Task (33%)**: GitHub Light Green (`#0e4429`)
* 🟩 **2 Tasks (67%)**: GitHub Medium Green (`#006d32`)
* 🟩 **3 Tasks (100%)**: Vibrant GitHub Green (`#39d353`)
