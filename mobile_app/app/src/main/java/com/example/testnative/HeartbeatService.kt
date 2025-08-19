package com.example.testnative

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.annotation.RequiresPermission
import androidx.core.app.NotificationCompat
import com.example.testnative.service.GetBrightnessService
import com.example.testnative.service.GetHardWarePerformance
import com.example.testnative.service.GetImeiNumberService
import com.example.testnative.service.GetLevelVolumeService
import com.example.testnative.service.GetVersionAppService
import com.example.testnative.service.WebSocketClient
import org.json.JSONObject

class HeartbeatService : Service() {
    private lateinit var serialService: GetImeiNumberService
    private lateinit var performance: GetHardWarePerformance
    private lateinit var volume: GetLevelVolumeService
    private lateinit var brightness: GetBrightnessService
    private lateinit var versionApp: GetVersionAppService
    private lateinit var client: WebSocketClient

    private var imei = "Đang kiểm tra..."
    private var brightnessPercent = 0
    private var volumePercent = 0
    private var cpuPercent = 0f
    private var ramPercent = 0f
    private var tempCelsius = 0f

    private val heartbeatHandler = Handler(Looper.getMainLooper())
    private val heartbeatRunnable = object : Runnable {
        override fun run() {
            sendHeartbeat()
            heartbeatHandler.postDelayed(this, 10_000) // 10s
        }
    }

    @RequiresPermission("android.permission.READ_PRIVILEGED_PHONE_STATE")
    override fun onCreate() {
        super.onCreate()

        // Khởi tạo các service
        serialService = GetImeiNumberService(this)
        versionApp = GetVersionAppService(this)
        val sharedPreferences = getSharedPreferences("AppPrefs", Context.MODE_PRIVATE)
        val serverIp = sharedPreferences.getString("server_ip", "") ?: ""
        client = WebSocketClient(applicationContext, serverIp)

        // Volume
        volume = GetLevelVolumeService(this) {
            volumePercent = it
        }
        volumePercent = volume.getCurrentVolumePercent
        volume.startObserving()

        // Brightness
        brightness = GetBrightnessService(this) {
            brightnessPercent = it
        }
        brightnessPercent = brightness.currentBrightnessPercent
        brightness.startObserving()

        // Performance
        performance = GetHardWarePerformance { cpu, ram, temp ->
            cpuPercent = cpu
            ramPercent = ram
            tempCelsius = temp
        }
        performance.startObserving()

        // Xử lý permission và khởi động
        if (checkSelfPermission(Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            imei = serialService.getSerialNumber()
            startForegroundService()
            connectAndStartHeartbeat()
        } else {
            // Service không thể request permission trực tiếp, cần xử lý khác
            imei = "Permission required"
            stopSelf() // Dừng service nếu không có permission
        }
    }

    private fun startForegroundService() {
        val channelId = "heartbeat_service_channel"

        // Tạo notification channel (cho Android 8+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Heartbeat Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Dịch vụ giám sát thiết bị"
            }
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(channel)
        }

        // Tạo notification
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Thiết bị đang giám sát")
            .setContentText("Đang gửi dữ liệu về hệ thống")
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()

        // Bắt đầu foreground service
        startForeground(1, notification)
    }

    private fun connectAndStartHeartbeat() {
        client.connectServer(
            deviceCode = imei,
            version = versionApp.getVersionName(),
            location = "ZONE_2"
        )
        heartbeatHandler.post(heartbeatRunnable)
    }

    private fun sendHeartbeat() {
        client.currentConfig = JSONObject().apply {
            put("brightness", brightnessPercent)
            put("volume", volumePercent)
        }
        client.currentPerformance = JSONObject().apply {
            put("cpu", cpuPercent * 100)
            put("ram", ramPercent * 100)
            put("temp", tempCelsius)
        }
        client.sendHeartbeat(
            config = JSONObject().apply {
                put("brightness", brightnessPercent)
                put("volume", volumePercent)
            },
            performance = JSONObject().apply {
                put("cpu", cpuPercent * 100)
                put("ram", ramPercent * 100)
                put("temp", tempCelsius)
            },
            version = versionApp.getVersionName()
        )
    }

    override fun onDestroy() {
        super.onDestroy()
        brightness.stopObserving()
        volume.stopObserving()
        performance.stopObserving()
        heartbeatHandler.removeCallbacks(heartbeatRunnable)
        client.close()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Đảm bảo service sẽ được khởi động lại nếu bị kill
        return START_STICKY
    }
}