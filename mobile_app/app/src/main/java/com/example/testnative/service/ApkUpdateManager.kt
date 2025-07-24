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
        Log.d("ApkUpdateMgr", "⬇️ Starting download for: $filename")
        Log.d("ApkUpdateMgr", "🔗 APK URL: $apkUrl")
        Log.d("ApkUpdateMgr", "📦 Target package: $namePackage")
        Log.d("ApkUpdateMgr", "🤖 Controller app package: ${context.packageName}")

        // Giới hạn cài đặt cho 1 số package cụ thể
        val allowedTargets = listOf("com.atin.arcface", "com.sunworld.terminal")

        if (namePackage !in allowedTargets) {
            Log.w("ApkUpdateMgr", "⚠️ Warning: installing unlisted package $namePackage")

        }

        // Đăng ký receiver để lắng nghe khi download hoàn tất
        val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)

        try {
             context.applicationContext.registerReceiver(
                downloadReceiver,
                filter
            )
            Log.d("ApkUpdateMgr", "✅ Registered download complete receiver")
        } catch (e: Exception) {
            Log.e("ApkUpdateMgr", "❌ Failed to register receiver", e)
            onResult(false)
            return
        }

        // Tạo yêu cầu download file APK
        val request = DownloadManager.Request(Uri.parse(apkUrl)).apply {
            setTitle("Updating $namePackage")
            setDescription("Downloading APK update...")
            setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)
            setAllowedOverMetered(true)
            setAllowedOverRoaming(true)
        }

        downloadId = downloadManager.enqueue(request)
        apkFile = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), filename)

        Log.d("ApkUpdateMgr", "📥 Enqueued download with ID: $downloadId")
    }




    private fun handleDownloadComplete() {
        Log.d("ApkUpdateMgr", "📥 Download completed. Verifying...")

        val query = DownloadManager.Query().setFilterById(downloadId)
        val cursor: Cursor = downloadManager.query(query)

        if (cursor.moveToFirst()) {
            val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))

            when (status) {
                DownloadManager.STATUS_SUCCESSFUL -> {
                    Log.d("ApkUpdateMgr", "✅ Download successful, starting installApk()")
                    cursor.close()
                    installApk()
                }
                DownloadManager.STATUS_FAILED -> {
                    Log.e("ApkUpdateMgr", "❌ Download failed")
                    cursor.close()
                    cleanup()
                    onResult(false)
                }
            }
        } else {
            Log.e("ApkUpdateMgr", "❌ No cursor found for download ID")
            cursor.close()
            cleanup()
            onResult(false)
        }
    }


    private fun installApk() {
        Log.d("ApkUpdateMgr", "📦 installApk() called")
        apkFile?.let { file ->
            if (file.exists()) {
                Log.d("ApkUpdateMgr", "📁 APK file exists at: ${file.absolutePath}")
                if (isDeviceRooted()) {
                    Log.d("ApkUpdateMgr", "✅ Device is rooted, installing via root")
                    installViaRoot(file)
                } else {
                    Log.d("ApkUpdateMgr", "⚠️ Not rooted, using install via intent")
                    installViaIntent(file)
                }
            } else {
                Log.e("ApkUpdateMgr", "❌ APK file does not exist: ${file.absolutePath}")
                cleanup()
                onResult(false)
            }
        } ?: run {
            Log.e("ApkUpdateMgr", "❌ apkFile is null")
            cleanup()
            onResult(false)
        }
    }


    private fun isDeviceRooted(): Boolean {
        return try {
            val process = Runtime.getRuntime().exec(arrayOf("su", "-c", "echo rooted_check"))
            val output = process.inputStream.bufferedReader().readText()
            val exitCode = process.waitFor()
            Log.d("ApkUpdateMgr", "🔍 su test output: $output, exitCode=$exitCode")
            exitCode == 0
        } catch (e: Exception) {
            Log.e("ApkUpdateMgr", "❌ su test failed", e)
            false
        }
    }


    private fun installViaRoot(file: File) {
        val tmpPath = "/data/local/tmp/${file.name}"
        val copyCmd = "cp ${file.absolutePath} $tmpPath && chmod 644 $tmpPath"
        val installCmd = "pm install -r $tmpPath"
        val fullCmd = "$copyCmd && $installCmd"

        Log.d("ApkUpdateMgr", "Running root install via: su -c \"$fullCmd\"")

        try {
            val process = Runtime.getRuntime().exec(arrayOf("su", "-c", fullCmd))

            val stdout = process.inputStream.bufferedReader().readText()
            val stderr = process.errorStream.bufferedReader().readText()
            val exitCode = process.waitFor()

            Log.d("ApkUpdateMgr", "STDOUT:\n$stdout")
            Log.e("ApkUpdateMgr", "⚠STDERR:\n$stderr")
            Log.d("ApkUpdateMgr", "Exit code: $exitCode")

            cleanup()
            onResult(exitCode == 0)
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
                "${context.packageName}.provider", // phải đúng authority trong AndroidManifest
                file
            )

            Log.d("ApkUpdateMgr", "📦 Installing via intent using URI: $uri")

            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_GRANT_READ_URI_PERMISSION
            }

            context.startActivity(intent)


            onResult(true)
        } catch (e: Exception) {
            Log.e("ApkUpdateMgr", "❌ installViaIntent failed", e)
            onResult(false)
        }
    }


    private fun cleanup() {
        try {
            context.unregisterReceiver(downloadReceiver)
        } catch (e: Exception) {

        }

        apkFile?.let { file ->
            if (file.exists()) {
                file.delete()
            }
        }
    }
}