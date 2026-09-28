# Project Overview

## Task Tracker with Google Sheets Calendar Sync and Android Widget

**Purpose.** This project is a personal habit and task tracking system that uses Google Sheets as its working data store, Google Apps Script for automation and web APIs, Google Calendar for reminders, and a native Android widget for at-a-glance progress. It is designed around a 30-day task matrix, completion timestamps, streaks, and a GitHub-style completion heatmap.

## Project Summary

The system starts in a Google Sheet. A custom Apps Script menu creates a three-task, 30-day tracker; records completion activity; and synchronizes selected tasks to the user’s default Google Calendar. The same Apps Script deployment serves both a responsive mobile page and a JSON endpoint. The Android app stores the deployment URL locally, and its home-screen widget fetches that JSON to display today’s completed-task count, a streak, and a 28-cell heatmap.

## Solution Architecture

| Layer | Responsibility | Key implementation |
| --- | --- | --- |
| Google Sheets | Primary tracker and visual matrix for daily check-offs. | Habit Tracker and Activity Log sheets; 30 date columns; checkboxes; formulas; conditional formatting. |
| Google Apps Script | Automation, calendar integration, user interface, and web API. | `Code.js` supplies setup, edit logging, Calendar sync, mobile HTML, and JSON data. |
| Google Calendar | Task reminders on the phone. | Recreates today’s habit events after removing prior tracker events; assigns a 10-minute popup reminder. |
| Android application | Configuration screen and home-screen widget. | Kotlin app saves the deployed Apps Script URL in `SharedPreferences` and broadcasts refresh requests. |
| Android widget | Compact daily-status display. | `RemoteViews` widget calls the JSON endpoint, calculates today’s count, and colors 28 heatmap cells. |
| GitHub Actions | Repeatable APK build and distribution. | JDK 17 and Gradle build a debug APK; workflow uploads it and releases it from the `main` branch. |

## Core Capabilities

- Creates a 30-day tracker with three configured tasks, scheduled times, checkbox completion fields, and a highlighted current day.
- Adds a timestamp note to a completed cell and maintains a latest-state record in the Activity Log sheet. Unchecking a task removes its note and log entry.
- Computes daily totals and completion percentages, then applies four visual levels from empty to fully completed.
- Provides a mobile-friendly web interface that can read and toggle the current day’s tasks through Apps Script.
- Avoids duplicate Calendar entries by first deleting existing habit or task events created for the current day. Tasks containing `Office` are intentionally excluded.
- Shows a widget streak for consecutive days with all three tasks completed, alongside today’s completed-task count and a GitHub-themed heatmap.

## Data Flow

A user checks a task in Google Sheets or the mobile web page. The Apps Script `onEdit` logic updates the cell note and the Activity Log. The JSON endpoint reads the tracker matrix, builds task and 30-day history records, and calculates the streak. The Android widget appends `format=json` to the configured web app URL, fetches that payload in a background thread, and renders the current status and available history. Calendar synchronization is user-initiated from the sheet menu and creates one-hour events for eligible tasks.

## Repository Structure

| Path | Role |
| --- | --- |
| `Code.js` | Google Apps Script source: spreadsheet setup, edit logging, Calendar synchronization, JSON API, and mobile web interface. |
| `android/` | Native Android Kotlin project, layouts, drawable resources, Gradle configuration, and widget metadata. |
| `android/app/src/main/java/.../MainActivity.kt` | URL configuration screen and widget refresh trigger. |
| `android/app/src/main/java/.../TaskTrackerWidgetProvider.kt` | Widget update lifecycle, API request, JSON parsing, and heatmap rendering. |
| `.github/workflows/build-apk.yml` | Continuous integration workflow that assembles and publishes the debug APK. |
| `README.md` and `INSTRUCTIONS.md` | Feature description and end-to-end setup guidance. |

## Technology and Deployment

| Area | Details |
| --- | --- |
| Scripting | Google Apps Script and Google Workspace services: `SpreadsheetApp`, `CalendarApp`, `ContentService`, and `HtmlService`. |
| Mobile | Kotlin Android app with AndroidX, Material Components, ConstraintLayout, and `AppWidgetProvider` / `RemoteViews`. |
| Build | Android compile and target SDK 34, minimum SDK 26, Java and Kotlin target 17, Gradle 8.5 in CI. |
| Distribution | GitHub Actions produces `android/app/build/outputs/apk/debug/app-debug.apk` as an artifact and `main`-branch release asset. |
| Configuration | The user deploys the Apps Script as a web app and pastes its HTTPS URL into the Android app. The URL is stored only on the device. |

## Operational Notes

- The current JSON reader treats the first configured date column as today, so the tracker should be rebuilt or maintained with the current day in that position.
- The widget uses manual refresh and an eight-second connection and read timeout. A failed request changes the status text to a sync-error message.
- Calendar synchronization changes the default calendar by deleting same-day events whose titles begin with `[Habit]` or `[Task]`, then recreating eligible tracker events. Review this naming convention before using it alongside other automations.
- The project’s configured default tasks are Gate, Leetcode, and Github commit. They can be changed in the Apps Script `setupTaskMatrix` function.

## Getting Started

1. Paste `Code.js` into a Google Sheets Apps Script project and run the tracker setup after authorization.
2. Deploy the script as a web app with access appropriate for the Android widget to retrieve its JSON data.
3. Build or download the Android APK, install it on an Android device, paste the web app URL, and add the widget to the home screen.
4. Use the Google Sheets menu to synchronize today’s tasks to Calendar when reminders are needed.
