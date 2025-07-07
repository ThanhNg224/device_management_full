package com.example.testnative

import android.app.ActivityManager
import android.app.Application
import android.content.Intent
import android.os.Build

class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        startHeartbeatService()
    }

    private fun startHeartbeatService() {
        if (isServiceRunning()) return

        val serviceIntent = Intent(this, HeartbeatService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    private fun isServiceRunning(): Boolean {
        val manager = getSystemService(ACTIVITY_SERVICE) as ActivityManager
        return manager.getRunningServices(Integer.MAX_VALUE)
            .any { it.service.className == HeartbeatService::class.java.name }
    }
}