package com.example.testnative.service

import android.content.Context
import android.database.ContentObserver
import android.os.Handler
import android.os.Looper
import android.provider.Settings

class GetBrightnessService(
    private val context: Context,
    private val onChanged: (Int) -> Unit
) {
    private val contentObserver = object : ContentObserver(Handler(Looper.getMainLooper())) {
        override fun onChange(selfChange: Boolean) {
            super.onChange(selfChange)
            onChanged(currentBrightnessPercent)
        }
    }

    val currentBrightnessPercent: Int
        get() {
            return try {
                val brightness = Settings.System.getInt(
                    context.contentResolver,
                    Settings.System.SCREEN_BRIGHTNESS
                )
                (brightness * 100) / 255
            } catch (e: Settings.SettingNotFoundException) {
                0
            }
        }

    fun startObserving() {
        context.contentResolver.registerContentObserver(
            Settings.System.getUriFor(Settings.System.SCREEN_BRIGHTNESS),
            false,
            contentObserver
        )
    }

    fun stopObserving() {
        context.contentResolver.unregisterContentObserver(contentObserver)
    }
}
