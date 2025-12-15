package com.example.device_manager.feature.heartbeat.domain.usecases

import com.example.device_manager.feature.heartbeat.domain.repositories.HeartbeatRepository
import javax.inject.Inject

class ConnectHeartbeatUseCase @Inject constructor(
    private val heartbeatRepository: HeartbeatRepository,
) {
    suspend operator fun invoke(
        serverIp: String,
        deviceCode: String,
        version: String,
        location: String?,
        ipAddress: String,
    ) {
        heartbeatRepository.connect(
            serverIp = serverIp,
            deviceCode = deviceCode,
            version = version,
            location = location,
            ipAddress = ipAddress,
        )
    }
}

