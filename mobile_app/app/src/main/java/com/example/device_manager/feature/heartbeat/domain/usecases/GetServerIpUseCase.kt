package com.example.device_manager.feature.heartbeat.domain.usecases

import com.example.device_manager.feature.heartbeat.domain.repositories.ServerSettingsRepository
import javax.inject.Inject

class GetServerIpUseCase @Inject constructor(
    private val serverSettingsRepository: ServerSettingsRepository,
) {
    operator fun invoke(): String = serverSettingsRepository.getServerIp()
}

