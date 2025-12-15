package com.example.device_manager.feature.heartbeat.domain.usecases

import com.example.device_manager.feature.heartbeat.domain.entities.RemoteCommand
import com.example.device_manager.feature.heartbeat.domain.repositories.ApkUpdateRepository
import com.example.device_manager.feature.heartbeat.domain.repositories.DeviceControlRepository
import com.example.device_manager.feature.heartbeat.domain.repositories.HeartbeatRepository
import javax.inject.Inject

class HandleRemoteCommandUseCase @Inject constructor(
    private val deviceControlRepository: DeviceControlRepository,
    private val apkUpdateRepository: ApkUpdateRepository,
    private val heartbeatRepository: HeartbeatRepository,
) {
    suspend operator fun invoke(command: RemoteCommand, deviceCode: String): Boolean {
        return when (command) {
            RemoteCommand.Reboot -> deviceControlRepository.rebootWithRoot()

            is RemoteCommand.ApkUpdate -> {
                if (command.apkUrl.isBlank() || command.filename.isBlank() || command.namePackage.isBlank()) {
                    heartbeatRepository.sendApkUpdateResult(success = false, deviceCode = deviceCode)
                    false
                } else {
                    val success = apkUpdateRepository.downloadAndInstall(
                        apkUrl = command.apkUrl,
                        filename = command.filename,
                        namePackage = command.namePackage,
                    )
                    heartbeatRepository.sendApkUpdateResult(success = success, deviceCode = deviceCode)
                    success
                }
            }
        }
    }
}
