package com.example.testnative.service

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.annotation.RequiresPermission
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject
import org.json.JSONException
import java.io.IOException
import java.net.SocketTimeoutException
import java.util.concurrent.TimeUnit
import com.example.testnative.service.ApkUpdateManager
class WebSocketClient(private val context: Context) {
    private lateinit var webSocket: WebSocket
    private val client = OkHttpClient()
    private var isConnected = false
    private var isReconnecting = false
    private val reconnectHandler = Handler(Looper.getMainLooper())

    private var lastDeviceCode: String? = null
    private var lastVersion: String = "1.0.0"
    private var lastLocation: String? = null

    private val reconnectRunnable = object : Runnable {
        override fun run() {
            if (!isConnected && !isReconnecting) {
                println("🔄 Attempting to reconnect...")
                lastDeviceCode?.let {
                    connectServer(it, lastVersion, lastLocation)
                }
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
        isReconnecting = true
        reconnectHandler.removeCallbacks(reconnectRunnable)

        val request = Request.Builder().url("ws://192.168.1.157:3000").build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                println("✅ Connected to server")
                isConnected = true
                isReconnecting = false
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                println("❌ Connection failed: ${t.message}")
                handleDisconnection()
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                println("⚠️ Connection closed: $code / $reason")
                handleDisconnection()
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                println("⚠️ Closing connection: $code / $reason")
                webSocket.close(1000, null)
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                handleMessage(text)
                val TAG = "WebSocketClient"
                Log.d(TAG, "📩 Message received: $text")
                try {
                    val json = JSONObject(text)
                    val type = json.optString("type")
                    when (type) {
                        "apk:update" -> {
                            val apkUrl = json.optString("apkUrl")
                            val filename = json.optString("filename")
                            val namePackage = json.optString("namePackage")
                            Log.i(TAG, "🚀 Update APK received:")
                            Log.i(TAG, "📦 Package Name: $namePackage")
                            Log.i(TAG, "📁 Filename: $filename")
                            Log.i(TAG, "🔗 URL: $apkUrl")
                        }
                        else -> {
                            println("⚠️ Unknown message type: $type")
                        }
                    }
                } catch (e: JSONException) {
                    println("❌ Failed to parse JSON: ${e.message}")
                }
            }

        })
    }

    private fun handleDisconnection() {
        isConnected = false
        isReconnecting = false
        // Schedule reconnection attempt after 5 seconds
        reconnectHandler.postDelayed(reconnectRunnable, 5000)
    }

    fun sendHeartbeat(
        config: JSONObject,
        performance: JSONObject,
        version: String,
    ) {
        if (!isConnected || !::webSocket.isInitialized) {
            println("⚠️ Cannot send heartbeat - not connected")
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
            println("📤 Sent heartbeat")
        } catch (e: Exception) {
            println("⚠️ Send failed: ${e.message}")
            handleDisconnection()
        }
    }

    fun close() {
        reconnectHandler.removeCallbacks(reconnectRunnable)
        if (::webSocket.isInitialized) {
            webSocket.close(1000, "Manual close")
        }
        isConnected = false
        isReconnecting = false
    }

    private fun handleMessage(message: String) {
        try {
            val json = JSONObject(message)
            val type = json.optString("type", "")

            when (type) {
                "apk:update" -> {
                    // Switch to main thread for context operations
                    Handler(Looper.getMainLooper()).post {
                        handleApkUpdate(json)
                    }
                }
            }
        } catch (e: Exception) {
            println("❌ Error parsing message: ${e.message}")
        }
    }

    private fun handleApkUpdate(json: JSONObject) {
        try {
            val apkUrl = json.getString("apkUrl")
            val filename = json.getString("filename")
            val namePackage = json.getString("namePackage")

            println("📦 Starting APK update: $filename from $apkUrl")

            val updateManager = ApkUpdateManager(context) { success ->
                sendApkUpdateResult(success)
            }

            updateManager.downloadAndInstall(apkUrl, filename, namePackage)

        } catch (e: Exception) {
            println("❌ Error handling APK update: ${e.message}")
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
                println("📦 APK update result sent: ${if (success) "success" else "failure"}")
            } else {
                println("❌ Cannot send APK result - WebSocket not connected")
            }
        } catch (e: Exception) {
            println("❌ Error sending APK update result: ${e.message}")
        }
    }


}

//class WebSocketClient(private val context: Context) {
//    private lateinit var webSocket: WebSocket
//    private val client = OkHttpClient.Builder()
//        .pingInterval(2, TimeUnit.SECONDS)
//        .writeTimeout(0, TimeUnit.SECONDS)
//        .readTimeout(0, TimeUnit.SECONDS)
//        .connectTimeout(15, TimeUnit.SECONDS)
//        .retryOnConnectionFailure(true)
//        .build()
//
//    private var lastPongTime: Long = 0
//    private val PONG_TIMEOUT = 15_000L
//    private val PING_INTERVAL = 10_000L
//
//    internal var isConnected = false
//    private var isReconnecting = false
//    private val reconnectHandler = Handler(Looper.getMainLooper())
//    private val pingHandler = Handler(Looper.getMainLooper())
//
//    private var lastDeviceCode: String? = null
//    private var lastVersion: String = "1.0.0"
//    private var lastLocation: String? = null
//
//    private val pongCheckRunnable = object : Runnable {
//        override fun run() {
//            if (isConnected && lastPongTime > 0 &&
//                System.currentTimeMillis() - lastPongTime > PONG_TIMEOUT) {
//                println("⚠️ Pong timeout, forcing reconnect")
//                handleDisconnection()
//            }
//            pingHandler.postDelayed(this, PONG_TIMEOUT)
//        }
//    }
//
//    private val pingRunnable = object : Runnable {
//        override fun run() {
//            if (isConnected && ::webSocket.isInitialized) {
//                try {
//                    val pingMessage = JSONObject().apply {
//                        put("type", "ping")
//                        put("timestamp", System.currentTimeMillis())
//                    }
//                    webSocket.send(pingMessage.toString())
//                    println("📤 [${System.currentTimeMillis()}] Sent ping")
//                } catch (e: Exception) {
//                    println("⚠️ Ping failed: ${e.message}")
//                    handleDisconnection()
//                }
//            }
//            pingHandler.postDelayed(this, PING_INTERVAL)
//        }
//    }
//
//    private val reconnectRunnable = object : Runnable {
//        @RequiresPermission(Manifest.permission.ACCESS_NETWORK_STATE)
//        override fun run() {
//            if (!isConnected && !isReconnecting && isNetworkAvailable()) {
//                println("🔄 [${System.currentTimeMillis()}] Attempting to reconnect...")
//                lastDeviceCode?.let {
//                    connectServer(it, lastVersion, lastLocation)
//                }
//            }
//        }
//    }
//
//    private val networkReceiver = object : BroadcastReceiver() {
//        @RequiresPermission(Manifest.permission.ACCESS_NETWORK_STATE)
//        override fun onReceive(context: Context, intent: Intent) {
//            if (isNetworkAvailable() && !isConnected && !isReconnecting) {
//                println("🌐 Network back, reconnecting...")
//                lastDeviceCode?.let {
//                    connectServer(it, lastVersion, lastLocation)
//                }
//            }
//        }
//    }
//
//    init {
//        context.registerReceiver(
//            networkReceiver,
//            IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION)
//        )
//    }
//
//    @RequiresPermission(Manifest.permission.ACCESS_NETWORK_STATE)
//    fun connectServer(
//        deviceCode: String,
//        version: String = "1.0.0",
//        location: String? = null
//    ) {
//        if (!isNetworkAvailable()) {
//            println("⚠️ No network, skipping connection")
//            return
//        }
//
//        lastDeviceCode = deviceCode
//        lastVersion = version
//        lastLocation = location
//        isReconnecting = true
//        reconnectHandler.removeCallbacks(reconnectRunnable)
//
//        val request = Request.Builder().url("ws://192.168.1.157:3000").build()
//        webSocket = client.newWebSocket(request, object : WebSocketListener() {
//            override fun onOpen(webSocket: WebSocket, response: Response) {
//                println("✅ Connected to WebSocket")
//                isConnected = true
//                isReconnecting = false
//                lastPongTime = System.currentTimeMillis()
//                pingHandler.post(pingRunnable)
//                pingHandler.post(pongCheckRunnable)
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
//                println("⚠️ Closing: $code / $reason")
//                webSocket.close(1000, null)
//            }
//
//            override fun onMessage(webSocket: WebSocket, text: String) {
//                if (text == "pong") {
//                    println("📩 Received pong")
//                    lastPongTime = System.currentTimeMillis()
//                } else {
//                    println("📩 Received message: $text")
//                }
//            }
//        })
//    }
//
//    private fun clearAllHandlers() {
//        pingHandler.removeCallbacks(pingRunnable)
//        pingHandler.removeCallbacks(pongCheckRunnable)
//        reconnectHandler.removeCallbacks(reconnectRunnable)
//    }
//
//    private fun handleDisconnection() {
//        if (isConnected || isReconnecting) {
//            println("🔌 Disconnected. Reconnecting in 3s...")
//            isConnected = false
//            isReconnecting = false
//            clearAllHandlers()
//            reconnectHandler.postDelayed(reconnectRunnable, 3000)
//        }
//    }
//
//    @RequiresPermission(Manifest.permission.ACCESS_NETWORK_STATE)
//    private fun isNetworkAvailable(): Boolean {
//        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
//        val networkInfo = cm.activeNetworkInfo
//        return networkInfo != null && networkInfo.isConnected
//    }
//
//    fun sendHeartbeat(
//        config: JSONObject,
//        performance: JSONObject,
//        version: String
//    ) {
//        if (!isConnected || !::webSocket.isInitialized) {
//            println("⚠️ Cannot send heartbeat – not connected")
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
//            val success = webSocket.send(message.toString())
//            if (!success) {
//                println("⚠️ Heartbeat send failed")
//                handleDisconnection()
//            } else {
//                println("📤 Sent heartbeat")
//            }
//        } catch (e: Exception) {
//            println("⚠️ Heartbeat error: ${e.message}")
//            handleDisconnection()
//        }
//    }
//
//    fun close() {
//        context.unregisterReceiver(networkReceiver)
//        reconnectHandler.removeCallbacks(reconnectRunnable)
//        pingHandler.removeCallbacks(pingRunnable)
//        if (::webSocket.isInitialized) {
//            webSocket.close(1000, "Manual close")
//        }
//        isConnected = false
//        isReconnecting = false
//    }
//}
