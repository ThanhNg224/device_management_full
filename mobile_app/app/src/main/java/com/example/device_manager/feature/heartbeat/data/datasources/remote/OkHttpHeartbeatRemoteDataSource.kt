package com.example.device_manager.feature.heartbeat.data.datasources.remote

import android.util.Log
import com.example.device_manager.core.dispatchers.DispatcherProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OkHttpHeartbeatRemoteDataSource @Inject constructor(
    private val okHttpClient: OkHttpClient,
    dispatchers: DispatcherProvider,
) : HeartbeatRemoteDataSource {
    private val scope = CoroutineScope(dispatchers.io + SupervisorJob())
    private val messages = MutableSharedFlow<String>(extraBufferCapacity = 64)

    private var webSocket: WebSocket? = null
    private var isConnected: Boolean = false
    private var reconnectAttempts: Int = 0

    private var lastServerIp: String? = null
    private var lastDeviceCode: String? = null
    private var lastVersion: String? = null
    private var lastLocation: String? = null
    private var lastIpAddress: String? = null

    override fun observeRawMessages(): Flow<String> = messages.asSharedFlow()

    override suspend fun connect(
        serverIp: String,
        deviceCode: String,
        version: String,
        location: String?,
        ipAddress: String,
    ) {
        lastServerIp = serverIp
        lastDeviceCode = deviceCode
        lastVersion = version
        lastLocation = location
        lastIpAddress = ipAddress

        val serverUrl = "ws://$serverIp:4000"
        val request = Request.Builder().url(serverUrl).build()

        webSocket?.close(1000, "reconnect")
        webSocket = okHttpClient.newWebSocket(
            request,
            object : WebSocketListener() {
                override fun onOpen(webSocket: WebSocket, response: Response) {
                    Log.i("HeartbeatSocket", "Connected to $serverUrl")
                    isConnected = true
                    reconnectAttempts = 0
                }

                override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                    Log.e("HeartbeatSocket", "Connection failed: ${t.message}")
                    handleDisconnection()
                }

                override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                    Log.w("HeartbeatSocket", "Connection closed: $code / $reason")
                    handleDisconnection()
                }

                override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                    Log.w("HeartbeatSocket", "Closing connection: $code / $reason")
                    webSocket.close(1000, null)
                }

                override fun onMessage(webSocket: WebSocket, text: String) {
                    messages.tryEmit(text)
                }
            },
        )
    }

    override suspend fun send(message: String) {
        val socket = webSocket
        if (!isConnected || socket == null) {
            Log.w("HeartbeatSocket", "Cannot send - not connected")
            return
        }
        val ok = socket.send(message)
        if (!ok) handleDisconnection()
    }

    override suspend fun close() {
        isConnected = false
        webSocket?.close(1000, "Manual close")
        webSocket = null
    }

    private fun handleDisconnection() {
        isConnected = false
        scheduleReconnect()
    }

    private fun scheduleReconnect() {
        reconnectAttempts++
        val delayMs = (1 shl (reconnectAttempts - 1)).coerceAtMost(30) * 1000L
        Log.i("HeartbeatSocket", "Reconnecting in ${delayMs / 1000}s...")

        val serverIp = lastServerIp
        val deviceCode = lastDeviceCode
        val version = lastVersion
        val location = lastLocation
        val ipAddress = lastIpAddress

        if (serverIp == null || deviceCode == null || version == null || ipAddress == null) return

        scope.launch {
            delay(delayMs)
            connect(
                serverIp = serverIp,
                deviceCode = deviceCode,
                version = version,
                location = location,
                ipAddress = ipAddress,
            )
        }
    }
}
