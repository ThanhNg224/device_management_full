package com.example.device_manager.feature.heartbeat.domain.repositories

interface ServerSettingsRepository {
    fun getServerIp(): String
    fun setServerIp(ip: String)
}

