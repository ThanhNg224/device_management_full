package com.example.device_manager.feature.heartbeat.data.repositories

import android.content.Context
import com.example.device_manager.core.dispatchers.DispatcherProvider
import com.example.device_manager.feature.heartbeat.data.datasources.local.ApkUpdateManager
import com.example.device_manager.feature.heartbeat.domain.repositories.ApkUpdateRepository
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import javax.inject.Inject
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlin.coroutines.resume

class ApkUpdateRepositoryImpl @Inject constructor(
    @ApplicationContext private val context: Context,
    private val dispatchers: DispatcherProvider,
) : ApkUpdateRepository {
    override suspend fun downloadAndInstall(apkUrl: String, filename: String, namePackage: String): Boolean =
        withContext(dispatchers.main) {
            suspendCancellableCoroutine { continuation ->
                ApkUpdateManager(context) { success ->
                    if (continuation.isActive) continuation.resume(success)
                }.downloadAndInstall(
                    apkUrl = apkUrl,
                    filename = filename,
                    namePackage = namePackage,
                )
            }
        }
}
