package com.example.device_manager.feature.heartbeat.domain.entities

sealed interface RemoteCommand {
    data object Reboot : RemoteCommand

    data class ApkUpdate(
        val apkUrl: String,
        val filename: String,
        val namePackage: String,
    ) : RemoteCommand
}

