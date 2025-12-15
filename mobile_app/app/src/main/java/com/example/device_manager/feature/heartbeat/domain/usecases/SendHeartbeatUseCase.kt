package com.example.device_manager.feature.heartbeat.domain.usecases

import com.example.device_manager.feature.heartbeat.domain.entities.DeviceConfig
import com.example.device_manager.feature.heartbeat.domain.entities.DevicePerformance
import com.example.device_manager.feature.heartbeat.domain.repositories.HeartbeatRepository
import javax.inject.Inject

class SendHeartbeatUseCase @Inject constructor(
    private val heartbeatRepository: HeartbeatRepository,
) {
    suspend operator fun invoke(
        config: DeviceConfig,
        performance: DevicePerformance,
        version: String,
        ipAddress: String,
    ) {
        heartbeatRepository.sendHeartbeat(
            config = config,
            performance = performance,
            version = version,
            ipAddress = ipAddress,
        )
    }
}

