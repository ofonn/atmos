import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'storage.dart';

@immutable
class AtmosSettings {
  const AtmosSettings({
    this.tempUnit = 'C',
    this.windUnit = 'kmh',
    this.timeFormat = '24h',
    this.headlineTone = 'casual',
    this.headlineTwoLine = false,
    this.headlineLocationFlavor = false,
    this.headlineTimeAware = true,
    this.themeMode = ThemeMode.system,
    this.aiEmojiUse = 'light',
    this.aiVerbosity = 'medium',
    this.videoBackground = 'unset',
    this.videoBackgroundQuality = 'auto',
    this.onboardingComplete = false,
  });

  final String tempUnit; // 'C' | 'F'
  final String windUnit; // 'kmh' | 'mph'
  final String timeFormat; // '12h' | '24h'
  final String headlineTone;
  final bool headlineTwoLine;
  final bool headlineLocationFlavor;
  final bool headlineTimeAware;
  final ThemeMode themeMode;
  // AI personality
  final String aiEmojiUse; // 'none' | 'light' | 'heavy'
  final String aiVerbosity; // 'short' | 'medium' | 'long'
  // Home background
  final String videoBackground; // 'unset' | 'on' | 'off'
  final String videoBackgroundQuality; // 'auto' | 'low' | 'hd'
  final bool onboardingComplete;

  AtmosSettings copyWith({
    String? tempUnit,
    String? windUnit,
    String? timeFormat,
    String? headlineTone,
    bool? headlineTwoLine,
    bool? headlineLocationFlavor,
    bool? headlineTimeAware,
    ThemeMode? themeMode,
    String? aiEmojiUse,
    String? aiVerbosity,
    String? videoBackground,
    String? videoBackgroundQuality,
    bool? onboardingComplete,
  }) =>
      AtmosSettings(
        tempUnit: tempUnit ?? this.tempUnit,
        windUnit: windUnit ?? this.windUnit,
        timeFormat: timeFormat ?? this.timeFormat,
        headlineTone: headlineTone ?? this.headlineTone,
        headlineTwoLine: headlineTwoLine ?? this.headlineTwoLine,
        headlineLocationFlavor: headlineLocationFlavor ?? this.headlineLocationFlavor,
        headlineTimeAware: headlineTimeAware ?? this.headlineTimeAware,
        themeMode: themeMode ?? this.themeMode,
        aiEmojiUse: aiEmojiUse ?? this.aiEmojiUse,
        aiVerbosity: aiVerbosity ?? this.aiVerbosity,
        videoBackground: videoBackground ?? this.videoBackground,
        videoBackgroundQuality: videoBackgroundQuality ?? this.videoBackgroundQuality,
        onboardingComplete: onboardingComplete ?? this.onboardingComplete,
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'tempUnit': tempUnit,
        'windUnit': windUnit,
        'timeFormat': timeFormat,
        'headlineTone': headlineTone,
        'headlineTwoLine': headlineTwoLine,
        'headlineLocationFlavor': headlineLocationFlavor,
        'headlineTimeAware': headlineTimeAware,
        'themeMode': themeMode.name,
        'aiEmojiUse': aiEmojiUse,
        'aiVerbosity': aiVerbosity,
        'videoBackground': videoBackground,
        'videoBackgroundQuality': videoBackgroundQuality,
        'onboardingComplete': onboardingComplete,
      };

  factory AtmosSettings.fromJson(Map<String, dynamic> j) {
    final String mode = j['themeMode']?.toString() ?? 'system';
    return AtmosSettings(
      tempUnit: j['tempUnit']?.toString() ?? 'C',
      windUnit: j['windUnit']?.toString() ?? 'kmh',
      timeFormat: j['timeFormat']?.toString() ?? '24h',
      headlineTone: j['headlineTone']?.toString() ?? 'casual',
      headlineTwoLine: j['headlineTwoLine'] as bool? ?? false,
      headlineLocationFlavor: j['headlineLocationFlavor'] as bool? ?? false,
      headlineTimeAware: j['headlineTimeAware'] as bool? ?? true,
      themeMode: ThemeMode.values.firstWhere(
        (ThemeMode m) => m.name == mode,
        orElse: () => ThemeMode.system,
      ),
      aiEmojiUse: j['aiEmojiUse']?.toString() ?? 'light',
      aiVerbosity: j['aiVerbosity']?.toString() ?? 'medium',
      videoBackground: j['videoBackground']?.toString() ?? 'unset',
      videoBackgroundQuality: j['videoBackgroundQuality']?.toString() ?? 'auto',
      onboardingComplete: j['onboardingComplete'] as bool? ?? false,
    );
  }
}

class SettingsNotifier extends Notifier<AtmosSettings> {
  @override
  AtmosSettings build() {
    final String? raw = ref.read(sharedPrefsProvider).getString(StorageKeys.settings);
    if (raw == null) return const AtmosSettings();
    try {
      return AtmosSettings.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return const AtmosSettings();
    }
  }

  void _persist(AtmosSettings next) {
    state = next;
    ref.read(sharedPrefsProvider).setString(StorageKeys.settings, jsonEncode(next.toJson()));
  }

  void setTempUnit(String unit) => _persist(state.copyWith(tempUnit: unit));
  void setWindUnit(String unit) => _persist(state.copyWith(windUnit: unit));
  void setTimeFormat(String fmt) => _persist(state.copyWith(timeFormat: fmt));
  void setHeadlineTone(String tone) => _persist(state.copyWith(headlineTone: tone));
  void setHeadlineTwoLine(bool v) => _persist(state.copyWith(headlineTwoLine: v));
  void setHeadlineLocationFlavor(bool v) =>
      _persist(state.copyWith(headlineLocationFlavor: v));
  void setHeadlineTimeAware(bool v) => _persist(state.copyWith(headlineTimeAware: v));
  void setThemeMode(ThemeMode m) => _persist(state.copyWith(themeMode: m));
  void setAiEmojiUse(String v) => _persist(state.copyWith(aiEmojiUse: v));
  void setAiVerbosity(String v) => _persist(state.copyWith(aiVerbosity: v));
  void setVideoBackground(String v) => _persist(state.copyWith(videoBackground: v));
  void setVideoBackgroundQuality(String v) =>
      _persist(state.copyWith(videoBackgroundQuality: v));
  void setOnboardingComplete(bool v) =>
      _persist(state.copyWith(onboardingComplete: v));

  /// Reset to defaults — keeps onboardingComplete=true so the modal
  /// doesn't re-appear.
  void resetToDefaults() => _persist(const AtmosSettings(onboardingComplete: true));
}

final NotifierProvider<SettingsNotifier, AtmosSettings> settingsProvider =
    NotifierProvider<SettingsNotifier, AtmosSettings>(SettingsNotifier.new);

const List<({String value, String label, String emoji})> headlineTones =
    <({String value, String label, String emoji})>[
  (value: 'casual', label: 'Casual', emoji: '🙂'),
  (value: 'punchy', label: 'Punchy', emoji: '🥊'),
  (value: 'sarcastic', label: 'Sarcastic', emoji: '😏'),
  (value: 'funny', label: 'Funny', emoji: '😂'),
  (value: 'dramatic', label: 'Dramatic', emoji: '🎭'),
  (value: 'informative', label: 'Informative', emoji: '📰'),
  (value: 'smart', label: 'Smart', emoji: '🧠'),
  (value: 'local', label: 'Local', emoji: '🏘️'),
];
