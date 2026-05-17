import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'error_interceptor.dart';
import 'play_integrity_interceptor.dart';

/// Configuration baked at build time via `--dart-define`.
class ApiConfig {
  /// Deployed Next.js host, e.g. `https://atmos.yourdomain.com`.
  static const String baseUrl = String.fromEnvironment(
    'ATMOS_API_BASE',
    defaultValue: 'https://atmos.example.com',
  );

  /// Google Cloud project NUMBER (not the project ID string) for the
  /// project linked to the Play Console app. Not secret — used by the
  /// Play Integrity SDK to bind the attestation token to your project.
  /// Set via `--dart-define=GOOGLE_CLOUD_PROJECT_NUMBER=1234567890`.
  static const int cloudProjectNumber = int.fromEnvironment(
    'GOOGLE_CLOUD_PROJECT_NUMBER',
    defaultValue: 0,
  );
}

/// Shared dio instance. Every outbound `/api/*` call carries an
/// `X-Play-Integrity-Token` header (set by [PlayIntegrityInterceptor])
/// which the server verifies with Google's Play Integrity API.
Dio createDio() {
  final Dio dio = Dio(BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: const Duration(seconds: 12),
    receiveTimeout: const Duration(seconds: 30),
    headers: <String, dynamic>{
      'Accept': 'application/json',
      'User-Agent': 'Atmos-Android/1.0',
    },
    responseType: ResponseType.json,
  ));

  dio.interceptors.add(PlayIntegrityInterceptor(
    cloudProjectNumber: ApiConfig.cloudProjectNumber,
  ));
  dio.interceptors.add(FriendlyErrorInterceptor());

  if (kDebugMode) {
    dio.interceptors.add(LogInterceptor(
      requestBody: false,
      responseBody: false,
      logPrint: (Object obj) => debugPrint(obj.toString()),
    ));
  }

  return dio;
}
