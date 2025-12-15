package com.example.device_manager.feature.heartbeat.data.datasources.local

import java.io.DataOutputStream

class RootCommandDataSource(
) {
    fun rebootWithRoot(): Boolean {
        return try {
            val process = Runtime.getRuntime().exec("su")
            val os = DataOutputStream(process.outputStream)
            os.writeBytes("reboot\n")
            os.flush()
            os.close()
            process.waitFor()
            process.exitValue() == 0
        } catch (_: Exception) {
            false
        }
    }
}
