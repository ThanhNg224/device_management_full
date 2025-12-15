package com.example.device_manager.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.core.app.ActivityCompat
import com.example.device_manager.feature.deviceinfo.presentation.ui.DeviceInfoRoute
import com.example.device_manager.feature.deviceinfo.presentation.viewmodel.DeviceInfoViewModel
import com.example.device_manager.feature.heartbeat.domain.usecases.GetServerIpUseCase
import com.example.device_manager.ui.theme.DeviceManagerTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private val viewModel: DeviceInfoViewModel by viewModels()

    @Inject lateinit var getServerIpUseCase: GetServerIpUseCase

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        startHeartbeatService()

        val requestPermissionLauncher = registerForActivityResult(
            ActivityResultContracts.RequestPermission(),
        ) { isGranted ->
            if (isGranted) viewModel.onPhoneStatePermissionGranted() else viewModel.onPhoneStatePermissionDenied()
        }

        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE)
            == PackageManager.PERMISSION_GRANTED
        ) {
            viewModel.onPhoneStatePermissionGranted()
        } else {
            requestPermissionLauncher.launch(Manifest.permission.READ_PHONE_STATE)
        }

        setContent {
            DeviceManagerTheme {
                DeviceInfoRoute(
                    viewModel = viewModel,
                    onNavigateToIpInput = { startActivity(Intent(this, IpInputActivity::class.java)) },
                    onToast = { message -> Toast.makeText(this, message, Toast.LENGTH_SHORT).show() },
                )
            }
        }
    }

    private fun startHeartbeatService() {
        val serverIp = getServerIpUseCase()
        val serviceIntent = Intent(this, HeartbeatService::class.java).apply {
            putExtra("server_ip", serverIp)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }
}
