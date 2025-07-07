package com.example.testnative.service

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.annotation.RequiresPermission
import androidx.core.app.ActivityCompat

class GetImeiNumberService(private val context: Context) {
    @RequiresPermission("android.permission.READ_PRIVILEGED_PHONE_STATE")
    @SuppressLint("HardwareIds")
    fun getSerialNumber(): String {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE)
                    != PackageManager.PERMISSION_GRANTED) {
                    return "Permission not granted"
                }
                Build.getSerial()
            } else {
                Build.SERIAL
            }
        } catch (e: SecurityException) {
            "SecurityException: ${e.message}"
        } catch (e: Exception) {
            "Error: ${e.message}"
        }
    }
}