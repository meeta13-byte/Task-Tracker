package com.meetagrawal.tasktracker

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val etUrl = findViewById<EditText>(R.id.et_script_url)
        val btnSave = findViewById<Button>(R.id.btn_save)
        val tvResult = findViewById<TextView>(R.id.tv_result)

        val prefs = getSharedPreferences("TaskTrackerPrefs", Context.MODE_PRIVATE)
        val savedUrl = prefs.getString("script_url", "")
        etUrl.setText(savedUrl)

        btnSave.setOnClickListener {
            val url = etUrl.text.toString().trim()
            if (url.isNotEmpty() && url.startsWith("http")) {
                prefs.edit().putString("script_url", url).apply()
                tvResult.text = "✅ URL saved! Updating home screen widget..."

                // Trigger widget update
                val intent = Intent(this, TaskTrackerWidgetProvider::class.java).apply {
                    action = TaskTrackerWidgetProvider.ACTION_REFRESH_WIDGET
                }
                sendBroadcast(intent)
            } else {
                tvResult.text = "⚠️ Please enter a valid Google Apps Script Web App URL."
            }
        }
    }
}
