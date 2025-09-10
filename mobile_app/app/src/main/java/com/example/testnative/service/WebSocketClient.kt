package com.example.testnative.service

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONException
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class WebSocketClient(
    private val context: Context,
    private val serverIp: String
) {
    private lateinit var webSocket: WebSocket
    private val client = OkHttpClient.Builder()
        .pingInterval(3, TimeUnit.SECONDS) // 🔄 gửi ping tự động
        .build()

    private var isConnected = false
    private var reconnectAttempts = 0

    private val mainHandler = Handler(Looper.getMainLooper())

    private var lastDeviceCode: String? = null
    private var lastVersion: String = "1.0.0"
    private var lastLocation: String? = null
    private var lastIpAddress: String = ""

    var currentConfig: JSONObject = JSONObject()
    var currentPerformance: JSONObject = JSONObject()

    // Heartbeat task
    private val heartbeatRunnable = object : Runnable {
        override fun run() {
            if (isConnected) {
                try {
                    sendHeartbeat(currentConfig, currentPerformance, lastVersion, lastIpAddress)
                } catch (e: Exception) {
                    Log.e("WebSocketClient", "⚠️ Heartbeat error: ${e.message}")
                }
                mainHandler.postDelayed(this, 3_000)
            }
        }
    }

    fun connectServer(
        deviceCode: String,
        version: String = "1.0.0",
        location: String? = null,
        ipAddress: String,
    ) {
        lastDeviceCode = deviceCode
        lastVersion = version
        lastLocation = location
        lastIpAddress = ipAddress

        val serverUrl = "ws://$serverIp:4000"
        val request = Request.Builder().url(serverUrl).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.i("WebSocketClient", "✅ Connected to $serverUrl")
                isConnected = true
                reconnectAttempts = 0
                startHeartbeat()
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e("WebSocketClient", "❌ Connection failed: ${t.message}")
                handleDisconnection()
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.w("WebSocketClient", "⚠️ Connection closed: $code / $reason")
                handleDisconnection()
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.w("WebSocketClient", "⚠️ Closing connection: $code / $reason")
                webSocket.close(1000, null)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.d("WebSocketClient", "📩 Message: $text")
                handleMessage(text)
            }
        })
    }

    private fun handleDisconnection() {
        isConnected = false
        stopHeartbeat()
        scheduleReconnect()
    }

    private fun scheduleReconnect() {
        reconnectAttempts++
        val delay = (1 shl (reconnectAttempts - 1)).coerceAtMost(30) * 1000L
        Log.i("WebSocketClient", "🔄 Reconnecting in ${delay / 1000}s...")
        mainHandler.postDelayed({
            lastDeviceCode?.let {
                connectServer(it, lastVersion, lastLocation, lastIpAddress)
            }
        }, delay)
    }

    private fun startHeartbeat() {
        mainHandler.removeCallbacks(heartbeatRunnable)
        mainHandler.post(heartbeatRunnable)
    }

    private fun stopHeartbeat() {
        mainHandler.removeCallbacks(heartbeatRunnable)
    }

    fun sendHeartbeat(config: JSONObject, performance: JSONObject, version: String, ipAddress: String) {
        if (!isConnected || !::webSocket.isInitialized) {
            Log.w("WebSocketClient", "⚠️ Cannot send heartbeat - not connected")
            return
        }
        try {
            val message = JSONObject().apply {
                put("deviceCode", lastDeviceCode)
                put("version", version)
                put("location", lastLocation)
                put("config", config)
                put("ipAddress", ipAddress)
                put("performance", performance)
                put("timestamp", System.currentTimeMillis())
            }
            webSocket.send(message.toString())
            Log.d("WebSocketClient", "📤 Heartbeat sent $message")
        } catch (e: Exception) {
            Log.e("WebSocketClient", "⚠️ Heartbeat failed: ${e.message}")
            handleDisconnection()
        }
    }

    fun close() {
        stopHeartbeat()
        if (::webSocket.isInitialized) {
            webSocket.close(1000, "Manual close")
        }
        isConnected = false
    }

    private fun handleMessage(message: String) {
        try {
            val json = JSONObject(message)
            val type = json.optString("type", "")
            when (type) {
                "apk:update" -> {
                    mainHandler.post { handleApkUpdate(json) }
                }
                else -> Log.w("WebSocketClient", "⚠️ Unknown type: $type")
            }
        } catch (e: JSONException) {
            Log.e("WebSocketClient", "❌ JSON parse error: ${e.message}")
        }
    }

    private fun handleApkUpdate(json: JSONObject) {
        try {
            val apkUrl = json.getString("apkUrl")
            val filename = json.getString("filename")
            val namePackage = json.getString("namePackage")

            Log.i("WebSocketClient", "📦 Updating APK: $filename from $apkUrl")

            val updateManager = ApkUpdateManager(context) { success ->
                sendApkUpdateResult(success)
            }
            updateManager.downloadAndInstall(apkUrl, filename, namePackage)

        } catch (e: Exception) {
            Log.e("WebSocketClient", "❌ APK update error: ${e.message}")
            sendApkUpdateResult(false)
        }
    }

    private fun sendApkUpdateResult(success: Boolean) {
        try {
            val deviceCode = lastDeviceCode ?: "unknown"
            val result = JSONObject().apply {
                put("type", "apk:update:result")
                put("serial", deviceCode)
                put("status", if (success) "success" else "failure")
            }
            if (::webSocket.isInitialized && isConnected) {
                webSocket.send(result.toString())
                Log.i("WebSocketClient", "📦 APK update result sent: ${if (success) "success" else "failure"}")
            } else {
                Log.e("WebSocketClient", "❌ Cannot send APK result - not connected")
            }
        } catch (e: Exception) {
            Log.e("WebSocketClient", "❌ Error sending APK result: ${e.message}")
        }
    }
}