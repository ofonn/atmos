import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

/// Configuration baked at build time via `--dart-define`.
class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'ATMOS_API_BASE',
    defaultValue: 'https://atmos.example.com',
  );

  static const String clientKey = String.fromEnvironment(
    'ATMOS_CLIENT_KEY',
    defaultValue: '',
  );
}

/// Shared dio instance. Sends `X-Atmos-Client` on every request so the
/// Next.js middleware lets the mobile app through.
Dio createDio() {
  final Dio dio = Dio(BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: const Duration(seconds: 12),
    receiveTimeout: const Duration(seconds: 30),
    headers: <String, dynamic>{
      'X-Atmos-Client': ApiConfig.clientKey,
      'Accept': 'application/json',
      'User-Agent': 'Atmos-Android/1.0',
    },
    responseType: ResponseType.json,
  ));

  if (kDebugMode) {
    dio.interceptors.add(LogInterceptor(
      requestBody: false,
      responseBody: false,
      logPrint: (Object obj) => debugPrint(obj.toString()),
    ));
  }

  return dio;
}
