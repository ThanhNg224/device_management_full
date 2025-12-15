package com.example.device_manager.feature.heartbeat.domain.repositories

interface ApkUpdateRepository {
    suspend fun downloadAndInstall(apkUrl: String, filename: String, namePackage: String): Boolean
}

