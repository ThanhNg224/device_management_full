package com.example.device_manager.feature.heartbeat.data.datasources.local

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.database.Cursor
import android.os.Environment
import android.util.Log
import androidx.core.content.FileProvider
import androidx.core.net.toUri
import java.io.File


class ApkUpdateManager(
    private val context: Context,
    private val onResult: (Boolean) -> Unit
) {
    @Volatile private var currentTargetPackage: String? = null
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
        Log.d("ApkUpdateMgr", "📦 Target package (hint from BE): $namePackage")
        Log.d("ApkUpdateMgr", "🤖 Controller app package: ${context.packageName}")

        // (Giữ) whitelist cảnh báo
        val allowedTargets = listOf("com.atin.arcface", "com.sunworld.terminal")
        if (namePackage !in allowedTargets) {
            Log.w("ApkUpdateMgr", "⚠️ Warning: installing unlisted package $namePackage")
        }

        // Receiver anonymous để đảm bảo ta set currentTargetPackage đúng lúc tải xong
        val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context?, intent: Intent?) {
                val id = intent?.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L) ?: -1L
                if (id != downloadId) return

                try {
                    // Query trạng thái tải
                    val query = DownloadManager.Query().setFilterById(downloadId)
                    val cursor = downloadManager.query(query)
                    cursor.use { c ->
                        if (c != null && c.moveToFirst()) {
                            val status = c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
                            if (status == DownloadManager.STATUS_SUCCESSFUL) {
                                Log.d("ApkUpdateMgr", "📥 Download completed. Verifying...")

                                // File đích (đường dẫn public mà bạn đã set)
                                apkFile = File(
                                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                                    filename
                                )

                                if (apkFile?.exists() == true) {
                                    Log.d("ApkUpdateMgr", "✅ Download successful, starting installApk()")
                                    Log.d("ApkUpdateMgr", "📦 installApk() called")
                                    Log.d("ApkUpdateMgr", "📁 APK file exists at: ${apkFile!!.absolutePath}")

                                    // >>> Quan trọng: resolve packageName thực từ file APK
                                    val realPkg = getApkPackageName(context, apkFile!!)
                                    currentTargetPackage = realPkg ?: namePackage
                                    Log.d(
                                        "ApkUpdateMgr",
                                        "📦 Resolved package from APK: ${realPkg ?: "N/A"} (backend hint: $namePackage)"
                                    )

                                    // Gọi flow cài hiện có của bạn (giữ nguyên hàm sẵn có)
                                    installApk()  // nếu bạn gọi trực tiếp installViaRoot(apkFile!!) cũng được
                                } else {
                                    Log.e("ApkUpdateMgr", "❌ APK file not found after download")
                                    onResult(false)
                                }
                            } else {
                                Log.e("ApkUpdateMgr", "❌ Download failed with status=$status")
                                onResult(false)
                            }
                        } else {
                            Log.e("ApkUpdateMgr", "❌ Download query returned no rows")
                            onResult(false)
                        }
                    }
                } catch (e: Exception) {
                    Log.e("ApkUpdateMgr", "❌ Error handling download completion", e)
                    onResult(false)
                } finally {
                    // Luôn hủy đăng ký để tránh leak
                    try { context.applicationContext.unregisterReceiver(this) } catch (_: Exception) {}
                }
            }
        }

        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                context.applicationContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                @Suppress("UnspecifiedRegisterReceiverFlag")
                context.applicationContext.registerReceiver(receiver, filter)
            }
            Log.d("ApkUpdateMgr", "✅ Registered download complete receiver")
        } catch (e: Exception) {
            Log.e("ApkUpdateMgr", "❌ Failed to register receiver", e)
            onResult(false)
            return
        }

        // Tạo yêu cầu download file APK (giữ nguyên)
        val request = DownloadManager.Request(apkUrl.toUri()).apply {
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

    // helper: quote an toàn cho shell
    private fun shellQuote(path: String): String {
        return "'" + path.replace("'", "'\\''") + "'"
    }

    private fun runSu(cmd: String): Triple<Int, String, String> {
        val p = Runtime.getRuntime().exec(arrayOf("su", "-c", cmd))
        val stdout = p.inputStream.bufferedReader().readText()
        val stderr = p.errorStream.bufferedReader().readText()
        val code = p.waitFor()
        return Triple(code, stdout, stderr)
    }

    // installViaRoot(...)
    private fun installViaRoot(file: File) {
        val tmpPath = "/data/local/tmp/${file.name}"
        val src = shellQuote(file.absolutePath)
        val dst = shellQuote(tmpPath)

        // copy + chmod
        val prepCmd = "cp -f $src $dst && chmod 644 $dst"
        Log.d("ApkUpdateMgr", "Running root prep via: su -c $prepCmd")
        val (prepCode, prepOut, prepErr) = runSu(prepCmd)
        Log.d("ApkUpdateMgr", "STDOUT (prep):\n$prepOut")
        if (prepErr.isNotBlank()) Log.e("ApkUpdateMgr", "⚠STDERR (prep):\n$prepErr")
        if (prepCode != 0) {
            cleanupTmp(dst); cleanup(); onResult(false); return
        }

        // cài lần 1 (update thường)
        val installCmd = "pm install -r -g --user 0 $dst"
        var (code, out, err) = runSu(installCmd)
        Log.d("ApkUpdateMgr", "STDOUT:\n$out")
        if (err.isNotBlank()) Log.e("ApkUpdateMgr", "⚠STDERR:\n$err")
        Log.d("ApkUpdateMgr", "Exit code: $code")

        val normalized = (out + "\n" + err).lowercase()

        // case: downgrade
        if (code != 0 && normalized.contains("version_downgrade")) {
            Log.w("ApkUpdateMgr", "Detected VERSION_DOWNGRADE → retry with -d")
            val (code2, out2, err2) = runSu("pm install -r -d -g --user 0 $dst")
            Log.d("ApkUpdateMgr", "STDOUT (retry -d):\n$out2")
            if (err2.isNotBlank()) Log.e("ApkUpdateMgr", "⚠STDERR (retry -d):\n$err2")
            code = code2
        }

        // case: signature mismatch → uninstall rồi cài mới (mất data)
        if (code != 0 && normalized.contains("update_incompatible")) {
            val pkg = currentTargetPackage
            if (!pkg.isNullOrBlank()) {
                Log.w("ApkUpdateMgr", "Detected UPDATE_INCOMPATIBLE → uninstall $pkg then reinstall")
                val (_, uOut, uErr) = runSu("pm uninstall --user 0 ${shellQuote(pkg)}")
                Log.d("ApkUpdateMgr", "STDOUT (uninstall):\n$uOut")
                if (uErr.isNotBlank()) Log.e("ApkUpdateMgr", "⚠STDERR (uninstall):\n$uErr")
                val (code3, out3, err3) = runSu("pm install -g --user 0 $dst")
                Log.d("ApkUpdateMgr", "STDOUT (reinstall):\n$out3")
                if (err3.isNotBlank()) Log.e("ApkUpdateMgr", "⚠STDERR (reinstall):\n$err3")
                code = code3
            } else {
                Log.e("ApkUpdateMgr", "No package name available to uninstall.")
            }
        }

        cleanupTmp(dst)
        cleanup()
        onResult(code == 0)
    }

   // bản installViaRoot cũ (không tự detect downgrade/uninstall)
//    private fun installViaRoot(file: File) {
//        val tmpPath = "/data/local/tmp/${file.name}"
//        val src = shellQuote(file.absolutePath)
//        val dst = shellQuote(tmpPath)
//
//        // -f để ghi đè nếu đã tồn tại, và luôn luôn quote cả src lẫn dst
//        val copyCmd = "cp -f $src $dst && chmod 644 $dst"
//        // thêm -r (reinstall), có thể cân nhắc -d (cho phép downgrade) và -g (tự grant runtime perms)
//        val installCmd = "pm install -r $dst"
//        val fullCmd = "$copyCmd && $installCmd"
//
//        Log.d("ApkUpdateMgr", "Running root install via: su -c $fullCmd")
//
//        try {
//            val process = Runtime.getRuntime().exec(arrayOf("su", "-c", fullCmd))
//            val stdout = process.inputStream.bufferedReader().readText()
//            val stderr = process.errorStream.bufferedReader().readText()
//            val exitCode = process.waitFor()
//            Log.d("ApkUpdateMgr", "STDOUT:\n$stdout")
//            Log.e("ApkUpdateMgr", "⚠STDERR:\n$stderr")
//            Log.d("ApkUpdateMgr", "Exit code: $exitCode")
//
//            // dọn tmp sau cài (không bắt buộc, nhưng sạch)
//            try { Runtime.getRuntime().exec(arrayOf("su", "-c", "rm -f $dst")).waitFor() } catch (_: Exception) {}
//
//            cleanup()
//            onResult(exitCode == 0)
//        } catch (e: Exception) {
//            Log.e("ApkUpdateMgr", "❌ installViaRoot failed", e)
//            cleanup()
//            onResult(false)
//        }
//    }

    private fun cleanupTmp(dstQuoted: String) {
        try { runSu("rm -f $dstQuoted") } catch (_: Exception) {}
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
        } catch (_: Exception) {

        }

        apkFile?.let { file ->
            if (file.exists()) {
                file.delete()
            }
        }
    }

    private fun getApkPackageName(context: Context, apkFile: File): String? {
        val pm = context.packageManager
        return try {
            if (android.os.Build.VERSION.SDK_INT >= 33) {
                pm.getPackageArchiveInfo(apkFile.absolutePath,
                    android.content.pm.PackageManager.PackageInfoFlags.of(0))?.packageName
            } else {
                @Suppress("DEPRECATION")
                pm.getPackageArchiveInfo(apkFile.absolutePath, 0)?.packageName
            }
        } catch (_: Exception) { null }
    }

}
