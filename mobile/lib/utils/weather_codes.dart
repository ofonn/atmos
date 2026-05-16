import 'package:flutter/material.dart';

import '../theme/colors.dart';

/// WMO weather code utilities — ported from `src/lib/weatherUtils.ts`.
class Wmo {
  Wmo._();

  static const Map<int, String> _desc = <int, String>{
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Rime fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
    56: 'Light freezing drizzle', 57: 'Freezing drizzle',
    61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain',
    66: 'Light freezing rain', 67: 'Heavy freezing rain',
    71: 'Light snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Light showers', 81: 'Moderate showers', 82: 'Heavy showers',
    85: 'Light snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Thunderstorm + heavy hail',
  };

  static String describe(int code) => _desc[code] ?? 'Code $code';

  static String emoji(int code, {bool isDay = true}) {
    if (code == 0) return isDay ? '☀️' : '🌕';
    if (code == 1) return isDay ? '🌤️' : '🌙';
    if (code == 2) return isDay ? '⛅' : '🌥️';
    if (code == 3) return '☁️';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 55) return isDay ? '🌦️' : '🌧️';
    if (code >= 56 && code <= 57) return '🌨️';
    if (code >= 61 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return isDay ? '🌦️' : '🌧️';
    if (code >= 85 && code <= 86) return '🌨️';
    if (code >= 95) return '⛈️';
    return isDay ? '🌤️' : '🌙';
  }

  /// Three-stop gradient used by the 3D icon halo on the home screen.
  static List<Color> iconGradient(int code, {bool isDark = true}) {
    if (code == 0 || code == 1) {
      return <Color>[
        const Color(0xFFFFD359),
        const Color(0xFFFFB800),
        isDark ? const Color(0xFFFF8C00) : const Color(0xFFFFB800),
      ];
    }
    if (code == 2 || code == 3 || (code >= 45 && code <= 48)) {
      return <Color>[
        const Color(0xFF94A3B8),
        const Color(0xFF64748B),
        isDark ? const Color(0xFF475569) : const Color(0xFF94A3B8),
      ];
    }
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      return <Color>[
        const Color(0xFF60A5FA),
        const Color(0xFF3B82F6),
        isDark ? const Color(0xFF1D4ED8) : const Color(0xFF60A5FA),
      ];
    }
    if (code >= 71 && code <= 86) {
      return <Color>[
        const Color(0xFFE0E7FF),
        const Color(0xFFC7D2FE),
        isDark ? const Color(0xFFA5B4FC) : const Color(0xFFE0E7FF),
      ];
    }
    if (code >= 95) {
      return <Color>[
        const Color(0xFF8B5CF6),
        const Color(0xFF6D28D9),
        isDark ? const Color(0xFF4C1D95) : const Color(0xFF8B5CF6),
      ];
    }
    return <Color>[
      const Color(0xFF94A3B8),
      const Color(0xFF64748B),
      isDark ? const Color(0xFF475569) : const Color(0xFF94A3B8),
    ];
  }
}

Color uviColor(double uvi) {
  if (uvi <= 2) return const Color(0xFF22C55E);
  if (uvi <= 5) return const Color(0xFFEAB308);
  if (uvi <= 7) return const Color(0xFFF97316);
  if (uvi <= 10) return const Color(0xFFEF4444);
  return const Color(0xFFA855F7);
}

String uviLabel(double uvi) {
  if (uvi <= 2) return 'Low';
  if (uvi <= 5) return 'Moderate';
  if (uvi <= 7) return 'High';
  if (uvi <= 10) return 'Very High';
  return 'Extreme';
}

Color aqiColor(int aqi) {
  const List<Color> palette = <Color>[
    Color(0xFF22C55E),
    Color(0xFFA3E635),
    Color(0xFFEAB308),
    Color(0xFFF97316),
    Color(0xFFEF4444),
  ];
  if (aqi < 1 || aqi > 5) return const Color(0xFF94A3B8);
  return palette[aqi - 1];
}

String aqiLabel(int aqi) {
  const List<String> labels = <String>['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
  if (aqi < 1 || aqi > 5) return 'Unknown';
  return labels[aqi - 1];
}

String windDir16(double deg) {
  const List<String> pts = <String>[
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  return pts[(deg / 22.5).round() % 16];
}

Color particleEffectColor(int code, {bool isDay = true}) {
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return AtmosColors.coolAccent;
  if (code >= 71 && code <= 86) return Colors.white;
  if (code >= 95) return AtmosColors.darkPrimary;
  return Colors.transparent;
}

enum WeatherEffect { none, rain, snow, lightning }

WeatherEffect effectFor(int code, {bool isDay = true}) {
  if (code >= 95) return WeatherEffect.lightning;
  if (code >= 71 && code <= 86) return WeatherEffect.snow;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return WeatherEffect.rain;
  return WeatherEffect.none;
}
