package com.example.device_manager.feature.serverip.presentation.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.example.device_manager.feature.serverip.presentation.viewmodel.ServerIpUiEvent
import com.example.device_manager.feature.serverip.presentation.viewmodel.ServerIpViewModel

@Composable
fun ServerIpRoute(
    viewModel: ServerIpViewModel,
    onNavigateToMain: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(viewModel) {
        viewModel.events.collect { event ->
            when (event) {
                ServerIpUiEvent.NavigateToMain -> onNavigateToMain()
            }
        }
    }

    ServerIpScreen(
        ip = uiState.ip,
        onIpChanged = viewModel::onIpChanged,
        onConfirm = viewModel::onConfirmClicked,
    )
}

