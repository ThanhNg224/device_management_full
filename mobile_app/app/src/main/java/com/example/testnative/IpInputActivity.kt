package com.example.testnative

import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class IpInputActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color.Transparent
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                brush = Brush.linearGradient(
                                    colors = listOf(
                                        Color(0xFF3B82F6),
                                        Color(0xFF8B5CF6)
                                    )
                                )
                            )
                    ) {
                        IpInputScreen { ip ->
                            // Save IP to SharedPreferences
                            val sharedPreferences = getSharedPreferences("AppPrefs", Context.MODE_PRIVATE)
                            sharedPreferences.edit().putString("server_ip", ip).apply()
                            // Start MainActivity
                            val intent = Intent(this@IpInputActivity, MainActivity::class.java)
                            startActivity(intent)
                            finish()
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun IpInputScreen(onConfirm: (String) -> Unit) {
    val ipState = remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Enter Server IP",
            style = MaterialTheme.typography.headlineMedium.copy(
                fontWeight = FontWeight.Bold,
                fontSize = 28.sp,
                color = Color.White
            ),
            modifier = Modifier.padding(bottom = 16.dp)
        )

        OutlinedTextField(
            value = ipState.value,
            onValueChange = { ipState.value = it },
            label = { Text("IP Address") },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            singleLine = true
        )

        Button(
            onClick = {
                if (ipState.value.isNotBlank()) {
                    onConfirm(ipState.value)
                }
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Confirm")
        }
    }
}