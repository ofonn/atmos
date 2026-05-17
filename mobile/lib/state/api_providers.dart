import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/ai_api.dart';
import '../api/dio_client.dart';
import '../api/weather_api.dart';

final Provider<Dio> dioProvider = Provider<Dio>((Ref ref) => createDio());
final Provider<WeatherApi> weatherApiProvider =
    Provider<WeatherApi>((Ref ref) => WeatherApi(ref.watch(dioProvider)));
final Provider<GeoApi> geoApiProvider =
    Provider<GeoApi>((Ref ref) => GeoApi(ref.watch(dioProvider)));
final Provider<AiApi> aiApiProvider =
    Provider<AiApi>((Ref ref) => AiApi(ref.watch(dioProvider)));
