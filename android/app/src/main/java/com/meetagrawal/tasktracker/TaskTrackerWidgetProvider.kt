package com.meetagrawal.tasktracker

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.widget.RemoteViews
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class TaskTrackerWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidgetData(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_REFRESH_WIDGET) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, TaskTrackerWidgetProvider::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget)
            for (appWidgetId in appWidgetIds) {
                updateWidgetData(context, appWidgetManager, appWidgetId)
            }
        }
    }

    private fun updateWidgetData(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.widget_task_tracker)

        // Set refresh intent
        val refreshIntent = Intent(context, TaskTrackerWidgetProvider::class.java).apply {
            action = ACTION_REFRESH_WIDGET
        }
        val pendingRefresh = PendingIntent.getBroadcast(
            context,
            appWidgetId,
            refreshIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.btn_refresh, pendingRefresh)

        // Launch app on widget click
        val appIntent = Intent(context, MainActivity::class.java)
        val pendingApp = PendingIntent.getActivity(
            context,
            0,
            appIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.tv_title, pendingApp)

        // Read saved URL from preferences
        val prefs = context.getSharedPreferences("TaskTrackerPrefs", Context.MODE_PRIVATE)
        val savedUrl = prefs.getString("script_url", "")

        if (savedUrl.isNullOrEmpty()) {
            views.setTextViewText(R.id.tv_status, "Tap to setup URL")
            appWidgetManager.updateAppWidget(appWidgetId, views)
            return
        }

        // Fetch from API in background thread
        thread {
            try {
                val fullUrl = if (savedUrl.contains("?")) "$savedUrl&format=json" else "$savedUrl?format=json"
                val url = URL(fullUrl)
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "GET"
                conn.connectTimeout = 8000
                conn.readTimeout = 8000
                conn.instanceFollowRedirects = true

                if (conn.responseCode == 200 || conn.responseCode == 302) {
                    val reader = BufferedReader(InputStreamReader(conn.inputStream))
                    val response = reader.readText()
                    reader.close()

                    val json = JSONObject(response)
                    val streak = json.optInt("streak", 0)
                    val tasks = json.optJSONArray("tasks")
                    val history = json.optJSONArray("history")

                    var doneCount = 0
                    val totalTasks = tasks?.length() ?: 3
                    if (tasks != null) {
                        for (i in 0 until tasks.length()) {
                            if (tasks.getJSONObject(i).optBoolean("done", false)) {
                                doneCount++
                            }
                        }
                    }

                    // Update UI views
                    views.setTextViewText(R.id.tv_streak, "🔥 ${streak}d")
                    views.setTextViewText(R.id.tv_status, "Today: $doneCount/$totalTasks Done")

                    // Color the 28 squares
                    if (history != null) {
                        for (i in 0 until minOf(28, history.length())) {
                            val dayObj = history.getJSONObject(i)
                            val intensity = dayObj.optInt("intensity", 0)
                            val squareId = context.resources.getIdentifier("sq_$i", "id", context.packageName)
                            if (squareId != 0) {
                                val color = when (intensity) {
                                    3 -> Color.parseColor("#39d353") // Vibrant GitHub Green
                                    2 -> Color.parseColor("#006d32") // Medium Green
                                    1 -> Color.parseColor("#0e4429") // Light Green
                                    else -> Color.parseColor("#161b22") // Dark Empty
                                }
                                views.setInt(squareId, "setBackgroundColor", color)
                            }
                        }
                    }

                    appWidgetManager.updateAppWidget(appWidgetId, views)
                }
            } catch (e: Exception) {
                views.setTextViewText(R.id.tv_status, "Sync error: tap 🔄")
                appWidgetManager.updateAppWidget(appWidgetId, views)
            }
        }
    }

    companion object {
        const val ACTION_REFRESH_WIDGET = "com.meetagrawal.tasktracker.REFRESH_WIDGET"
    }
}
