package com.example.device_manager.feature.heartbeat.data.datasources.remote

import kotlinx.coroutines.flow.Flow

interface HeartbeatRemoteDataSource {
    fun observeRawMessages(): Flow<String>
    suspend fun connect(serverIp: String, deviceCode: String, version: String, location: String?, ipAddress: String)
    suspend fun send(message: String)
    suspend fun close()
}

