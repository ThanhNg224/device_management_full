package com.example.testnative

import android.Manifest
import android.content.Context
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
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.app.ActivityCompat
import com.example.testnative.service.GetBrightnessService
import com.example.testnative.service.GetHardWarePerformance
import com.example.testnative.service.GetImeiNumberService
import com.example.testnative.service.GetIpAddressService
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
    private lateinit var ipAddress: GetIpAddressService
    private lateinit var client: WebSocketClient
    private lateinit var requestPermissionLauncher: ActivityResultLauncher<String>

    private var imei by mutableStateOf("Đang kiểm tra...")
    private var brightnessPercent by mutableIntStateOf(0)
    private var volumePercent by mutableIntStateOf(0)
    private var cpuPercent by mutableFloatStateOf(0f)
    private var ramPercent by mutableFloatStateOf(0f)
    private var romPercent by mutableStateOf("")
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

        // Kiểm tra IP đã lưu
        val sharedPreferences = getSharedPreferences("AppPrefs", MODE_PRIVATE)
        var serverIp = sharedPreferences.getString("server_ip", null)
        if (serverIp == null) {
            serverIp = MyConfig.IP_DEFAULT
//            val intent = Intent(this, IpInputActivity::class.java)
//            startActivity(intent)
//            finish()
//            return
        }

        // Khởi động service
        val serviceIntent = Intent(this, HeartbeatService::class.java)
        serviceIntent.putExtra("server_ip", serverIp)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }

        // Khởi tạo các service
        serialService = GetImeiNumberService(this)
        versionApp = GetVersionAppService(this)
        ipAddress = GetIpAddressService(this)
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
        performance = GetHardWarePerformance(this) { cpu, ram, temp, rom ->
            cpuPercent = cpu
            ramPercent = ram
            tempCelsius = temp
            romPercent = rom
        }
        performance.startObserving()
        versionApp.startAutoUpdate()

        requestPermissionLauncher = registerForActivityResult(
            ActivityResultContracts.RequestPermission()
        ) { isGranted ->
            if (isGranted) {
                imei = serialService.getSerialNumber()
                connectAndStartHeartbeat()
            } else {
                imei = "Không có quyền truy cập"
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
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color.Transparent
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                brush = Brush.linearGradient(
                                    colors = listOf(
                                        Color(0xFF3B82F6),
                                        Color(0xFF8B5CF6)
                                    )
                                )
                            )
                    ) {
                        DeviceInfoScreen(
                            imei = imei,
                            cpuPercent = cpuPercent,
                            ramPercent = ramPercent,
                            tempCelsius = tempCelsius,
                            volumePercent = volumePercent,
                            brightnessPercent = brightnessPercent,
                            version = versionApp.getVersionName(),
                            onChangeIpClicked = {
                                client.close() // Đóng WebSocket trước khi đổi IP
                                val intent = Intent(this@MainActivity, IpInputActivity::class.java)
                                startActivity(intent)
                            }
                        )
                    }
                }
            }
        }
    }

    @RequiresPermission(Manifest.permission.ACCESS_NETWORK_STATE)
    private fun connectAndStartHeartbeat() {
//        client.connectServer(
//            deviceCode = imei,
//            version = versionApp.getVersionName(),
//            location = "ZONE_2",
//            ipAddress = ipAddress.getIpAddress(),
//        )
//        heartbeatHandler.post(heartbeatRunnable)
    }

    private fun sendHeartbeat() {
//        client.currentConfig = JSONObject().apply {
//            put("brightness", brightnessPercent)
//            put("volume", volumePercent)
//        }
//        client.currentPerformance = JSONObject().apply {
//            put("cpu", cpuPercent * 100)
//            put("ram", ramPercent * 100)
//            put("rom", romPercent)
//            put("temp", tempCelsius)
//        }
//        client.sendHeartbeat(
//            config = JSONObject().apply {
//                put("brightness", brightnessPercent)
//                put("volume", volumePercent)
//            },
//            performance = JSONObject().apply {
//                put("cpu", cpuPercent * 100)
//                put("ram", ramPercent * 100)
//                put("rom", romPercent)
//                put("temp", tempCelsius)
//            },
//            version = versionApp.getVersionName(),
//            ipAddress = ipAddress.getIpAddress()
//        )
    }

    override fun onDestroy() {
        super.onDestroy()
        brightness.stopObserving()
        volume.stopObserving()
        performance.stopObserving()
        versionApp.stopAutoUpdate()
        heartbeatHandler.removeCallbacks(heartbeatRunnable)
        client.close()
    }
}

@Composable
fun DeviceInfoScreen(
    imei: String,
    cpuPercent: Float,
    ramPercent: Float,
    tempCelsius: Float,
    volumePercent: Int,
    brightnessPercent: Int,
    version: String,
    onChangeIpClicked: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Bảng điều khiển thiết bị",
            style = MaterialTheme.typography.headlineMedium.copy(
                fontWeight = FontWeight.Bold,
                fontSize = 28.sp,
                color = Color.White
            ),
            modifier = Modifier.padding(bottom = 16.dp)
        )

        // Nút đổi IP
        Button(
            onClick = onChangeIpClicked,
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
        ) {
            Text("Đổi IP Server")
        }

        // Card Thông tin thiết bị
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(
                containerColor = Color.White.copy(alpha = 0.9f)
            ),
            elevation = CardDefaults.cardElevation(8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Thông tin thiết bị",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.SemiBold,
                        color = Color.Black
                    )
                )
                Text(
                    text = "Số serial: $imei",
                    style = MaterialTheme.typography.bodyLarge.copy(color = Color.DarkGray)
                )
                Text(
                    text = "Phiên bản ứng dụng: $version",
                    style = MaterialTheme.typography.bodyLarge.copy(color = Color.DarkGray)
                )
            }
        }

        // Card Hiệu suất phần cứng
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(
                containerColor = Color.White.copy(alpha = 0.9f)
            ),
            elevation = CardDefaults.cardElevation(8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Hiệu suất phần cứng",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.SemiBold,
                        color = Color.Black
                    )
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "CPU: ${(cpuPercent * 100).toInt()}%",
                        style = MaterialTheme.typography.bodyLarge.copy(color = Color.DarkGray)
                    )
                    LinearProgressIndicator(
                        progress = cpuPercent,
                        modifier = Modifier
                            .weight(1f)
                            .padding(start = 8.dp),
                        color = Color(0xFFEF4444),
                        trackColor = Color.Gray.copy(alpha = 0.3f)
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "RAM: ${(ramPercent * 100).toInt()}%",
                        style = MaterialTheme.typography.bodyLarge.copy(color = Color.DarkGray)
                    )
                    LinearProgressIndicator(
                        progress = ramPercent,
                        modifier = Modifier
                            .weight(1f)
                            .padding(start = 8.dp),
                        color = Color(0xFF3B82F6),
                        trackColor = Color.Gray.copy(alpha = 0.3f)
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Nhiệt độ: ${tempCelsius}°C",
                        style = MaterialTheme.typography.bodyLarge.copy(color = Color.DarkGray)
                    )
                    LinearProgressIndicator(
                        progress = tempCelsius / 100f,
                        modifier = Modifier
                            .weight(1f)
                            .padding(start = 8.dp),
                        color = Color(0xFFF59E0B),
                        trackColor = Color.Gray.copy(alpha = 0.3f)
                    )
                }
            }
        }

        // Card Cài đặt hệ thống
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(
                containerColor = Color.White.copy(alpha = 0.9f)
            ),
            elevation = CardDefaults.cardElevation(8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Cài đặt hệ thống",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.SemiBold,
                        color = Color.Black
                    )
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Âm lượng: ${volumePercent}%",
                        style = MaterialTheme.typography.bodyLarge.copy(color = Color.DarkGray)
                    )
                    LinearProgressIndicator(
                        progress = volumePercent / 100f,
                        modifier = Modifier
                            .weight(1f)
                            .padding(start = 8.dp),
                        color = Color(0xFF10B981),
                        trackColor = Color.Gray.copy(alpha = 0.3f)
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Độ sáng: ${brightnessPercent}%",
                        style = MaterialTheme.typography.bodyLarge.copy(color = Color.DarkGray)
                    )
                    LinearProgressIndicator(
                        progress = brightnessPercent / 100f,
                        modifier = Modifier
                            .weight(1f)
                            .padding(start = 8.dp),
                        color = Color(0xFFFBBF24),
                        trackColor = Color.Gray.copy(alpha = 0.3f)
                    )
                }
            }
        }
    }
}