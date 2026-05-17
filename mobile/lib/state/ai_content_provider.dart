import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/models/ai_content.dart';
import 'api_providers.dart';
import 'settings_provider.dart';
import 'storage.dart';
import 'weather_provider.dart';

const int _ttlMs = 60 * 60 * 1000; // 1 hour

class AiContentNotifier extends AsyncNotifier<AiContent?> {
  @override
  Future<AiContent?> build() async {
    ref.watch(weatherProvider); // refetch on weather change

    final WeatherSnapshot? snap = ref.read(weatherProvider).valueOrNull;
    if (snap == null) return null;

    final AiContent? cached = _readCache();
    if (cached != null && DateTime.now().millisecondsSinceEpoch - cached.fetchedAt < _ttlMs) {
      return cached;
    }
    return _generate(snap);
  }

  AiContent? _readCache() {
    final String? raw = ref.read(sharedPrefsProvider).getString(StorageKeys.aiContent);
    if (raw == null) return null;
    try {
      return AiContent.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  void _persist(AiContent c) {
    ref.read(sharedPrefsProvider).setString(StorageKeys.aiContent, jsonEncode(c.toJson()));
  }

  Future<AiContent> _generate(WeatherSnapshot snap) async {
    final AtmosSettings s = ref.read(settingsProvider);
    final DateTime now = DateTime.now();
    final AiContent c = await ref.read(aiApiProvider).initBriefing(
          weather: snap.data,
          localHour: now.hour,
          localMinute: now.minute,
          headlineTone: s.headlineTone,
          headlineTwoLine: s.headlineTwoLine,
          headlineLocationFlavor: s.headlineLocationFlavor,
          headlineTimeAware: s.headlineTimeAware,
          locationName: snap.location.name,
          locationCountry: snap.location.country,
        );
    _persist(c);
    return c;
  }

  Future<void> refresh({bool force = false}) async {
    final WeatherSnapshot? snap = ref.read(weatherProvider).valueOrNull;
    if (snap == null) return;
    state = const AsyncLoading<AiContent?>().copyWithPrevious(state);
    try {
      state = AsyncData<AiContent?>(await _generate(snap));
    } catch (e, st) {
      state = AsyncError<AiContent?>(e, st);
    }
  }
}

final AsyncNotifierProvider<AiContentNotifier, AiContent?> aiContentProvider =
    AsyncNotifierProvider<AiContentNotifier, AiContent?>(AiContentNotifier.new);
