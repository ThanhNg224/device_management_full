package com.example.testnative

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.RequiresPermission
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.app.ActivityCompat
import com.example.testnative.service.GetBrightnessService
import com.example.testnative.service.GetHardWarePerformance
import com.example.testnative.service.GetImeiNumberService
import com.example.testnative.service.GetLevelVolumeService
import com.example.testnative.service.GetVersionAppService
import com.example.testnative.service.WebSocketClient
import org.json.JSONObject

class MainActivity : ComponentActivity() {

    private lateinit var serialService: GetImeiNumberService
    private lateinit var performance: GetHardWarePerformance
    private lateinit var volume: GetLevelVolumeService
    private lateinit var brightness: GetBrightnessService
    private lateinit var versionApp: GetVersionAppService
    private lateinit var client: WebSocketClient
    private lateinit var requestPermissionLauncher: ActivityResultLauncher<String>




    private var imei by mutableStateOf("Đang kiểm tra...")
    private var brightnessPercent by mutableIntStateOf(0)
    private var volumePercent by mutableIntStateOf(0)
    private var cpuPercent by mutableFloatStateOf(0f)
    private var ramPercent by mutableFloatStateOf(0f)
    private var tempCelsius by mutableFloatStateOf(0f)

    private val heartbeatHandler = Handler(Looper.getMainLooper())
    private val heartbeatRunnable = object : Runnable {
        override fun run() {
            sendHeartbeat()
            heartbeatHandler.postDelayed(this, 10_000) // 10s
        }
    }

    @RequiresPermission("android.permission.READ_PRIVILEGED_PHONE_STATE")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Khởi động service nếu chưa chạy
        val serviceIntent = Intent(this, HeartbeatService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }

        serialService = GetImeiNumberService(this)
        versionApp = GetVersionAppService(this)
        client = WebSocketClient(applicationContext)


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

        requestPermissionLauncher = registerForActivityResult(
            ActivityResultContracts.RequestPermission()
        ) { isGranted ->
            if (isGranted) {
                imei = serialService.getSerialNumber()
                connectAndStartHeartbeat()
            } else {
                imei = "Permission denied"
            }
        }

        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE)
            == PackageManager.PERMISSION_GRANTED
        ) {
            imei = serialService.getSerialNumber()
            connectAndStartHeartbeat()
        } else {
            requestPermissionLauncher.launch(Manifest.permission.READ_PHONE_STATE)
        }

        setContent {
            Surface {
                Column {
                    Text(text = "S/N: $imei")
                    Text(text = "CPU: ${cpuPercent * 100}%")
                    Text(text = "Ram: ${ramPercent * 100}%")
                    Text(text = "Temp: ${tempCelsius}°C")
                    Text(text = "Volume: ${volumePercent}%")
                    Text(text = "Brightness: ${brightnessPercent}%")
                    Text(text = "Version: ${versionApp.getVersionName()}")
                }
            }
        }
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
        heartbeatHandler.removeCallbacks(heartbeatRunnable)
        client.close()
    }
}