import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Storage key parity with the website (`atmos_*` localStorage keys).
class StorageKeys {
  StorageKeys._();
  static const String location = 'atmos_location';
  static const String savedLocations = 'atmos_saved_locations';
  static const String chatMessages = 'atmos_chat_messages';
  static const String aiContent = 'atmos_ai_content';
  static const String settings = 'atmos_settings';
  static const String cachedWeather = 'atmos_cached_weather';
}

/// Initialised in `app.dart` before `runApp`.
final Provider<SharedPreferences> sharedPrefsProvider = Provider<SharedPreferences>(
  (Ref ref) => throw UnimplementedError('Override sharedPrefsProvider before use.'),
);
