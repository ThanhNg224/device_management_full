package com.example.device_manager.feature.deviceinfo.presentation.model

data class DeviceInfoUiState(
    val serial: String = "Ž?ang ki ¯Ÿm tra...",
    val version: String = "unknown",
    val cpuUsage: Float = 0f,
    val ramUsage: Float = 0f,
    val temperatureCelsius: Float = 0f,
    val romUsage: String = "0/0",
    val volumePercent: Int = 0,
    val brightnessPercent: Int = 0,
)

