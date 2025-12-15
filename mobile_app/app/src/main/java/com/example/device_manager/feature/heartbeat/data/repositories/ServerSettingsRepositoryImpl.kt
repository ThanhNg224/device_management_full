package com.example.device_manager.feature.heartbeat.data.repositories

import com.example.device_manager.feature.heartbeat.data.datasources.local.ServerSettingsDataSource
import com.example.device_manager.feature.heartbeat.domain.repositories.ServerSettingsRepository
import javax.inject.Inject

class ServerSettingsRepositoryImpl @Inject constructor(
    private val dataSource: ServerSettingsDataSource,
) : ServerSettingsRepository {
    override fun getServerIp(): String = dataSource.getServerIp()
    override fun setServerIp(ip: String) = dataSource.setServerIp(ip)
}

