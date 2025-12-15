package com.example.device_manager.feature.serverip.presentation.viewmodel

import androidx.lifecycle.ViewModel
import com.example.device_manager.feature.heartbeat.domain.usecases.SetServerIpUseCase
import com.example.device_manager.feature.serverip.presentation.model.ServerIpUiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import javax.inject.Inject

@HiltViewModel
class ServerIpViewModel @Inject constructor(
    private val setServerIpUseCase: SetServerIpUseCase,
) : ViewModel() {
    private val _uiState = MutableStateFlow(ServerIpUiState())
    val uiState: StateFlow<ServerIpUiState> = _uiState.asStateFlow()

    private val _events = MutableSharedFlow<ServerIpUiEvent>()
    val events: SharedFlow<ServerIpUiEvent> = _events.asSharedFlow()

    fun onIpChanged(ip: String) {
        _uiState.update { it.copy(ip = ip) }
    }

    fun onConfirmClicked() {
        val ip = uiState.value.ip
        if (ip.isBlank()) return
        setServerIpUseCase(ip)
        _events.tryEmit(ServerIpUiEvent.NavigateToMain)
    }
}

sealed interface ServerIpUiEvent {
    data object NavigateToMain : ServerIpUiEvent
}

