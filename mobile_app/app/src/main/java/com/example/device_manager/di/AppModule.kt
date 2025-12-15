package com.example.device_manager.di

import android.content.Context
import android.content.SharedPreferences
import com.example.device_manager.core.config.AppDefaults
import com.example.device_manager.core.dispatchers.DefaultDispatcherProvider
import com.example.device_manager.core.dispatchers.DispatcherProvider
import com.example.device_manager.feature.heartbeat.data.datasources.local.AndroidDeviceMetricsDataSource
import com.example.device_manager.feature.heartbeat.data.datasources.local.RootCommandDataSource
import com.example.device_manager.feature.heartbeat.data.datasources.local.ServerSettingsDataSource
import com.example.device_manager.feature.heartbeat.data.datasources.local.SharedPrefsServerSettingsDataSource
import com.example.device_manager.feature.heartbeat.data.datasources.remote.HeartbeatRemoteDataSource
import com.example.device_manager.feature.heartbeat.data.datasources.remote.OkHttpHeartbeatRemoteDataSource
import com.example.device_manager.feature.heartbeat.data.repositories.ApkUpdateRepositoryImpl
import com.example.device_manager.feature.heartbeat.data.repositories.DeviceControlRepositoryImpl
import com.example.device_manager.feature.heartbeat.data.repositories.DeviceMetricsRepositoryImpl
import com.example.device_manager.feature.heartbeat.data.repositories.HeartbeatRepositoryImpl
import com.example.device_manager.feature.heartbeat.data.repositories.ServerSettingsRepositoryImpl
import com.example.device_manager.feature.heartbeat.domain.repositories.ApkUpdateRepository
import com.example.device_manager.feature.heartbeat.domain.repositories.DeviceControlRepository
import com.example.device_manager.feature.heartbeat.domain.repositories.DeviceMetricsRepository
import com.example.device_manager.feature.heartbeat.domain.repositories.HeartbeatRepository
import com.example.device_manager.feature.heartbeat.domain.repositories.ServerSettingsRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class AppBindingsModule {
    @Binds
    abstract fun bindDispatcherProvider(impl: DefaultDispatcherProvider): DispatcherProvider

    @Binds
    abstract fun bindServerSettingsDataSource(impl: SharedPrefsServerSettingsDataSource): ServerSettingsDataSource

    @Binds
    abstract fun bindHeartbeatRemoteDataSource(impl: OkHttpHeartbeatRemoteDataSource): HeartbeatRemoteDataSource

    @Binds
    abstract fun bindDeviceMetricsRepository(impl: DeviceMetricsRepositoryImpl): DeviceMetricsRepository

    @Binds
    abstract fun bindServerSettingsRepository(impl: ServerSettingsRepositoryImpl): ServerSettingsRepository

    @Binds
    abstract fun bindHeartbeatRepository(impl: HeartbeatRepositoryImpl): HeartbeatRepository

    @Binds
    abstract fun bindDeviceControlRepository(impl: DeviceControlRepositoryImpl): DeviceControlRepository

    @Binds
    abstract fun bindApkUpdateRepository(impl: ApkUpdateRepositoryImpl): ApkUpdateRepository
}

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideSharedPreferences(
        @ApplicationContext context: Context,
    ): SharedPreferences = context.getSharedPreferences(AppDefaults.PREFS_NAME, Context.MODE_PRIVATE)

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient =
        OkHttpClient.Builder()
            .pingInterval(3, TimeUnit.SECONDS)
            .build()

    @Provides
    @Singleton
    fun provideAndroidDeviceMetricsDataSource(
        @ApplicationContext context: Context,
        dispatchers: DispatcherProvider,
    ): AndroidDeviceMetricsDataSource = AndroidDeviceMetricsDataSource(context, dispatchers)

    @Provides
    @Singleton
    fun provideRootCommandDataSource(): RootCommandDataSource = RootCommandDataSource()
}
