package com.example.device_manager.feature.heartbeat.data.datasources.local

import android.content.SharedPreferences
import com.example.device_manager.core.config.AppDefaults
import javax.inject.Inject

class SharedPrefsServerSettingsDataSource @Inject constructor(
    private val sharedPreferences: SharedPreferences,
) : ServerSettingsDataSource {
    override fun getServerIp(): String =
        sharedPreferences.getString(AppDefaults.KEY_SERVER_IP, null) ?: AppDefaults.DEFAULT_SERVER_IP

    override fun setServerIp(ip: String) {
        sharedPreferences.edit().putString(AppDefaults.KEY_SERVER_IP, ip).apply()
    }
}

