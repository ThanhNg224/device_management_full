package com.example.device_manager.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import com.example.device_manager.feature.serverip.presentation.ui.ServerIpRoute
import com.example.device_manager.feature.serverip.presentation.viewmodel.ServerIpViewModel
import com.example.device_manager.ui.theme.DeviceManagerTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class IpInputActivity : ComponentActivity() {
    private val viewModel: ServerIpViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            DeviceManagerTheme {
                ServerIpRoute(
                    viewModel = viewModel,
                    onNavigateToMain = {
                        startActivity(Intent(this, MainActivity::class.java))
                        finish()
                    },
                )
            }
        }
    }
}
