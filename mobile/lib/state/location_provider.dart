import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

import '../api/models/location.dart';
import 'api_providers.dart';
import 'storage.dart';

@immutable
class LocationState {
  const LocationState({
    this.current,
    this.saved = const <AtmosLocation>[],
    this.loading = true,
    this.error,
  });

  final AtmosLocation? current;
  final List<AtmosLocation> saved;
  final bool loading;
  final String? error;

  LocationState copyWith({
    AtmosLocation? current,
    List<AtmosLocation>? saved,
    bool? loading,
    String? error,
    bool clearError = false,
  }) =>
      LocationState(
        current: current ?? this.current,
        saved: saved ?? this.saved,
        loading: loading ?? this.loading,
        error: clearError ? null : (error ?? this.error),
      );
}

class LocationNotifier extends AsyncNotifier<LocationState> {
  @override
  Future<LocationState> build() async {
    final saved = _readSaved();
    final cached = _readCurrent();
    LocationState seed = LocationState(current: cached, saved: saved, loading: false);
    // Background-refresh GPS if we have an existing location; else go through fallback chain.
    if (cached == null) {
      seed = await _firstTimeBootstrap(seed);
    } else {
      _silentGpsUpdate();
    }
    return seed;
  }

  List<AtmosLocation> _readSaved() {
    final String? raw = ref.read(sharedPrefsProvider).getString(StorageKeys.savedLocations);
    if (raw == null) return const <AtmosLocation>[];
    try {
      final List<dynamic> list = jsonDecode(raw) as List<dynamic>;
      return list
          .map((dynamic e) => AtmosLocation.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return const <AtmosLocation>[];
    }
  }

  AtmosLocation? _readCurrent() {
    final String? raw = ref.read(sharedPrefsProvider).getString(StorageKeys.location);
    if (raw == null) return null;
    try {
      return AtmosLocation.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<LocationState> _firstTimeBootstrap(LocationState seed) async {
    final geo = ref.read(geoApiProvider);
    final AtmosLocation? ip = await geo.ipLocation();
    LocationState next = seed;
    if (ip != null) {
      next = next.copyWith(current: ip);
      _persistCurrent(ip);
    }
    _silentGpsUpdate();
    return next;
  }

  Future<void> _silentGpsUpdate() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) return;
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        return;
      }
      final Position pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
      );
      final geo = ref.read(geoApiProvider);
      final AtmosLocation? loc = await geo.reverse(pos.latitude, pos.longitude);
      if (loc != null) _setAsCurrent(loc);
    } catch (e) {
      debugPrint('GPS sync failed: $e');
    }
  }

  void _persistCurrent(AtmosLocation loc) {
    ref.read(sharedPrefsProvider).setString(StorageKeys.location, jsonEncode(loc.toJson()));
  }

  void _persistSaved(List<AtmosLocation> list) {
    ref.read(sharedPrefsProvider).setString(
          StorageKeys.savedLocations,
          jsonEncode(list.map((AtmosLocation l) => l.toJson()).toList()),
        );
  }

  void _setAsCurrent(AtmosLocation loc) {
    final LocationState? prev = state.valueOrNull;
    if (prev == null) return;
    state = AsyncData<LocationState>(prev.copyWith(current: loc, loading: false));
    _persistCurrent(loc);
  }

  Future<void> searchCity(String city) async {
    state = AsyncData<LocationState>(
      (state.valueOrNull ?? const LocationState()).copyWith(loading: true, clearError: true),
    );
    try {
      final List<AtmosLocation> results = await ref.read(geoApiProvider).search(city);
      if (results.isEmpty) {
        state = AsyncData<LocationState>(
          (state.valueOrNull ?? const LocationState())
              .copyWith(loading: false, error: 'No matches for "$city"'),
        );
        return;
      }
      final AtmosLocation first = results.first;
      saveLocation(first);
      _setAsCurrent(first);
    } catch (e) {
      state = AsyncData<LocationState>(
        (state.valueOrNull ?? const LocationState())
            .copyWith(loading: false, error: 'Search failed: $e'),
      );
    }
  }

  Future<List<AtmosLocation>> rawSearch(String query) async {
    if (query.trim().isEmpty) return const <AtmosLocation>[];
    return ref.read(geoApiProvider).search(query.trim());
  }

  void setAsCurrentLocation(AtmosLocation loc) {
    saveLocation(loc);
    _setAsCurrent(loc);
  }

  void saveLocation(AtmosLocation loc) {
    final LocationState? prev = state.valueOrNull;
    if (prev == null) return;
    if (prev.saved.any((AtmosLocation l) => l == loc)) return;
    final List<AtmosLocation> next = <AtmosLocation>[...prev.saved, loc];
    state = AsyncData<LocationState>(prev.copyWith(saved: next));
    _persistSaved(next);
  }

  void removeLocation(AtmosLocation loc) {
    final LocationState? prev = state.valueOrNull;
    if (prev == null) return;
    final List<AtmosLocation> next = prev.saved.where((AtmosLocation l) => l != loc).toList();
    state = AsyncData<LocationState>(prev.copyWith(saved: next));
    _persistSaved(next);
  }

  /// Apply or clear a tag on a saved location. Passing `tag=null`
  /// clears it. The unique partial index on `saved_locations(user_id, tag)
  /// where tag is not null` means a tag can only live on one row per
  /// user — set it here we strip it from any other row first.
  void setTag(AtmosLocation loc, String? tag) {
    final LocationState? prev = state.valueOrNull;
    if (prev == null) return;
    final List<AtmosLocation> next = prev.saved.map((AtmosLocation l) {
      if (l == loc) return l.copyWith(tag: tag);
      // Strip the same tag from any sibling row.
      if (tag != null && l.tag == tag) return l.copyWith(tag: null);
      return l;
    }).toList();
    state = AsyncData<LocationState>(prev.copyWith(saved: next));
    _persistSaved(next);
  }

  /// Convenience: switch the user's current weather to the saved
  /// location tagged `home` or `work`. No-op if no row has that tag.
  void switchToTag(String tag) {
    final LocationState? prev = state.valueOrNull;
    if (prev == null) return;
    final AtmosLocation? match = prev.saved.cast<AtmosLocation?>().firstWhere(
          (AtmosLocation? l) => l?.tag == tag,
          orElse: () => null,
        );
    if (match != null) _setAsCurrent(match);
  }

  Future<void> syncGps() async {
    final perm = await Permission.locationWhenInUse.request();
    if (perm.isDenied || perm.isPermanentlyDenied) {
      state = AsyncData<LocationState>(
        (state.valueOrNull ?? const LocationState())
            .copyWith(error: 'Location permission denied'),
      );
      return;
    }
    state = AsyncData<LocationState>(
      (state.valueOrNull ?? const LocationState()).copyWith(loading: true, clearError: true),
    );
    try {
      final Position pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      final AtmosLocation? loc = await ref.read(geoApiProvider).reverse(pos.latitude, pos.longitude);
      if (loc != null) _setAsCurrent(loc);
    } catch (e) {
      state = AsyncData<LocationState>(
        (state.valueOrNull ?? const LocationState())
            .copyWith(loading: false, error: 'GPS error: $e'),
      );
    }
  }
}

final AsyncNotifierProvider<LocationNotifier, LocationState> locationProvider =
    AsyncNotifierProvider<LocationNotifier, LocationState>(LocationNotifier.new);
