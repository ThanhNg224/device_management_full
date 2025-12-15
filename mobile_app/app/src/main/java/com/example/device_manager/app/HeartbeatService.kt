package com.example.device_manager.app

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.widget.Toast
import androidx.core.app.NotificationCompat
import com.example.device_manager.R
import com.example.device_manager.core.dispatchers.DispatcherProvider
import com.example.device_manager.feature.heartbeat.domain.entities.DeviceConfig
import com.example.device_manager.feature.heartbeat.domain.entities.DevicePerformance
import com.example.device_manager.feature.heartbeat.domain.entities.RemoteCommand
import com.example.device_manager.feature.heartbeat.domain.usecases.CloseHeartbeatUseCase
import com.example.device_manager.feature.heartbeat.domain.usecases.ConnectHeartbeatUseCase
import com.example.device_manager.feature.heartbeat.domain.usecases.GetDeviceSerialNumberUseCase
import com.example.device_manager.feature.heartbeat.domain.usecases.GetIpAddressUseCase
import com.example.device_manager.feature.heartbeat.domain.usecases.GetServerIpUseCase
import com.example.device_manager.feature.heartbeat.domain.usecases.HandleRemoteCommandUseCase
import com.example.device_manager.feature.heartbeat.domain.usecases.ObserveDeviceConfigUseCase
import com.example.device_manager.feature.heartbeat.domain.usecases.ObserveDevicePerformanceUseCase
import com.example.device_manager.feature.heartbeat.domain.usecases.ObserveRemoteCommandsUseCase
import com.example.device_manager.feature.heartbeat.domain.usecases.ObserveTargetAppVersionUseCase
import com.example.device_manager.feature.heartbeat.domain.usecases.SendHeartbeatUseCase
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import javax.inject.Inject

@AndroidEntryPoint
class HeartbeatService : Service() {

    @Inject lateinit var observeDeviceConfigUseCase: ObserveDeviceConfigUseCase
    @Inject lateinit var observeDevicePerformanceUseCase: ObserveDevicePerformanceUseCase
    @Inject lateinit var observeTargetAppVersionUseCase: ObserveTargetAppVersionUseCase
    @Inject lateinit var observeRemoteCommandsUseCase: ObserveRemoteCommandsUseCase
    @Inject lateinit var getDeviceSerialNumberUseCase: GetDeviceSerialNumberUseCase
    @Inject lateinit var getIpAddressUseCase: GetIpAddressUseCase
    @Inject lateinit var getServerIpUseCase: GetServerIpUseCase
    @Inject lateinit var connectHeartbeatUseCase: ConnectHeartbeatUseCase
    @Inject lateinit var sendHeartbeatUseCase: SendHeartbeatUseCase
    @Inject lateinit var handleRemoteCommandUseCase: HandleRemoteCommandUseCase
    @Inject lateinit var closeHeartbeatUseCase: CloseHeartbeatUseCase
    @Inject lateinit var dispatchers: DispatcherProvider

    private val toastHandler = Handler(Looper.getMainLooper())

    private val scope by lazy { CoroutineScope(dispatchers.default + SupervisorJob()) }

    private var deviceCode: String = "Đang kiểm tra..."
    private var latestConfig: DeviceConfig = DeviceConfig(brightnessPercent = 0, volumePercent = 0)
    private var latestPerformance: DevicePerformance =
        DevicePerformance(cpuUsage = 0f, ramUsage = 0f, temperatureCelsius = 0f, romUsage = "0/0")
    private var latestVersion: String = "unknown"

    override fun onCreate() {
        super.onCreate()

        if (checkSelfPermission(Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            stopSelf()
            return
        }

        startForegroundService()

        scope.launch { observeDeviceConfigUseCase().collect { latestConfig = it } }

        scope.launch {
            observeDevicePerformanceUseCase().collect { latestPerformance = it }
        }

        scope.launch {
            observeTargetAppVersionUseCase().collect { latestVersion = it }
        }

        scope.launch {
            deviceCode = getDeviceSerialNumberUseCase()
            val serverIp = getServerIpUseCase()
            val ipAddress = getIpAddressUseCase()

            connectHeartbeatUseCase(
                serverIp = serverIp,
                deviceCode = deviceCode,
                version = latestVersion,
                location = "Sunworld",
                ipAddress = ipAddress,
            )

            launch {
                while (true) {
                    delay(3_000)
                    val currentIp = getIpAddressUseCase()
                    sendHeartbeatUseCase(
                        config = latestConfig,
                        performance = latestPerformance,
                        version = latestVersion,
                        ipAddress = currentIp,
                    )
                }
            }

            launch {
                observeRemoteCommandsUseCase().collect { command ->
                    val success = handleRemoteCommandUseCase(command, deviceCode = deviceCode)
                    if (!success && command is RemoteCommand.Reboot) {
                        toastHandler.post {
                            Toast.makeText(
                                applicationContext,
                                "Thiết bị chưa root hoặc từ chối quyền root",
                                Toast.LENGTH_SHORT,
                            ).show()
                        }
                    }
                }
            }
        }
    }

    private fun startForegroundService() {
        val channelId = "heartbeat_service_channel"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Heartbeat Service",
                NotificationManager.IMPORTANCE_LOW,
            ).apply {
                description = "Dịch vụ giám sát thiết bị"
            }
            (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Thiết bị đang giám sát")
            .setContentText("Đang gửi dữ liệu về hệ thống")
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()

        startForeground(1, notification)
    }

    override fun onDestroy() {
        super.onDestroy()
        runBlocking { closeHeartbeatUseCase() }
        scope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY
}
