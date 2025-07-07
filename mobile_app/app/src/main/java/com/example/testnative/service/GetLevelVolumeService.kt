package com.example.testnative.service

import android.content.Context
import android.media.AudioManager
import android.os.Handler
import android.os.Looper

class GetLevelVolumeService(
    private val context: Context,
    private val onChanged: (Int) -> Unit
) {
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private var lastVolume = -1
    private var isObserving = false

    private val handler = Handler(Looper.getMainLooper())
    private val checkVolumeRunnable = object : Runnable {
        override fun run() {
            val current = getCurrentVolumePercent
            if (current != lastVolume) {
                lastVolume = current
                onChanged(current)
            }
            if (isObserving) {
                handler.postDelayed(this, 1000) // kiểm tra mỗi giây
            }
        }
    }

    val getCurrentVolumePercent: Int
        get() {
            val currentVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
            val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            return if (maxVolume != 0) {
                (currentVolume * 100) / maxVolume
            } else 0
        }

    fun startObserving() {
        isObserving = true
        handler.post(checkVolumeRunnable)
    }

    fun stopObserving() {
        isObserving = false
        handler.removeCallbacks(checkVolumeRunnable)
    }
}

