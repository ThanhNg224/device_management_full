package com.example.device_manager.feature.heartbeat.domain.usecases

import com.example.device_manager.feature.heartbeat.domain.repositories.DeviceMetricsRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class ObserveTargetAppVersionUseCase @Inject constructor(
    private val deviceMetricsRepository: DeviceMetricsRepository,
) {
    operator fun invoke(): Flow<String> = deviceMetricsRepository.observeTargetAppVersion()
}

