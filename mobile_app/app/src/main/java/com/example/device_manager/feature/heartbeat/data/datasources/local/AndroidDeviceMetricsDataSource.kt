package com.example.device_manager.feature.heartbeat.data.datasources.local

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.database.ContentObserver
import android.media.AudioManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.StatFs
import android.os.storage.StorageManager
import android.provider.Settings
import androidx.core.app.ActivityCompat
import com.example.device_manager.core.dispatchers.DispatcherProvider
import com.example.device_manager.feature.heartbeat.domain.entities.DevicePerformance
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.File
import java.io.FileReader
import java.net.Inet4Address
import java.net.NetworkInterface

class AndroidDeviceMetricsDataSource(
    private val context: Context,
    private val dispatchers: DispatcherProvider,
) {
    fun observeBrightnessPercent(): Flow<Int> = callbackFlow {
        val contentObserver = object : ContentObserver(Handler(Looper.getMainLooper())) {
            override fun onChange(selfChange: Boolean) {
                trySend(getCurrentBrightnessPercent())
            }
        }

        trySend(getCurrentBrightnessPercent())
        context.contentResolver.registerContentObserver(
            Settings.System.getUriFor(Settings.System.SCREEN_BRIGHTNESS),
            false,
            contentObserver,
        )

        awaitClose {
            context.contentResolver.unregisterContentObserver(contentObserver)
        }
    }

    fun observeVolumePercent(): Flow<Int> = callbackFlow {
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        var lastVolume = -1
        val handler = Handler(Looper.getMainLooper())

        fun getCurrentVolumePercent(): Int {
            val current = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
            val max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            return if (max != 0) (current * 100) / max else 0
        }

        val runnable = object : Runnable {
            override fun run() {
                val current = getCurrentVolumePercent()
                if (current != lastVolume) {
                    lastVolume = current
                    trySend(current)
                }
                handler.postDelayed(this, 1000)
            }
        }

        trySend(getCurrentVolumePercent())
        handler.post(runnable)

        awaitClose { handler.removeCallbacks(runnable) }
    }

    fun observePerformance(): Flow<DevicePerformance> = flow {
        var lastTotalTime = 0L
        var lastIdleTime = 0L

        fun getTotalCpuUsage(): Float {
            return try {
                val reader = BufferedReader(FileReader("/proc/stat"))
                val line = reader.readLine()
                reader.close()

                val toks = line.split("\\s+".toRegex()).drop(1)
                if (toks.size < 7) return 0f

                val user = toks[0].toLong()
                val nice = toks[1].toLong()
                val system = toks[2].toLong()
                val idle = toks[3].toLong()
                val iowait = toks[4].toLong()
                val irq = toks[5].toLong()
                val softirq = toks[6].toLong()

                val idleTime = idle + iowait
                val totalTime = user + nice + system + idle + iowait + irq + softirq

                if (lastTotalTime == 0L || lastIdleTime == 0L) {
                    lastTotalTime = totalTime
                    lastIdleTime = idleTime
                    return 0f
                }

                val totalDelta = totalTime - lastTotalTime
                val idleDelta = idleTime - lastIdleTime

                lastTotalTime = totalTime
                lastIdleTime = idleTime

                if (totalDelta == 0L) return 0f
                (totalDelta - idleDelta).toFloat() / totalDelta.toFloat()
            } catch (_: Exception) {
                0f
            }
        }

        fun getRamUsage(): Float {
            return try {
                val reader = BufferedReader(FileReader("/proc/meminfo"))
                var totalMem = 0L
                var freeMem = 0L

                repeat(10) {
                    val line = reader.readLine() ?: return@repeat
                    when {
                        line.startsWith("MemTotal:") -> totalMem = line.replace(Regex("[^0-9]"), "").toLong()
                        line.startsWith("MemAvailable:") -> freeMem = line.replace(Regex("[^0-9]"), "").toLong()
                    }
                }
                reader.close()

                if (totalMem > 0) 1f - (freeMem.toFloat() / totalMem.toFloat()) else 0f
            } catch (_: Exception) {
                0f
            }
        }

        fun getCpuTemperature(): Float {
            return try {
                val file = File("/sys/class/thermal/thermal_zone0/temp")
                if (!file.exists()) return 0f
                val reader = BufferedReader(FileReader(file))
                val tempStr = reader.readLine()
                reader.close()
                tempStr?.toFloatOrNull()?.div(1000f) ?: 0f
            } catch (_: Exception) {
                0f
            }
        }

        fun getRomUsage(): String {
            return try {
                val storageManager = context.getSystemService(Context.STORAGE_SERVICE) as StorageManager
                val storageVolumeClazz = Class.forName("android.os.storage.StorageVolume")
                val getPath = storageVolumeClazz.getMethod("getPath")

                var total = 0L
                var free = 0L

                for (volume in storageManager.storageVolumes) {
                    val path = getPath.invoke(volume) as String
                    val stat = StatFs(path)

                    val blockSize: Long
                    val totalBlocks: Long
                    val availableBlocks: Long

                    blockSize = stat.blockSizeLong
                    totalBlocks = stat.blockCountLong
                    availableBlocks = stat.availableBlocksLong

                    total += totalBlocks * blockSize
                    free += availableBlocks * blockSize
                }

                val used = total - free
                val gb = 1024f * 1024f * 1024f
                val usedGB = used / gb
                val totalGB = total / gb

                String.format("%.2f/%.0f", usedGB, totalGB)
            } catch (_: Exception) {
                "0/0"
            }
        }

        while (kotlinx.coroutines.currentCoroutineContext().isActive) {
            emit(
                DevicePerformance(
                    cpuUsage = getTotalCpuUsage(),
                    ramUsage = getRamUsage(),
                    temperatureCelsius = getCpuTemperature(),
                    romUsage = getRomUsage(),
                ),
            )
            delay(1000)
        }
    }

    fun getSerialNumber(): String {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE)
                    != PackageManager.PERMISSION_GRANTED
                ) {
                    return "Permission not granted"
                }
                Build.getSerial()
            } else {
                @Suppress("DEPRECATION")
                Build.SERIAL
            }
        } catch (e: SecurityException) {
            "SecurityException: ${e.message}"
        } catch (e: Exception) {
            "Error: ${e.message}"
        }
    }

    @SuppressLint("DefaultLocale")
    fun getIpAddress(): String {
        return try {
            val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            val network = connectivityManager.activeNetwork ?: return "0.0.0.0"
            val caps = connectivityManager.getNetworkCapabilities(network)

            when {
                caps?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> {
                    val wifiManager =
                        context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
                    val ipInt = wifiManager.connectionInfo.ipAddress
                    String.format(
                        "%d.%d.%d.%d",
                        ipInt and 0xff,
                        ipInt shr 8 and 0xff,
                        ipInt shr 16 and 0xff,
                        ipInt shr 24 and 0xff,
                    )
                }

                else -> {
                    val interfaces = NetworkInterface.getNetworkInterfaces()
                    for (intf in interfaces) {
                        val addrs = intf.inetAddresses
                        for (addr in addrs) {
                            if (!addr.isLoopbackAddress && addr is Inet4Address) {
                                return addr.hostAddress ?: "0.0.0.0"
                            }
                        }
                    }
                    "0.0.0.0"
                }
            }
        } catch (_: Exception) {
            "0.0.0.0"
        }
    }

    fun observeTargetAppVersion(targetPackage: String): Flow<String> = flow {
        while (kotlinx.coroutines.currentCoroutineContext().isActive) {
            emit(getTargetAppVersion(targetPackage))
            delay(1000)
        }
    }

    suspend fun getTargetAppVersion(targetPackage: String): String = withContext(dispatchers.io) {
        try {
            val packageInfo = context.packageManager.getPackageInfo(targetPackage, 0)
            packageInfo.versionName ?: "unknown"
        } catch (_: PackageManager.NameNotFoundException) {
            "unknown"
        }
    }

    private fun getCurrentBrightnessPercent(): Int {
        return try {
            val brightness = Settings.System.getInt(
                context.contentResolver,
                Settings.System.SCREEN_BRIGHTNESS,
            )
            (brightness * 100) / 255
        } catch (_: Settings.SettingNotFoundException) {
            0
        }
    }
}
