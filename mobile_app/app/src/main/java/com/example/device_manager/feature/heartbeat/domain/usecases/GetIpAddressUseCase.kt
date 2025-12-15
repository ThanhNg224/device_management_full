package com.example.device_manager.feature.heartbeat.domain.usecases

import com.example.device_manager.feature.heartbeat.domain.repositories.DeviceMetricsRepository
import javax.inject.Inject

class GetIpAddressUseCase @Inject constructor(
    private val deviceMetricsRepository: DeviceMetricsRepository,
) {
    suspend operator fun invoke(): String = deviceMetricsRepository.getIpAddress()
}

