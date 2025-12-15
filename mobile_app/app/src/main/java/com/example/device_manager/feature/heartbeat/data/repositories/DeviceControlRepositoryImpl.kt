package com.example.device_manager.feature.heartbeat.data.repositories

import com.example.device_manager.feature.heartbeat.data.datasources.local.RootCommandDataSource
import com.example.device_manager.feature.heartbeat.domain.repositories.DeviceControlRepository
import kotlinx.coroutines.withContext
import com.example.device_manager.core.dispatchers.DispatcherProvider
import javax.inject.Inject

class DeviceControlRepositoryImpl @Inject constructor(
    private val dataSource: RootCommandDataSource,
    private val dispatchers: DispatcherProvider,
) : DeviceControlRepository {
    override suspend fun rebootWithRoot(): Boolean = withContext(dispatchers.io) {
        dataSource.rebootWithRoot()
    }
}

