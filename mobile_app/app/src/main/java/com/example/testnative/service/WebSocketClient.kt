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

    var currentConfig: JSONObject = JSONObject()
    var currentPerformance: JSONObject = JSONObject()

    // Heartbeat task
    private val heartbeatRunnable = object : Runnable {
        override fun run() {
            if (isConnected) {
                try {
                    sendHeartbeat(currentConfig, currentPerformance, lastVersion)
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
        location: String? = null
    ) {
        lastDeviceCode = deviceCode
        lastVersion = version
        lastLocation = location

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
                connectServer(it, lastVersion, lastLocation)
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

    fun sendHeartbeat(config: JSONObject, performance: JSONObject, version: String) {
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


//class WebSocketClient(private val context: Context, private val serverIp: String) {
//    private lateinit var webSocket: WebSocket
//    private val client = OkHttpClient()
//    private var isConnected = false
//    private var isReconnecting = false
//    private val reconnectHandler = Handler(Looper.getMainLooper())
//
//    private var lastDeviceCode: String? = null
//    private var lastVersion: String = "1.0.0"
//    private var lastLocation: String? = null
//
//    private val reconnectRunnable = object : Runnable {
//        override fun run() {
//            if (!isConnected && !isReconnecting) {
//                println("🔄 Attempting to reconnect...")
//                lastDeviceCode?.let {
//                    connectServer(it, lastVersion, lastLocation)
//                }
//            }
//        }
//    }
//
//    fun connectServer(
//        deviceCode: String,
//        version: String = "1.0.0",
//        location: String? = null
//    ) {
//        lastDeviceCode = deviceCode
//        lastVersion = version
//        lastLocation = location
//        isReconnecting = true
//        reconnectHandler.removeCallbacks(reconnectRunnable)
//
//        val serverUrl = "ws://$serverIp:3000"
//        val request = Request.Builder().url(serverUrl).build()
//        webSocket = client.newWebSocket(request, object : WebSocketListener() {
//            override fun onOpen(webSocket: WebSocket, response: Response) {
//                println("✅ Connected to server at $serverUrl")
//                isConnected = true
//                isReconnecting = false
//            }
//
//            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
//                println("❌ Connection failed: ${t.message}")
//                handleDisconnection()
//            }
//
//            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
//                println("⚠️ Connection closed: $code / $reason")
//                handleDisconnection()
//            }
//
//            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
//                println("⚠️ Closing connection: $code / $reason")
//                webSocket.close(1000, null)
//            }
//
//            override fun onMessage(webSocket: WebSocket, text: String) {
//                handleMessage(text)
//                val TAG = "WebSocketClient"
//                Log.d(TAG, "📩 Message received: $text")
//                try {
//                    val json = JSONObject(text)
//                    val type = json.optString("type")
//                    when (type) {
//                        "apk:update" -> {
//                            val apkUrl = json.optString("apkUrl")
//                            val filename = json.optString("filename")
//                            val namePackage = json.optString("namePackage")
//                            Log.i(TAG, "🚀 Update APK received:")
//                            Log.i(TAG, "📦 Package Name: $namePackage")
//                            Log.i(TAG, "📁 Filename: $filename")
//                            Log.i(TAG, "🔗 URL: $apkUrl")
//                        }
//                        else -> {
//                            println("⚠️ Unknown message type: $type")
//                        }
//                    }
//                } catch (e: JSONException) {
//                    println("❌ Failed to parse JSON: ${e.message}")
//                }
//            }
//        })
//    }
//
//    private fun handleDisconnection() {
//        isConnected = false
//        isReconnecting = false
//        reconnectHandler.postDelayed(reconnectRunnable, 1000)
//    }
//
//    fun sendHeartbeat(
//        config: JSONObject,
//        performance: JSONObject,
//        version: String,
//    ) {
//        if (!isConnected || !::webSocket.isInitialized) {
//            println("⚠️ Cannot send heartbeat - not connected")
//            return
//        }
//
//        try {
//            val message = JSONObject().apply {
//                put("deviceCode", lastDeviceCode)
//                put("version", version)
//                put("location", lastLocation)
//                put("config", config)
//                put("performance", performance)
//                put("timestamp", System.currentTimeMillis())
//            }
//            webSocket.send(message.toString())
//            println("📤 Sent heartbeat")
//        } catch (e: Exception) {
//            println("⚠️ Send failed: ${e.message}")
//            handleDisconnection()
//        }
//    }
//
//    fun close() {
//        reconnectHandler.removeCallbacks(reconnectRunnable)
//        if (::webSocket.isInitialized) {
//            webSocket.close(1000, "Manual close")
//        }
//        isConnected = false
//        isReconnecting = false
//    }
//
//    private fun handleMessage(message: String) {
//        try {
//            val json = JSONObject(message)
//            val type = json.optString("type", "")
//
//            when (type) {
//                "apk:update" -> {
//                    Handler(Looper.getMainLooper()).post {
//                        handleApkUpdate(json)
//                    }
//                }
//            }
//        } catch (e: Exception) {
//            println("❌ Error parsing message: ${e.message}")
//        }
//    }
//
//    private fun handleApkUpdate(json: JSONObject) {
//        try {
//            val apkUrl = json.getString("apkUrl")
//            val filename = json.getString("filename")
//            val namePackage = json.getString("namePackage")
//
//            println("📦 Starting APK update: $filename from $apkUrl")
//
//            val updateManager = ApkUpdateManager(context) { success ->
//                sendApkUpdateResult(success)
//            }
//
//            updateManager.downloadAndInstall(apkUrl, filename, namePackage)
//
//        } catch (e: Exception) {
//            println("❌ Error handling APK update: ${e.message}")
//            sendApkUpdateResult(false)
//        }
//    }
//
//    private fun sendApkUpdateResult(success: Boolean) {
//        try {
//            val deviceCode = lastDeviceCode ?: "unknown"
//            val result = JSONObject().apply {
//                put("type", "apk:update:result")
//                put("serial", deviceCode)
//                put("status", if (success) "success" else "failure")
//            }
//
//            if (::webSocket.isInitialized && isConnected) {
//                webSocket.send(result.toString())
//                println("📦 APK update result sent: ${if (success) "success" else "failure"}")
//            } else {
//                println("❌ Cannot send APK result - WebSocket not connected")
//            }
//        } catch (e: Exception) {
//            println("❌ Error sending APK update result: ${e.message}")
//        }
//    }
//}