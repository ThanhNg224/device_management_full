package com.example.device_manager.feature.heartbeat.domain.repositories

import com.example.device_manager.feature.heartbeat.domain.entities.DeviceConfig
import com.example.device_manager.feature.heartbeat.domain.entities.DevicePerformance
import kotlinx.coroutines.flow.Flow

interface HeartbeatRepository {
    fun observeRawMessages(): Flow<String>
    suspend fun connect(serverIp: String, deviceCode: String, version: String, location: String?, ipAddress: String)
    suspend fun sendHeartbeat(config: DeviceConfig, performance: DevicePerformance, version: String, ipAddress: String)
    suspend fun sendApkUpdateResult(success: Boolean, deviceCode: String)
    suspend fun close()
}

