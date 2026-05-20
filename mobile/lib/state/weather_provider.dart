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
    // Offline-first: return null synchronously so the home screen renders its
    // welcome/empty state immediately. The fetch runs in background and emits
    // an AsyncData/AsyncError when it lands (or after a 10s timeout).
    Future<void>.microtask(() async {
      try {
        final WeatherSnapshot snap =
            await _fetch(current).timeout(const Duration(seconds: 10));
        state = AsyncData<WeatherSnapshot?>(snap);
      } catch (e, st) {
        state = AsyncError<WeatherSnapshot?>(e, st);
      }
    });
    return null;
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
      state = AsyncData<WeatherSnapshot?>(
        await _fetch(loc).timeout(const Duration(seconds: 10)),
      );
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
    // Offline-first: don't block the UI on the AQI fetch.
    Future<void>.microtask(() async {
      try {
        final Map<String, dynamic>? data = await ref
            .read(weatherApiProvider)
            .airPollution(lat: loc.lat, lon: loc.lon)
            .timeout(const Duration(seconds: 8));
        state = AsyncData<Map<String, dynamic>?>(data);
      } catch (e, st) {
        state = AsyncError<Map<String, dynamic>?>(e, st);
      }
    });
    return null;
  }
}

final AsyncNotifierProvider<AirQualityNotifier, Map<String, dynamic>?> airQualityProvider =
    AsyncNotifierProvider<AirQualityNotifier, Map<String, dynamic>?>(AirQualityNotifier.new);
