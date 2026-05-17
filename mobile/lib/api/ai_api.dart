import 'package:dio/dio.dart';

import 'models/ai_content.dart';
import 'models/open_meteo.dart';

class AiApi {
  AiApi(this._dio);
  final Dio _dio;

  Future<AiContent> initBriefing({
    required OpenMeteoResponse weather,
    required int localHour,
    required int localMinute,
    required String headlineTone,
    required bool headlineTwoLine,
    required bool headlineLocationFlavor,
    required bool headlineTimeAware,
    required String locationName,
    required String locationCountry,
  }) async {
    final Response<dynamic> r = await _dio.post<dynamic>(
      '/api/init',
      data: <String, dynamic>{
        'current': _currentPayload(weather),
        'hourly': _hourlyPayload(weather),
        'daily': _dailyPayload(weather),
        'localHour': localHour,
        'localMinute': localMinute,
        'headlineTone': headlineTone,
        'headlineTwoLine': headlineTwoLine,
        'headlineLocationFlavor': headlineLocationFlavor,
        'headlineTimeAware': headlineTimeAware,
        'locationName': locationName,
        'locationCountry': locationCountry,
      },
    );
    final Map<String, dynamic> data = r.data as Map<String, dynamic>;
    return AiContent.fromJson(<String, dynamic>{
      ...data,
      'fetchedAt': DateTime.now().millisecondsSinceEpoch,
    });
  }

  Future<String> chat({
    required String message,
    required List<ChatMessage> history,
    required OpenMeteoResponse weather,
    required int localHour,
    required int localMinute,
    String? emojiUse,
    String? verbosity,
  }) async {
    final Response<dynamic> r = await _dio.post<dynamic>(
      '/api/chat',
      data: <String, dynamic>{
        'message': message,
        'history': history
            .map((ChatMessage m) => <String, dynamic>{'role': m.role, 'content': m.content})
            .toList(),
        'weather': <String, dynamic>{
          'current': _currentPayload(weather),
          'hourly': _hourlyPayload(weather),
          'daily': _dailyPayload(weather),
        },
        'localHour': localHour,
        'localMinute': localMinute,
        if (emojiUse != null || verbosity != null)
          'personality': <String, dynamic>{
            if (emojiUse != null) 'emojiUse': emojiUse,
            if (verbosity != null) 'verbosity': verbosity,
          },
      },
    );
    final Map<String, dynamic> data = r.data as Map<String, dynamic>;
    return data['response']?.toString() ?? '';
  }

  Map<String, dynamic> _currentPayload(OpenMeteoResponse w) {
    final OmCurrent c = w.current;
    return <String, dynamic>{
      'temp': c.temperature2m,
      'feelsLike': c.apparentTemperature,
      'humidity': c.relativeHumidity2m,
      'windSpeed': c.windSpeed10m,
      'conditionCode': c.weatherCode,
      'description': 'WMO ${c.weatherCode}',
      'isDay': c.isDay == 1,
      'precipitation': c.precipitation,
    };
  }

  List<Map<String, dynamic>> _hourlyPayload(OpenMeteoResponse w) {
    final int n = w.nowHourIndex;
    final List<Map<String, dynamic>> out = <Map<String, dynamic>>[];
    final int end = (n + 12).clamp(0, w.hourly.time.length);
    for (int i = n; i < end; i++) {
      out.add(<String, dynamic>{
        'time': w.hourly.time[i],
        'temp': w.hourly.temperature2m.elementAtOrNull(i) ?? 0,
        'conditionCode': w.hourly.weatherCode.elementAtOrNull(i) ?? 0,
        'pop': w.hourly.precipitationProbability.elementAtOrNull(i) ?? 0,
      });
    }
    return out;
  }

  List<Map<String, dynamic>> _dailyPayload(OpenMeteoResponse w) {
    final List<Map<String, dynamic>> out = <Map<String, dynamic>>[];
    final int n = w.daily.time.length.clamp(0, 7);
    for (int i = 0; i < n; i++) {
      out.add(<String, dynamic>{
        'date': w.daily.time[i],
        'tempMin': w.daily.temperature2mMin.elementAtOrNull(i) ?? 0,
        'tempMax': w.daily.temperature2mMax.elementAtOrNull(i) ?? 0,
        'conditionCode': w.daily.weatherCode.elementAtOrNull(i) ?? 0,
        'pop': w.daily.precipitationProbabilityMax.elementAtOrNull(i) ?? 0,
      });
    }
    return out;
  }
}

extension _ListSafe<T> on List<T> {
  T? elementAtOrNull(int i) => (i >= 0 && i < length) ? this[i] : null;
}
