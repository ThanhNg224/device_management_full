package com.example.device_manager.feature.heartbeat.domain.repositories

import com.example.device_manager.feature.heartbeat.domain.entities.DevicePerformance
import kotlinx.coroutines.flow.Flow

interface DeviceMetricsRepository {
    fun observeBrightnessPercent(): Flow<Int>
    fun observeVolumePercent(): Flow<Int>
    fun observePerformance(): Flow<DevicePerformance>

    suspend fun getSerialNumber(): String
    suspend fun getIpAddress(): String

    fun observeTargetAppVersion(): Flow<String>
    suspend fun getTargetAppVersion(): String
}

