package com.example.device_manager.feature.deviceinfo.presentation.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.device_manager.feature.deviceinfo.presentation.model.DeviceInfoUiState

@Composable
fun DeviceInfoScreen(
    uiState: DeviceInfoUiState,
    onChangeIpClicked: () -> Unit,
    onReboot: () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color.Transparent,
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.linearGradient(
                        colors = listOf(
                            Color(0xFF3B82F6),
                            Color(0xFF8B5CF6),
                        ),
                    ),
                ),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    text = "Bảng điều khiển thiết bị",
                    style = MaterialTheme.typography.headlineMedium.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 28.sp,
                        color = Color.White,
                    ),
                    modifier = Modifier.padding(bottom = 16.dp),
                )

                Button(
                    onClick = onChangeIpClicked,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                ) {
                    Text("Đổi IP Server")
                }

                Button(
                    onClick = onReboot,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                ) {
                    Text("Khởi động lại")
                }

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp)),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.9f)),
                    elevation = CardDefaults.cardElevation(8.dp),
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Text(
                            text = "Thông tin thiết bị",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.SemiBold,
                                color = Color.Black,
                            ),
                        )
                        Text(
                            text = "Số serial: ${uiState.serial}",
                            style = MaterialTheme.typography.bodyLarge.copy(color = Color.DarkGray),
                        )
                        Text(
                            text = "Phiên bản ứng dụng: ${uiState.version}",
                            style = MaterialTheme.typography.bodyLarge.copy(color = Color.DarkGray),
                        )
                    }
                }

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp)),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.9f)),
                    elevation = CardDefaults.cardElevation(8.dp),
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Text(
                            text = "Hiệu suất phần cứng",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.SemiBold,
                                color = Color.Black,
                            ),
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = "CPU: ${(uiState.cpuUsage * 100).toInt()}%",
                                style = MaterialTheme.typography.bodyLarge.copy(color = Color.DarkGray),
                            )
                            LinearProgressIndicator(
                                progress = { uiState.cpuUsage },
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(start = 8.dp),
                                color = Color(0xFFEF4444),
                                trackColor = Color.Gray.copy(alpha = 0.3f),
                            )
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = "RAM: ${(uiState.ramUsage * 100).toInt()}%",
                                style = MaterialTheme.typography.bodyLarge.copy(color = Color.DarkGray),
                            )
                            LinearProgressIndicator(
                                progress = { uiState.ramUsage },
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(start = 8.dp),
                                color = Color(0xFF3B82F6),
                                trackColor = Color.Gray.copy(alpha = 0.3f),
                            )
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = "ROM: ${uiState.romUsage} GB",
                                style = MaterialTheme.typography.bodyLarge.copy(color = Color.DarkGray),
                            )
                            LinearProgressIndicator(
                                progress = { 0f },
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(start = 8.dp),
                                color = Color(0xFF10B981),
                                trackColor = Color.Gray.copy(alpha = 0.3f),
                            )
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = "Nhiệt độ: ${uiState.temperatureCelsius}°C",
                                style = MaterialTheme.typography.bodyLarge.copy(color = Color.DarkGray),
                            )
                            LinearProgressIndicator(
                                progress = { uiState.temperatureCelsius / 100f },
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(start = 8.dp),
                                color = Color(0xFFF59E0B),
                                trackColor = Color.Gray.copy(alpha = 0.3f),
                            )
                        }
                    }
                }

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp)),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.9f)),
                    elevation = CardDefaults.cardElevation(8.dp),
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Text(
                            text = "Cài đặt hệ thống",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.SemiBold,
                                color = Color.Black,
                            ),
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = "Âm lượng: ${uiState.volumePercent}%",
                                style = MaterialTheme.typography.bodyLarge.copy(color = Color.DarkGray),
                            )
                            LinearProgressIndicator(
                                progress = { uiState.volumePercent / 100f },
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(start = 8.dp),
                                color = Color(0xFF10B981),
                                trackColor = Color.Gray.copy(alpha = 0.3f),
                            )
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                text = "Độ sáng: ${uiState.brightnessPercent}%",
                                style = MaterialTheme.typography.bodyLarge.copy(color = Color.DarkGray),
                            )
                            LinearProgressIndicator(
                                progress = { uiState.brightnessPercent / 100f },
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(start = 8.dp),
                                color = Color(0xFFFBBF24),
                                trackColor = Color.Gray.copy(alpha = 0.3f),
                            )
                        }
                    }
                }
            }
        }
    }
}
