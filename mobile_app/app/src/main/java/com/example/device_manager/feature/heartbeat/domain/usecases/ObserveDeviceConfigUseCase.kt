package com.example.device_manager.feature.heartbeat.domain.usecases

import com.example.device_manager.feature.heartbeat.domain.entities.DeviceConfig
import com.example.device_manager.feature.heartbeat.domain.repositories.DeviceMetricsRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import javax.inject.Inject

class ObserveDeviceConfigUseCase @Inject constructor(
    private val deviceMetricsRepository: DeviceMetricsRepository,
) {
    operator fun invoke(): Flow<DeviceConfig> =
        combine(
            deviceMetricsRepository.observeBrightnessPercent(),
            deviceMetricsRepository.observeVolumePercent(),
        ) { brightness, volume ->
            DeviceConfig(
                brightnessPercent = brightness,
                volumePercent = volume,
            )
        }
}

