import 'package:dio/dio.dart';

import 'models/location.dart';
import 'models/open_meteo.dart';

class WeatherApi {
  WeatherApi(this._dio);
  final Dio _dio;

  Future<OpenMeteoResponse> forecast({required double lat, required double lon}) async {
    final Response<dynamic> r = await _dio.get<dynamic>(
      '/api/openmeteo',
      queryParameters: <String, dynamic>{'lat': lat, 'lon': lon},
    );
    return OpenMeteoResponse.fromJson(r.data as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>?> airPollution({
    required double lat,
    required double lon,
  }) async {
    try {
      final Response<dynamic> r = await _dio.get<dynamic>(
        '/api/airpollution',
        queryParameters: <String, dynamic>{'lat': lat, 'lon': lon},
      );
      return r.data as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }
}

class GeoApi {
  GeoApi(this._dio);
  final Dio _dio;

  Future<List<AtmosLocation>> search(String query) async {
    final Response<dynamic> r = await _dio.get<dynamic>(
      '/api/geocode',
      queryParameters: <String, dynamic>{'q': query},
    );
    final List<dynamic> list = (r.data as List<dynamic>? ?? <dynamic>[]);
    return list
        .map((dynamic e) => AtmosLocation.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  }

  Future<AtmosLocation?> reverse(double lat, double lon) async {
    final Response<dynamic> r = await _dio.get<dynamic>(
      '/api/geocode',
      queryParameters: <String, dynamic>{'lat': lat, 'lon': lon},
    );
    final dynamic data = r.data;
    if (data is List && data.isNotEmpty) {
      return AtmosLocation.fromJson(data.first as Map<String, dynamic>);
    }
    if (data is Map<String, dynamic>) {
      return AtmosLocation.fromJson(data);
    }
    return null;
  }

  Future<AtmosLocation?> ipLocation() async {
    try {
      final Response<dynamic> r = await _dio.get<dynamic>('/api/ip-location');
      final dynamic data = r.data;
      if (data is Map<String, dynamic>) return AtmosLocation.fromJson(data);
      return null;
    } catch (_) {
      return null;
    }
  }
}
