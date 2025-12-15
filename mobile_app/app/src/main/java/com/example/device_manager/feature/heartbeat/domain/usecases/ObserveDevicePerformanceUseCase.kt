package com.example.device_manager.feature.heartbeat.domain.usecases

import com.example.device_manager.feature.heartbeat.domain.entities.DevicePerformance
import com.example.device_manager.feature.heartbeat.domain.repositories.DeviceMetricsRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class ObserveDevicePerformanceUseCase @Inject constructor(
    private val deviceMetricsRepository: DeviceMetricsRepository,
) {
    operator fun invoke(): Flow<DevicePerformance> = deviceMetricsRepository.observePerformance()
}

