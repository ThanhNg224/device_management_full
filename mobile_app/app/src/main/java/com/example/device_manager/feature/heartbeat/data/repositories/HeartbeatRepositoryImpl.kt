package com.example.device_manager.feature.heartbeat.data.repositories

import com.example.device_manager.feature.heartbeat.data.datasources.remote.HeartbeatRemoteDataSource
import com.example.device_manager.feature.heartbeat.domain.entities.DeviceConfig
import com.example.device_manager.feature.heartbeat.domain.entities.DevicePerformance
import com.example.device_manager.feature.heartbeat.domain.repositories.HeartbeatRepository
import kotlinx.coroutines.flow.Flow
import org.json.JSONObject
import javax.inject.Inject

class HeartbeatRepositoryImpl @Inject constructor(
    private val remoteDataSource: HeartbeatRemoteDataSource,
) : HeartbeatRepository {
    private var lastDeviceCode: String? = null
    private var lastLocation: String? = null

    override fun observeRawMessages(): Flow<String> = remoteDataSource.observeRawMessages()

    override suspend fun connect(
        serverIp: String,
        deviceCode: String,
        version: String,
        location: String?,
        ipAddress: String,
    ) {
        lastDeviceCode = deviceCode
        lastLocation = location
        remoteDataSource.connect(
            serverIp = serverIp,
            deviceCode = deviceCode,
            version = version,
            location = location,
            ipAddress = ipAddress,
        )
    }

    override suspend fun sendHeartbeat(
        config: DeviceConfig,
        performance: DevicePerformance,
        version: String,
        ipAddress: String,
    ) {
        val deviceCode = lastDeviceCode
        val location = lastLocation
        val message = JSONObject().apply {
            put("deviceCode", deviceCode)
            put("version", version)
            put("location", location)
            put(
                "config",
                JSONObject().apply {
                    put("brightness", config.brightnessPercent)
                    put("volume", config.volumePercent)
                },
            )
            put("ipAddress", ipAddress)
            put(
                "performance",
                JSONObject().apply {
                    put("cpu", performance.cpuUsage * 100)
                    put("ram", performance.ramUsage * 100)
                    put("rom", performance.romUsage)
                    put("temp", performance.temperatureCelsius)
                },
            )
            put("timestamp", System.currentTimeMillis())
        }
        remoteDataSource.send(message.toString())
    }

    override suspend fun sendApkUpdateResult(success: Boolean, deviceCode: String) {
        val result = JSONObject().apply {
            put("type", "apk:update:result")
            put("serial", deviceCode)
            put("status", if (success) "success" else "failure")
        }
        remoteDataSource.send(result.toString())
    }

    override suspend fun close() = remoteDataSource.close()
}
