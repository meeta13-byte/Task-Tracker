# Setup & Usage Instructions

This guide walks you through setting up and using the **Habit & Task Tracker** in Google Sheets with automatic Google Calendar phone alerts, real-time timestamping, and a dedicated **mobile GitHub green dot Web App** on your iPhone.

---

## 📋 Prerequisites
* A Google Account.
* Access to your Google Sheet: [Task Tracker Sheet](https://docs.google.com/spreadsheets/d/1mViYNLdfI6GD93Og4KLQKN9YmXx3Gm8nXGuamfCPNuo/edit).
* Google Calendar app installed on your phone.
* Safari on iPhone and Mac.

---

## 🚀 Step 1: Install the Script into Google Sheets

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

## 📱 Step 3: Deploy the Mobile GitHub App (For iPhone Safari)

To get an authentic GitHub dark-mode interface with real green squares directly on your iPhone home screen:

1. In the **Apps Script** editor, click the blue **Deploy** button (top right) > **New deployment**.
2. Click the gear icon (**⚙️**) next to "Select type" and choose **Web app**.
3. Set the following fields:
   * **Description**: `Mobile Task Tracker`
   * **Execute as**: `Me`
   * **Who has access**: `Anyone` (or `Only myself`)
4. Click **Deploy**.
5. Copy the **Web App URL** shown under "Web app" (it will look like `https://script.google.com/macros/s/.../exec`).

### Add it to your iPhone Home Screen:
1. Send that Web App URL to your iPhone (via AirDrop, Messages, or WhatsApp) and open it in **Safari**.
2. You will see a dark-mode GitHub profile card with your tasks, streak, and green squares!
3. Tap the **Share** button in Safari (square with an up arrow 📤 at the bottom).
4. Tap **Add to Home Screen**.
5. Name it `Habits` and tap **Add**.

*Now, tapping that icon on your phone opens an authentic GitHub tracker app. Tapping any task checks it off in real-time and logs the timestamp in your Google Sheet!*

---

## 📅 Step 4: Sync Daily Tasks to Google Calendar (Phone Alerts)

Whenever you want today's tasks scheduled on your phone:
1. In the Google Sheet, click **🚀 Habit Tracker** > **2. Sync Today's Tasks to Google Calendar** (or tap the **Sync with Google Calendar** button right inside your mobile app!).
2. It will schedule `Gate (4 hours)` at `10:00`, `Leetcode (2 que)` at `18:00`, and `Github commit (5)` at `21:30` on your Google Calendar with a **10-minute popup alert** before each task.

---

## 🎯 Step 5: Daily Workflow

### Checking Off Tasks
* **On Phone**: Tap any task card in the mobile app. It turns green with a checkmark, updates your sheet in real-time, and stamps your completion time!
* **In Google Sheets**: Check the box for today's column (`📍`). Hover over the cell to see:
  ```
  ✅ Done at:
  2026-09-29 18:45:12
  ```

### GitHub Green Intensity
* ⬜ **0 Tasks (0%)**: Empty Dark Gray
* 🟩 **1 Task (33%)**: GitHub Light Green (`#0e4429`)
* 🟩 **2 Tasks (67%)**: GitHub Medium Green (`#006d32`)
* 🟩 **3 Tasks (100%)**: Vibrant GitHub Green (`#39d353`)
