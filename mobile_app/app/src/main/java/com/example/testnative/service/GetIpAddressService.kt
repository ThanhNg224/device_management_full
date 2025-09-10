package com.example.testnative.service

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import androidx.annotation.RequiresPermission
import java.net.Inet4Address
import java.net.NetworkInterface

class GetIpAddressService(private val context: Context) {

    @SuppressLint("DefaultLocale")
    @RequiresPermission(Manifest.permission.ACCESS_NETWORK_STATE)
    fun getIpAddress(): String {
        return try {
            val connectivityManager =
                context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            val network = connectivityManager.activeNetwork ?: return "0.0.0.0"
            val caps = connectivityManager.getNetworkCapabilities(network)

            return when {
                caps?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> {
                    // Lấy IP khi đang dùng WiFi
                    val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
                    val ipInt = wifiManager.connectionInfo.ipAddress
                    String.format(
                        "%d.%d.%d.%d",
                        ipInt and 0xff,
                        ipInt shr 8 and 0xff,
                        ipInt shr 16 and 0xff,
                        ipInt shr 24 and 0xff
                    )
                }
                else -> {
                    // Lấy IP khi đang dùng Mobile Data
                    val interfaces = NetworkInterface.getNetworkInterfaces()
                    for (intf in interfaces) {
                        val addrs = intf.inetAddresses
                        for (addr in addrs) {
                            if (!addr.isLoopbackAddress && addr is Inet4Address) {
                                return addr.hostAddress ?: "0.0.0.0"
                            }
                        }
                    }
                    "0.0.0.0"
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            "0.0.0.0"
        }
    }
}
