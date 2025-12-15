package com.example.device_manager.feature.heartbeat.domain.entities

data class DevicePerformance(
    val cpuUsage: Float,
    val ramUsage: Float,
    val temperatureCelsius: Float,
    val romUsage: String,
)

