package com.example.device_manager.feature.heartbeat.domain.usecases

import com.example.device_manager.feature.heartbeat.domain.repositories.HeartbeatRepository
import javax.inject.Inject

class CloseHeartbeatUseCase @Inject constructor(
    private val heartbeatRepository: HeartbeatRepository,
) {
    suspend operator fun invoke() {
        heartbeatRepository.close()
    }
}

