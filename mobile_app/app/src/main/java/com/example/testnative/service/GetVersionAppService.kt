package com.example.testnative.service

import android.content.Context
import android.content.pm.PackageManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class GetVersionAppService(private val context: Context) {

    private var versionName: String = "unknown"
    private var job: Job? = null

    fun startAutoUpdate() {
        job?.cancel()
        job = CoroutineScope(Dispatchers.IO).launch {
            while (isActive) {
                versionName = getVersionNameInternal()
                delay(1000)
            }
        }
    }

    fun stopAutoUpdate() {
        job?.cancel()
    }

    fun getVersionName(): String {
        return versionName
    }

    private fun getVersionNameInternal(): String {
        return try {
            val packageInfo = context.packageManager.getPackageInfo("com.atin.arcface", 0)
            packageInfo.versionName ?: "unknown"
        } catch (_: PackageManager.NameNotFoundException) {
            "unknown"
        }
    }
}
