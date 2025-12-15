package com.example.device_manager.feature.heartbeat.domain.usecases

import com.example.device_manager.feature.heartbeat.domain.entities.RemoteCommand
import org.json.JSONObject
import javax.inject.Inject

class ParseRemoteCommandUseCase @Inject constructor() {
    operator fun invoke(rawMessage: String): RemoteCommand? {
        val json = runCatching { JSONObject(rawMessage) }.getOrNull() ?: return null

        if (json.optString("action") == "reboot") return RemoteCommand.Reboot

        return when (json.optString("type")) {
            "apk:update" -> RemoteCommand.ApkUpdate(
                apkUrl = json.optString("apkUrl"),
                filename = json.optString("filename"),
                namePackage = json.optString("namePackage"),
            )
            else -> null
        }
    }
}

