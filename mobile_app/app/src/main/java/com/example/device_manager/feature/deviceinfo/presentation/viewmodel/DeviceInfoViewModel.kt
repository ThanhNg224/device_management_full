package com.example.device_manager.feature.deviceinfo.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.device_manager.feature.deviceinfo.presentation.model.DeviceInfoUiState
import com.example.device_manager.feature.heartbeat.domain.entities.RemoteCommand
import com.example.device_manager.feature.heartbeat.domain.usecases.GetDeviceSerialNumberUseCase
import com.example.device_manager.feature.heartbeat.domain.usecases.HandleRemoteCommandUseCase
import com.example.device_manager.feature.heartbeat.domain.usecases.ObserveDeviceConfigUseCase
import com.example.device_manager.feature.heartbeat.domain.usecases.ObserveDevicePerformanceUseCase
import com.example.device_manager.feature.heartbeat.domain.usecases.ObserveTargetAppVersionUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DeviceInfoViewModel @Inject constructor(
    private val observeDeviceConfigUseCase: ObserveDeviceConfigUseCase,
    private val observeDevicePerformanceUseCase: ObserveDevicePerformanceUseCase,
    private val observeTargetAppVersionUseCase: ObserveTargetAppVersionUseCase,
    private val getDeviceSerialNumberUseCase: GetDeviceSerialNumberUseCase,
    private val handleRemoteCommandUseCase: HandleRemoteCommandUseCase,
) : ViewModel() {
    private val _uiState = MutableStateFlow(DeviceInfoUiState())
    val uiState: StateFlow<DeviceInfoUiState> = _uiState.asStateFlow()

    private val _events = MutableSharedFlow<DeviceInfoUiEvent>()
    val events: SharedFlow<DeviceInfoUiEvent> = _events.asSharedFlow()

    init {
        viewModelScope.launch {
            observeDeviceConfigUseCase().collect { config ->
                _uiState.update {
                    it.copy(
                        brightnessPercent = config.brightnessPercent,
                        volumePercent = config.volumePercent,
                    )
                }
            }
        }

        viewModelScope.launch {
            observeDevicePerformanceUseCase().collect { performance ->
                _uiState.update {
                    it.copy(
                        cpuUsage = performance.cpuUsage,
                        ramUsage = performance.ramUsage,
                        temperatureCelsius = performance.temperatureCelsius,
                        romUsage = performance.romUsage,
                    )
                }
            }
        }

        viewModelScope.launch {
            observeTargetAppVersionUseCase().collect { version ->
                _uiState.update { it.copy(version = version) }
            }
        }
    }

    fun onPhoneStatePermissionGranted() {
        viewModelScope.launch {
            _uiState.update { it.copy(serial = getDeviceSerialNumberUseCase()) }
        }
    }

    fun onPhoneStatePermissionDenied() {
        _uiState.update { it.copy(serial = "KhA'ng cA3 quy ¯?n truy c §-p") }
    }

    fun onChangeIpClicked() {
        viewModelScope.launch {
            _events.emit(DeviceInfoUiEvent.NavigateToIpInput)
        }
    }

    fun onRebootClicked() {
        viewModelScope.launch {
            val success = handleRemoteCommandUseCase(RemoteCommand.Reboot, deviceCode = uiState.value.serial)
            if (!success) {
                _events.emit(DeviceInfoUiEvent.ShowToast("Thi §¨t b ¯< ch’øa root ho §úc t ¯® ch ¯`i quy ¯?n root"))
            }
        }
    }
}

sealed interface DeviceInfoUiEvent {
    data object NavigateToIpInput : DeviceInfoUiEvent
    data class ShowToast(val message: String) : DeviceInfoUiEvent
}

