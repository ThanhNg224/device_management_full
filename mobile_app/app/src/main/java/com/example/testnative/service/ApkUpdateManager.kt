package com.example.testnative.service

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.database.Cursor
import android.net.Uri


import android.os.Environment
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import java.io.File


class ApkUpdateManager(
    private val context: Context,
    private val onResult: (Boolean) -> Unit
) {
    private val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    private var downloadId: Long = -1
    private var apkFile: File? = null

    private val downloadReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
            if (id == downloadId) {
                handleDownloadComplete()
            }
        }
    }

    fun downloadAndInstall(apkUrl: String, filename: String, namePackage: String) {
        // 1. Chuẩn bị IntentFilter
        val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)

        // 2. Đăng ký receiver luôn với flag not exported
        ContextCompat.registerReceiver(
            context,
            downloadReceiver,
            filter,
            ContextCompat.RECEIVER_NOT_EXPORTED  // <-- phải là ContextCompat.RECEIVER_NOT_EXPORTED
        )

        // 3. Tạo và enqueue download request
        val request = DownloadManager.Request(Uri.parse(apkUrl)).apply {
            setTitle("Updating $namePackage")
            setDescription("Downloading APK update...")
            setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)
            setAllowedOverMetered(true)
            setAllowedOverRoaming(true)
        }

        downloadId = downloadManager.enqueue(request)
        apkFile = File(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
            filename
        )
    }


    private fun handleDownloadComplete() {
        val query = DownloadManager.Query().setFilterById(downloadId)
        val cursor: Cursor = downloadManager.query(query)

        if (cursor.moveToFirst()) {
            val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))

            when (status) {
                DownloadManager.STATUS_SUCCESSFUL -> {
                    cursor.close()
                    installApk()
                }
                DownloadManager.STATUS_FAILED -> {
                    cursor.close()
                    cleanup()
                    onResult(false)
                }
            }
        } else {
            cursor.close()
            cleanup()
            onResult(false)
        }
    }

    private fun installApk() {
        apkFile?.let { file ->
            if (file.exists()) {
                if (isDeviceRooted()) {
                    installViaRoot(file)
                } else {
                    installViaIntent(file)
                }
            } else {
                cleanup()
                onResult(false)
            }
        } ?: run {
            cleanup()
            onResult(false)
        }
    }

    private fun isDeviceRooted(): Boolean {
        return try {
            val process = Runtime.getRuntime().exec("su -c 'echo test'")
            val exitCode = process.waitFor()
            exitCode == 0
        } catch (e: Exception) {
            false
        }
    }

    private fun installViaRoot(file: File) {
        val cmd = "pm install -r ${file.absolutePath}"
        Log.d("ApkUpdateMgr", "🔧 Running: su -c \"$cmd\"")
        try {
            val proc = Runtime.getRuntime().exec(arrayOf("su", "-c", cmd))
            val exit = proc.waitFor()
            Log.d("ApkUpdateMgr", "🔧 Install exit code = $exit")
            cleanup()
            onResult(exit == 0)
        } catch (e: Exception) {
            Log.e("ApkUpdateMgr", "❌ installViaRoot failed", e)
            cleanup()
            onResult(false)
        }
    }


    private fun installViaIntent(file: File) {
        try {
            val uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.provider",
                file
            )

            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
            }

            context.startActivity(intent)

            // For non-root installation, we assume success since user interaction is required
            cleanup()
            onResult(true)
        } catch (e: Exception) {
            cleanup()
            onResult(false)
        }
    }

    private fun cleanup() {
        try {
            context.unregisterReceiver(downloadReceiver)
        } catch (e: Exception) {
            // Receiver might not be registered
        }

        apkFile?.let { file ->
            if (file.exists()) {
                file.delete()
            }
        }
    }
}