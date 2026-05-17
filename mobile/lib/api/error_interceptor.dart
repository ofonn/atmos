import 'package:dio/dio.dart';

/// Maps generic 4xx / 5xx responses to clearer messages so the UI can
/// show something more useful than the raw error JSON. The original
/// status code is preserved on the DioException so callers can still
/// branch on `e.response?.statusCode`.
class FriendlyErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final int? status = err.response?.statusCode;
    String friendly = err.message ?? 'Network error';

    if (status == 401) {
      final dynamic data = err.response?.data;
      final String reason = data is Map<String, dynamic>
          ? (data['reason']?.toString() ?? '')
          : '';
      if (reason.contains('integrity') ||
          reason.contains('package') ||
          reason.contains('verdict') ||
          reason.contains('verification') ||
          reason.contains('configured')) {
        friendly =
            "This copy of Atmos isn't recognized. Install the latest version from the Play Store.";
      } else {
        friendly = 'Sign-in required.';
      }
    } else if (status == 429) {
      friendly = "You've hit today's free limit. Upgrade for more or try again tomorrow.";
    } else if (status == 503) {
      friendly = "Atmos is briefly unavailable. Try again in a minute.";
    } else if (status != null && status >= 500) {
      friendly = "Something broke on our side. Try again in a moment.";
    } else if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.sendTimeout) {
      friendly = "Slow connection. Try again.";
    } else if (err.type == DioExceptionType.connectionError) {
      friendly = "Can't reach Atmos. Check your connection.";
    }

    handler.next(DioException(
      requestOptions: err.requestOptions,
      response: err.response,
      type: err.type,
      message: friendly,
      error: err.error,
      stackTrace: err.stackTrace,
    ));
  }
}
