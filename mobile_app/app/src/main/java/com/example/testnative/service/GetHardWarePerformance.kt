package com.example.testnative.service

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.StatFs
import android.os.storage.StorageManager
import java.io.BufferedReader
import java.io.File
import java.io.FileReader
import android.util.Log

class GetHardWarePerformance(
    private val context: Context,
    private val onUpdate: (cpu: Float, ram: Float, temp: Float, room: String) -> Unit
) {
    private val handler = Handler(Looper.getMainLooper())
    private var isObserving = false

    private var lastTotalTime: Long = 0
    private var lastIdleTime: Long = 0

    private val updateRunnable = object : Runnable {
        override fun run() {
            val cpu = getTotalCpuUsage()
            val ram = getRamUsage()
            val temp = getCpuTemperature()
            val rom = getRomUsage()

//            Log.d("Hardware", "CPU: ${cpu * 100}%, RAM: ${ram * 100}%, Temp: $temp°C")

            onUpdate(cpu, ram, temp, rom)

            if (isObserving) {
                handler.postDelayed(this, 1000) // Cập nhật mỗi 1 giây
            }
        }
    }


    /** Tính tổng phần trăm CPU sử dụng trên toàn hệ thống */
    private fun getTotalCpuUsage(): Float {
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
                return 0f // Bỏ lần đầu
            }

            val totalDelta = totalTime - lastTotalTime
            val idleDelta = idleTime - lastIdleTime

            lastTotalTime = totalTime
            lastIdleTime = idleTime

            if (totalDelta == 0L) return 0f

            (totalDelta - idleDelta).toFloat() / totalDelta.toFloat()
        } catch (e: Exception) {
            e.printStackTrace()
            0f
        }
    }

    /** Trả về % RAM đang sử dụng (0.0 - 1.0) */
    private fun getRamUsage(): Float {
        return try {
            val reader = BufferedReader(FileReader("/proc/meminfo"))
            var totalMem = 0L
            var freeMem = 0L

            repeat(10) {
                val line = reader.readLine() ?: return@repeat
                when {
                    line.startsWith("MemTotal:") -> {
                        totalMem = line.replace(Regex("[^0-9]"), "").toLong()
                    }
                    line.startsWith("MemAvailable:") -> {
                        freeMem = line.replace(Regex("[^0-9]"), "").toLong()
                    }
                }
            }
            reader.close()

            if (totalMem > 0) {
                1f - (freeMem.toFloat() / totalMem.toFloat())
            } else 0f
        } catch (e: Exception) {
            e.printStackTrace()
            0f
        }
    }

    @SuppressLint("DiscouragedPrivateApi", "ServiceCast")
    private fun getRomUsage(): String {
        return try {
            val storageManager = context.getSystemService(Context.STORAGE_SERVICE) as StorageManager
            val storageVolumeClazz = Class.forName("android.os.storage.StorageVolume")
            val getPath = storageVolumeClazz.getMethod("getPath")

            var total: Long = 0
            var free: Long = 0

            for (volume in storageManager.storageVolumes) {
                val path = getPath.invoke(volume) as String
                val stat = StatFs(path)
                val blockSize: Long
                val totalBlocks: Long
                val availableBlocks: Long

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) {
                    blockSize = stat.blockSizeLong
                    totalBlocks = stat.blockCountLong
                    availableBlocks = stat.availableBlocksLong
                } else {
                    blockSize = stat.blockSize.toLong()
                    totalBlocks = stat.blockCount.toLong()
                    availableBlocks = stat.availableBlocks.toLong()
                }

                total += totalBlocks * blockSize
                free += availableBlocks * blockSize
            }

            val used = total - free
            val gb = 1024f * 1024f * 1024f
            val usedGB = used / gb
            val totalGB = total / gb

            String.format("%.2f/%.0f", usedGB, totalGB)
        } catch (e: Exception) {
            e.printStackTrace()
            "0/0"
        }
    }

    /** Trả về nhiệt độ CPU (độ C) */
    private fun getCpuTemperature(): Float {
        return try {
            val file = File("/sys/class/thermal/thermal_zone0/temp")
            if (file.exists()) {
                val reader = BufferedReader(FileReader(file))
                val tempStr = reader.readLine()
                reader.close()
                tempStr?.toFloatOrNull()?.div(1000f) ?: 0f
            } else 0f
        } catch (e: Exception) {
            e.printStackTrace()
            0f
        }
    }

    fun startObserving() {
        if (!isObserving) {
            isObserving = true
            handler.post(updateRunnable)
        }
    }

    fun stopObserving() {
        isObserving = false
        handler.removeCallbacks(updateRunnable)
    }
}

