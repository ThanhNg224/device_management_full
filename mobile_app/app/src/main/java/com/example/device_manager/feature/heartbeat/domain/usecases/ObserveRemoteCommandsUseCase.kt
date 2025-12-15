package com.example.device_manager.feature.heartbeat.domain.usecases

import com.example.device_manager.feature.heartbeat.domain.entities.RemoteCommand
import com.example.device_manager.feature.heartbeat.domain.repositories.HeartbeatRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.mapNotNull
import javax.inject.Inject

class ObserveRemoteCommandsUseCase @Inject constructor(
    private val heartbeatRepository: HeartbeatRepository,
    private val parseRemoteCommandUseCase: ParseRemoteCommandUseCase,
) {
    operator fun invoke(): Flow<RemoteCommand> =
        heartbeatRepository.observeRawMessages().mapNotNull { parseRemoteCommandUseCase(it) }
}

