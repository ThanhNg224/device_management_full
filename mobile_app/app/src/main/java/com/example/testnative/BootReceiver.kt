package com.example.testnative

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val sharedPreferences = context.getSharedPreferences("AppPrefs", Context.MODE_PRIVATE)
            val serverIp = sharedPreferences.getString("server_ip", MyConfig.IP_DEFAULT) ?: MyConfig.IP_DEFAULT

            val serviceIntent = Intent(context, HeartbeatService::class.java)
            serviceIntent.putExtra("server_ip", serverIp)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        }
    }
}