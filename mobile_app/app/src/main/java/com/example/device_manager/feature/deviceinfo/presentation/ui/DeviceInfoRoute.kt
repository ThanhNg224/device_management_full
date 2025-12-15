package com.example.device_manager.feature.deviceinfo.presentation.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.example.device_manager.feature.deviceinfo.presentation.viewmodel.DeviceInfoUiEvent
import com.example.device_manager.feature.deviceinfo.presentation.viewmodel.DeviceInfoViewModel

@Composable
fun DeviceInfoRoute(
    viewModel: DeviceInfoViewModel,
    onNavigateToIpInput: () -> Unit,
    onToast: (String) -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(viewModel) {
        viewModel.events.collect { event ->
            when (event) {
                DeviceInfoUiEvent.NavigateToIpInput -> onNavigateToIpInput()
                is DeviceInfoUiEvent.ShowToast -> onToast(event.message)
            }
        }
    }

    DeviceInfoScreen(
        uiState = uiState,
        onChangeIpClicked = viewModel::onChangeIpClicked,
        onReboot = viewModel::onRebootClicked,
    )
}

