import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/models/location.dart';
import '../api/models/open_meteo.dart';
import 'api_providers.dart';
import 'location_provider.dart';

@immutable
class WeatherSnapshot {
  const WeatherSnapshot({required this.location, required this.data});
  final AtmosLocation location;
  final OpenMeteoResponse data;
}

class WeatherNotifier extends AsyncNotifier<WeatherSnapshot?> {
  Timer? _refreshTimer;

  @override
  Future<WeatherSnapshot?> build() async {
    ref.onDispose(() {
      _refreshTimer?.cancel();
    });
    final LocationState? loc = ref.watch(locationProvider).valueOrNull;
    final AtmosLocation? current = loc?.current;
    if (current == null) return null;
    _refreshTimer?.cancel();
    _refreshTimer = Timer.periodic(const Duration(minutes: 5), (_) => refresh());
    return _fetch(current);
  }

  Future<WeatherSnapshot> _fetch(AtmosLocation loc) async {
    final OpenMeteoResponse data = await ref.read(weatherApiProvider).forecast(
          lat: loc.lat,
          lon: loc.lon,
        );
    return WeatherSnapshot(location: loc, data: data);
  }

  Future<void> refresh() async {
    final AtmosLocation? loc = ref.read(locationProvider).valueOrNull?.current;
    if (loc == null) return;
    state = const AsyncLoading<WeatherSnapshot?>().copyWithPrevious(state);
    try {
      state = AsyncData<WeatherSnapshot?>(await _fetch(loc));
    } catch (e, st) {
      state = AsyncError<WeatherSnapshot?>(e, st);
    }
  }
}

final AsyncNotifierProvider<WeatherNotifier, WeatherSnapshot?> weatherProvider =
    AsyncNotifierProvider<WeatherNotifier, WeatherSnapshot?>(WeatherNotifier.new);

/// AQI (OpenWeatherMap-style) — separate so a failure doesn't block weather.
class AirQualityNotifier extends AsyncNotifier<Map<String, dynamic>?> {
  @override
  Future<Map<String, dynamic>?> build() async {
    final AtmosLocation? loc = ref.watch(locationProvider).valueOrNull?.current;
    if (loc == null) return null;
    return ref.read(weatherApiProvider).airPollution(lat: loc.lat, lon: loc.lon);
  }
}

final AsyncNotifierProvider<AirQualityNotifier, Map<String, dynamic>?> airQualityProvider =
    AsyncNotifierProvider<AirQualityNotifier, Map<String, dynamic>?>(AirQualityNotifier.new);
