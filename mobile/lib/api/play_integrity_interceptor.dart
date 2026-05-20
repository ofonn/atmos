import 'dart:convert';
import 'dart:math';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

// Stub for the abandoned `play_integrity_flutter` plugin (v0.0.1 is
// AGP 8+ incompatible — missing `namespace` in its build.gradle). When
// GOOGLE_CLOUD_PROJECT_NUMBER is 0 (the default), the interceptor short-
// circuits before touching this, so the stub is never invoked at runtime.
// When wiring real Play Integrity, swap this for a maintained package
// like `app_device_integrity` and update the call site.
class _PlayIntegrityStub {
  Future<String?> requestIntegrityToken({
    required int cloudProjectNumber,
    required String nonce,
  }) async {
    throw UnsupportedError(
      'Play Integrity stub: no real plugin wired. '
      'Set GOOGLE_CLOUD_PROJECT_NUMBER=0 to disable, or add a real plugin.',
    );
  }
}

/// Attaches a Play Integrity token to every outbound request so the
/// Next.js gate (`src/lib/playIntegrity.ts`) can verify with Google that
/// the APK is genuine, Play-distributed and running on an unmodified device.
///
/// The token is requested fresh per call (Classic API). Tokens last ~5 min,
/// so back-to-back requests within that window could share one — we keep
/// this simple and re-request. Atmos issues weather refreshes every 5 min
/// and chat is user-driven, so cost is negligible.
class PlayIntegrityInterceptor extends Interceptor {
  PlayIntegrityInterceptor({required this.cloudProjectNumber});

  /// Google Cloud project number for the project linked to the Play
  /// Console app. NOT secret — safe to bake into the APK. A value of 0
  /// disables integrity (requests will fail at the server gate with 401).
  final int cloudProjectNumber;

  final _integrity = _PlayIntegrityStub();
  final _random = Random.secure();

  String _nonce() {
    final bytes = List<int>.generate(24, (_) => _random.nextInt(256));
    return base64Url.encode(bytes).replaceAll('=', '');
  }

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (cloudProjectNumber == 0) {
      if (kDebugMode) {
        debugPrint('PlayIntegrity: GOOGLE_CLOUD_PROJECT_NUMBER not set — '
            'request will be rejected by the server.');
      }
      return handler.next(options);
    }
    try {
      final token = await _integrity.requestIntegrityToken(
        cloudProjectNumber: cloudProjectNumber,
        nonce: _nonce(),
      );
      if (token != null && token.isNotEmpty) {
        options.headers['X-Play-Integrity-Token'] = token;
      }
    } catch (e) {
      if (kDebugMode) debugPrint('PlayIntegrity token request failed: $e');
      // Let request proceed without token — server returns 401 with a
      // clear `reason` field so the UI can surface what went wrong.
    }
    handler.next(options);
  }
}
