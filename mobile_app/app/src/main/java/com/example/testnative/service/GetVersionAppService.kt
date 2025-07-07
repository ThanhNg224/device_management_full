package com.example.testnative.service

import android.content.Context
import android.content.pm.PackageManager

class GetVersionAppService(private val context: Context) {

    fun getVersionName(): String {
        return try {
            val packageInfo = context.packageManager.getPackageInfo("com.atin.arcface", 0)
            packageInfo.versionName ?: "unknown"
        } catch (e: PackageManager.NameNotFoundException) {
            "unknown"
        }
    }
}
