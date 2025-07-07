package com.example.testnative

import android.content.Context
import fi.iki.elonen.NanoHTTPD
import java.io.File

class SimpleWebServer(
    private val context: Context,
    port: Int = 8080
) : NanoHTTPD(port) {

    override fun serve(session: IHTTPSession): Response {
        return try {
            val uri = session.uri
            val method = session.method

            if (method == Method.POST && uri == "/upload-audio") {
                return handleUpload(session)
            }

            val filePath = if (uri == "/") "www/index.html" else "www$uri"
            val input = context.assets.open(filePath)
            val mime = getMimeType(filePath)
            newChunkedResponse(Response.Status.OK, mime, input)
        } catch (e: Exception) {
            newFixedLengthResponse(Response.Status.NOT_FOUND, MIME_PLAINTEXT, "404 Not Found: ${e.message}")
        }
    }

    private fun handleUpload(session: IHTTPSession): Response {
        return try {
            val files = HashMap<String, String>()
            session.parseBody(files)

            val fieldName = session.parameters.keys.firstOrNull() ?: "audio"
            val uploadedTmpPath = files[fieldName]
                ?: return newFixedLengthResponse(Response.Status.BAD_REQUEST, MIME_PLAINTEXT, "No file found")

            val targetFile = File(context.filesDir, "$fieldName.mp3")
            File(uploadedTmpPath).copyTo(targetFile, overwrite = true)

            newFixedLengthResponse("Upload OK: ${targetFile.name}")
        } catch (e: Exception) {
            newFixedLengthResponse(Response.Status.INTERNAL_ERROR, MIME_PLAINTEXT, "Upload failed: ${e.message}")
        }
    }

    private fun getMimeType(path: String): String {
        return when {
            path.endsWith(".html") -> "text/html"
            path.endsWith(".css") -> "text/css"
            path.endsWith(".js") -> "application/javascript"
            path.endsWith(".mp3") -> "audio/mpeg"
            else -> "text/plain"
        }
    }
}
