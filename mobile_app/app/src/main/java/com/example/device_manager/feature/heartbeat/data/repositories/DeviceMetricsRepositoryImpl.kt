package com.example.device_manager.feature.heartbeat.data.repositories

import com.example.device_manager.feature.heartbeat.data.datasources.local.AndroidDeviceMetricsDataSource
import com.example.device_manager.feature.heartbeat.domain.entities.DevicePerformance
import com.example.device_manager.feature.heartbeat.domain.repositories.DeviceMetricsRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class DeviceMetricsRepositoryImpl @Inject constructor(
    private val dataSource: AndroidDeviceMetricsDataSource,
) : DeviceMetricsRepository {
    override fun observeBrightnessPercent(): Flow<Int> = dataSource.observeBrightnessPercent()
    override fun observeVolumePercent(): Flow<Int> = dataSource.observeVolumePercent()
    override fun observePerformance(): Flow<DevicePerformance> = dataSource.observePerformance()

    override suspend fun getSerialNumber(): String = dataSource.getSerialNumber()
    override suspend fun getIpAddress(): String = dataSource.getIpAddress()

    override fun observeTargetAppVersion(): Flow<String> =
        dataSource.observeTargetAppVersion(targetPackage = "com.atin.arcface")

    override suspend fun getTargetAppVersion(): String =
        dataSource.getTargetAppVersion(targetPackage = "com.atin.arcface")
}

