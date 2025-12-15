package com.example.device_manager.feature.heartbeat.data.datasources.local

interface ServerSettingsDataSource {
    fun getServerIp(): String
    fun setServerIp(ip: String)
}

