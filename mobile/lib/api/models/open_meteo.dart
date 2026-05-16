import 'package:flutter/foundation.dart';

List<T> _numList<T extends num>(dynamic raw) {
  if (raw is! List) return <T>[];
  return raw.map((e) {
    if (e is num) return e as T;
    if (e == null) return (T == double ? 0.0 : 0) as T;
    return (T == double ? 0.0 : 0) as T;
  }).cast<T>().toList(growable: false);
}

List<String> _strList(dynamic raw) {
  if (raw is! List) return const <String>[];
  return raw.map((e) => e?.toString() ?? '').toList(growable: false);
}

@immutable
class OmCurrent {
  const OmCurrent({
    required this.time,
    required this.temperature2m,
    required this.relativeHumidity2m,
    required this.apparentTemperature,
    required this.isDay,
    required this.precipitation,
    required this.rain,
    required this.showers,
    required this.snowfall,
    required this.weatherCode,
    required this.cloudCover,
    required this.pressureMsl,
    required this.surfacePressure,
    required this.windSpeed10m,
    required this.windDirection10m,
    required this.windGusts10m,
  });

  final String time;
  final double temperature2m;
  final double relativeHumidity2m;
  final double apparentTemperature;
  final int isDay;
  final double precipitation;
  final double rain;
  final double showers;
  final double snowfall;
  final int weatherCode;
  final double cloudCover;
  final double pressureMsl;
  final double surfacePressure;
  final double windSpeed10m;
  final double windDirection10m;
  final double windGusts10m;

  static double _d(dynamic v) => (v is num) ? v.toDouble() : 0.0;
  static int _i(dynamic v) => (v is num) ? v.toInt() : 0;

  factory OmCurrent.fromJson(Map<String, dynamic> j) => OmCurrent(
        time: j['time']?.toString() ?? '',
        temperature2m: _d(j['temperature_2m']),
        relativeHumidity2m: _d(j['relative_humidity_2m']),
        apparentTemperature: _d(j['apparent_temperature']),
        isDay: _i(j['is_day']),
        precipitation: _d(j['precipitation']),
        rain: _d(j['rain']),
        showers: _d(j['showers']),
        snowfall: _d(j['snowfall']),
        weatherCode: _i(j['weather_code']),
        cloudCover: _d(j['cloud_cover']),
        pressureMsl: _d(j['pressure_msl']),
        surfacePressure: _d(j['surface_pressure']),
        windSpeed10m: _d(j['wind_speed_10m']),
        windDirection10m: _d(j['wind_direction_10m']),
        windGusts10m: _d(j['wind_gusts_10m']),
      );
}

@immutable
class OmHourly {
  const OmHourly({
    required this.time,
    required this.temperature2m,
    required this.relativeHumidity2m,
    required this.apparentTemperature,
    required this.precipitationProbability,
    required this.precipitation,
    required this.weatherCode,
    required this.visibility,
    required this.windSpeed10m,
    required this.windDirection10m,
    required this.windGusts10m,
    required this.uvIndex,
    required this.isDay,
    required this.dewPoint2m,
    required this.cloudCover,
    required this.pressureMsl,
  });

  final List<String> time;
  final List<double> temperature2m;
  final List<double> relativeHumidity2m;
  final List<double> apparentTemperature;
  final List<double> precipitationProbability;
  final List<double> precipitation;
  final List<int> weatherCode;
  final List<double> visibility;
  final List<double> windSpeed10m;
  final List<double> windDirection10m;
  final List<double> windGusts10m;
  final List<double> uvIndex;
  final List<int> isDay;
  final List<double> dewPoint2m;
  final List<double> cloudCover;
  final List<double> pressureMsl;

  factory OmHourly.fromJson(Map<String, dynamic> j) => OmHourly(
        time: _strList(j['time']),
        temperature2m: _numList<double>(j['temperature_2m']),
        relativeHumidity2m: _numList<double>(j['relative_humidity_2m']),
        apparentTemperature: _numList<double>(j['apparent_temperature']),
        precipitationProbability: _numList<double>(j['precipitation_probability']),
        precipitation: _numList<double>(j['precipitation']),
        weatherCode: _numList<int>(j['weather_code']),
        visibility: _numList<double>(j['visibility']),
        windSpeed10m: _numList<double>(j['wind_speed_10m']),
        windDirection10m: _numList<double>(j['wind_direction_10m']),
        windGusts10m: _numList<double>(j['wind_gusts_10m']),
        uvIndex: _numList<double>(j['uv_index']),
        isDay: _numList<int>(j['is_day']),
        dewPoint2m: _numList<double>(j['dew_point_2m']),
        cloudCover: _numList<double>(j['cloud_cover']),
        pressureMsl: _numList<double>(j['pressure_msl']),
      );
}

@immutable
class OmDaily {
  const OmDaily({
    required this.time,
    required this.weatherCode,
    required this.temperature2mMax,
    required this.temperature2mMin,
    required this.apparentTemperatureMax,
    required this.apparentTemperatureMin,
    required this.sunrise,
    required this.sunset,
    required this.daylightDuration,
    required this.sunshineDuration,
    required this.uvIndexMax,
    required this.precipitationSum,
    required this.rainSum,
    required this.snowfallSum,
    required this.precipitationHours,
    required this.precipitationProbabilityMax,
    required this.windSpeed10mMax,
    required this.windGusts10mMax,
    required this.windDirection10mDominant,
  });

  final List<String> time;
  final List<int> weatherCode;
  final List<double> temperature2mMax;
  final List<double> temperature2mMin;
  final List<double> apparentTemperatureMax;
  final List<double> apparentTemperatureMin;
  final List<String> sunrise;
  final List<String> sunset;
  final List<double> daylightDuration;
  final List<double> sunshineDuration;
  final List<double> uvIndexMax;
  final List<double> precipitationSum;
  final List<double> rainSum;
  final List<double> snowfallSum;
  final List<double> precipitationHours;
  final List<double> precipitationProbabilityMax;
  final List<double> windSpeed10mMax;
  final List<double> windGusts10mMax;
  final List<double> windDirection10mDominant;

  factory OmDaily.fromJson(Map<String, dynamic> j) => OmDaily(
        time: _strList(j['time']),
        weatherCode: _numList<int>(j['weather_code']),
        temperature2mMax: _numList<double>(j['temperature_2m_max']),
        temperature2mMin: _numList<double>(j['temperature_2m_min']),
        apparentTemperatureMax: _numList<double>(j['apparent_temperature_max']),
        apparentTemperatureMin: _numList<double>(j['apparent_temperature_min']),
        sunrise: _strList(j['sunrise']),
        sunset: _strList(j['sunset']),
        daylightDuration: _numList<double>(j['daylight_duration']),
        sunshineDuration: _numList<double>(j['sunshine_duration']),
        uvIndexMax: _numList<double>(j['uv_index_max']),
        precipitationSum: _numList<double>(j['precipitation_sum']),
        rainSum: _numList<double>(j['rain_sum']),
        snowfallSum: _numList<double>(j['snowfall_sum']),
        precipitationHours: _numList<double>(j['precipitation_hours']),
        precipitationProbabilityMax: _numList<double>(j['precipitation_probability_max']),
        windSpeed10mMax: _numList<double>(j['wind_speed_10m_max']),
        windGusts10mMax: _numList<double>(j['wind_gusts_10m_max']),
        windDirection10mDominant: _numList<double>(j['wind_direction_10m_dominant']),
      );
}

@immutable
class OmMinutely15 {
  const OmMinutely15({required this.time, required this.precipitation});
  final List<String> time;
  final List<double> precipitation;

  factory OmMinutely15.fromJson(Map<String, dynamic> j) => OmMinutely15(
        time: _strList(j['time']),
        precipitation: _numList<double>(j['precipitation']),
      );
}

@immutable
class OpenMeteoResponse {
  const OpenMeteoResponse({
    required this.current,
    required this.hourly,
    required this.daily,
    required this.minutely15,
    required this.timezone,
    required this.utcOffsetSeconds,
  });

  final OmCurrent current;
  final OmHourly hourly;
  final OmDaily daily;
  final OmMinutely15? minutely15;
  final String timezone;
  final int utcOffsetSeconds;

  factory OpenMeteoResponse.fromJson(Map<String, dynamic> j) => OpenMeteoResponse(
        current: OmCurrent.fromJson(j['current'] as Map<String, dynamic>? ?? const <String, dynamic>{}),
        hourly: OmHourly.fromJson(j['hourly'] as Map<String, dynamic>? ?? const <String, dynamic>{}),
        daily: OmDaily.fromJson(j['daily'] as Map<String, dynamic>? ?? const <String, dynamic>{}),
        minutely15: j['minutely_15'] is Map<String, dynamic>
            ? OmMinutely15.fromJson(j['minutely_15'] as Map<String, dynamic>)
            : null,
        timezone: j['timezone']?.toString() ?? 'UTC',
        utcOffsetSeconds: (j['utc_offset_seconds'] as num?)?.toInt() ?? 0,
      );

  /// Closest hourly index to wall-clock now. Mirrors logic in `src/app/page.tsx`.
  int get nowHourIndex {
    if (hourly.time.isEmpty) return 0;
    final int now = DateTime.now().millisecondsSinceEpoch;
    int closest = 0;
    int minDiff = 1 << 62;
    for (int i = 0; i < hourly.time.length; i++) {
      final int diff = (DateTime.parse(hourly.time[i]).millisecondsSinceEpoch - now).abs();
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    }
    return closest;
  }
}
