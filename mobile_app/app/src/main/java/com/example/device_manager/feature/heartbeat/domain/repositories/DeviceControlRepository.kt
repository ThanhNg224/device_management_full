package com.example.device_manager.feature.heartbeat.domain.repositories

interface DeviceControlRepository {
    suspend fun rebootWithRoot(): Boolean
}

